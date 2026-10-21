from __future__ import annotations

import unicodedata
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Callable, Iterable, List, Optional
import pandas as pd

from muamba.api import ReceitaSLEClient
from muamba.models import EditalResumo, ItemLote, LoteEncontrado


def normalizar_texto(texto: str) -> str:
    """Remove acentos, converte para minúsculas e remove espaços extras."""
    if not texto:
        return ""
    nfkd = unicodedata.normalize("NFKD", texto)
    sem_acento = "".join([c for c in nfkd if not unicodedata.combining(c)])
    return sem_acento.lower().strip()


class ScannerOportunidades:
    """Motor de busca e filtragem de lotes nos editais da Receita Federal."""

    def __init__(self, client: Optional[ReceitaSLEClient] = None, max_workers: int = 10):
        self.client = client or ReceitaSLEClient()
        self.max_workers = max_workers

    def _processar_lote(
        self,
        unidade: str,
        numero: str,
        exercicio: str,
        lote_num: int,
        lote_info: dict,
        edital: EditalResumo,
        keywords_norm: List[str],
        permite_pf_lote: bool,
        valor_min: float,
    ) -> Optional[LoteEncontrado]:
        """Obtém detalhes do lote e avalia critérios de busca."""
        detalhe = self.client.get_lote_detalhe(unidade, numero, exercicio, lote_num)
        if not detalhe or not detalhe.itensDetalhesLote:
            return None

        itens_match: List[ItemLote] = []
        for item in detalhe.itensDetalhesLote:
            desc_norm = normalizar_texto(item.descricao)
            if not keywords_norm:
                itens_match.append(item)
            else:
                if any(kw in desc_norm for kw in keywords_norm):
                    itens_match.append(item)

        # Se nenhuma palavra-chave bateu nos itens, verifica se a categoria do lote bate
        if not itens_match and keywords_norm and detalhe.tipo:
            tipo_norm = normalizar_texto(detalhe.tipo)
            if any(kw in tipo_norm for kw in keywords_norm):
                itens_match = detalhe.itensDetalhesLote

        if not itens_match:
            return None

        url = self.client.get_web_url(unidade, numero, exercicio, lote_num)
        return LoteEncontrado(
            edital=edital.edital,
            edle=edital.edle,
            numero_lote=lote_num,
            categoria=detalhe.tipo or lote_info.get("tipo", "DIVERSOS"),
            permite_pf=permite_pf_lote,
            cidade=edital.cidade or detalhe.cidade or "Não informada",
            valor_minimo=valor_min,
            valor_avaliacao=float(lote_info.get("valorAvaliacao", 0.0) or 0.0),
            itens_correspondentes=itens_match,
            todos_itens=detalhe.itensDetalhesLote,
            url_lote=url,
        )

    def escanear(
        self,
        palavras_chave: Optional[List[str]] = None,
        apenas_pf: bool = False,
        valor_maximo: Optional[float] = None,
        cidades: Optional[List[str]] = None,
        limite_editais: Optional[int] = None,
        progresso_callback: Optional[Callable[[str, int, int], None]] = None,
    ) -> List[LoteEncontrado]:
        """
        Executa uma varredura paralela nos editais abertos e localiza lotes de interesse.
        """
        keywords_norm = [normalizar_texto(k) for k in (palavras_chave or []) if k.strip()]
        cidades_norm = [normalizar_texto(c) for c in (cidades or []) if c.strip()]

        editais = self.client.get_editais_disponiveis(apenas_com_propostas_abertas=True)
        if limite_editais:
            editais = editais[:limite_editais]

        resultados: List[LoteEncontrado] = []
        total_editais = len(editais)

        for idx, edital in enumerate(editais, 1):
            cidade_nome = edital.cidade or "Brasil"
            if progresso_callback:
                progresso_callback(f"Analisando edital {edital.edle} ({cidade_nome})...", idx, total_editais)

            # Filtro prévio por cidade no nível do edital
            if cidades_norm:
                ed_cidade = normalizar_texto(edital.cidade or "")
                if not any(c in ed_cidade for c in cidades_norm):
                    continue

            # Filtro prévio por PF no nível do edital
            if apenas_pf and not edital.permitePF:
                continue

            try:
                unidade, numero, exercicio = edital.parse_edle_parts()
                dados_edital = self.client.get_edital_detalhe(unidade, numero, exercicio)
            except Exception:
                continue

            lista_lotes = dados_edital.get("listaLotes", [])

            # Filtra candidatos no nível do lote antes de disparar requisições
            candidatos = []
            for lote_info in lista_lotes:
                permite_pf_lote = lote_info.get("permitePF", False)
                if apenas_pf and not permite_pf_lote:
                    continue

                valor_min = float(lote_info.get("valorMinimo", 0.0) or 0.0)
                if valor_maximo is not None and valor_min > valor_maximo:
                    continue

                lote_num = lote_info.get("nrAtribuido") or lote_info.get("loleNrSq")
                if not lote_num:
                    continue

                candidatos.append((lote_num, lote_info, permite_pf_lote, valor_min))

            if not candidatos:
                continue

            # Processa os candidatos em paralelo para máxima velocidade
            with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
                future_to_lote = {
                    executor.submit(
                        self._processar_lote,
                        unidade,
                        numero,
                        exercicio,
                        lote_num,
                        lote_info,
                        edital,
                        keywords_norm,
                        permite_pf_lote,
                        valor_min,
                    ): lote_num
                    for lote_num, lote_info, permite_pf_lote, valor_min in candidatos
                }

                for future in as_completed(future_to_lote):
                    try:
                        res = future.result()
                        if res:
                            resultados.append(res)
                    except Exception:
                        pass

        # Ordena os resultados por edital e lote
        resultados.sort(key=lambda x: (x.edle, x.numero_lote))
        return resultados

    @staticmethod
    def para_dataframe(lotes: Iterable[LoteEncontrado]) -> pd.DataFrame:
        """Converte a lista de lotes encontrados em um DataFrame do Pandas para análise/exportação."""
        linhas = []
        for lote in lotes:
            resumo_itens = " | ".join(
                f"{int(it.quantidade) if it.quantidade else 1}x {it.descricao}"
                for it in lote.itens_correspondentes
            )
            linhas.append({
                "Edital": lote.edle,
                "Lote": lote.numero_lote,
                "Categoria": lote.categoria,
                "Permite PF": "Sim" if lote.permite_pf else "Não (Apenas PJ)",
                "Cidade/Região": lote.cidade,
                "Lance Mínimo (R$)": lote.valor_minimo,
                "Avaliação (R$)": lote.valor_avaliacao,
                "Itens Encontrados": resumo_itens,
                "Total Itens no Lote": len(lote.todos_itens),
                "Link Portal": lote.url_lote,
            })
        return pd.DataFrame(linhas)
