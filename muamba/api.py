from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional
import requests

from muamba.models import EditalResumo, LoteDetalhado, LoteResumo

logger = logging.getLogger(__name__)

BASE_URL = "https://www25.receita.fazenda.gov.br/sle-sociedade"


class ReceitaSLEClient:
    """Cliente HTTP para comunicação com a API REST do Sistema de Leilão Eletrônico (SLE-Sociedade)."""

    def __init__(self, timeout: int = 15):
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            "Accept": "application/json, text/plain, */*",
            "Referer": f"{BASE_URL}/portal",
            "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        })

    def _get(self, path: str, params: Optional[Dict[str, Any]] = None) -> Any:
        url = f"{BASE_URL}/{path.lstrip('/')}"
        try:
            response = self.session.get(url, params=params, timeout=self.timeout)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.warning("Falha na requisição para %s: %s", url, e)
            raise

    def get_editais_disponiveis(self, apenas_com_propostas_abertas: bool = True) -> List[EditalResumo]:
        """
        Retorna a lista de editais disponíveis no portal.
        Por padrão, retorna editais com propostas abertas (situacao 2).
        """
        data = self._get("api/editais-disponiveis")
        editais: List[EditalResumo] = []
        situacoes = data.get("situacoes", [])

        for sit in situacoes:
            cod_sit = sit.get("situacao")
            # situacao 2 geralmente indica propostas abertas
            if apenas_com_propostas_abertas and cod_sit not in (2, 3):
                continue

            for item in sit.get("lista", []):
                try:
                    editais.append(EditalResumo(**item))
                except Exception as err:
                    logger.debug("Erro ao parsear edital %s: %s", item, err)

        return editais

    def get_edital_detalhe(self, unidade: str, numero: str, exercicio: str) -> Dict[str, Any]:
        """Obtém os dados completos do edital, incluindo a lista resumida de lotes (listaLotes)."""
        return self._get(f"api/edital/{unidade}/{numero}/{exercicio}")

    def get_lote_detalhe(self, unidade: str, numero: str, exercicio: str, lote_nr: int) -> Optional[LoteDetalhado]:
        """Obtém os detalhes completos de um lote específico (itens, descrições, quantidades)."""
        try:
            data = self._get(f"api/lote/{unidade}/{numero}/{exercicio}/{lote_nr}")
            return LoteDetalhado(**data)
        except Exception as e:
            logger.warning("Não foi possível carregar o lote %s do edital %s/%s/%s: %s", lote_nr, unidade, numero, exercicio, e)
            return None

    @staticmethod
    def get_web_url(unidade: str, numero: str, exercicio: str, lote_nr: int) -> str:
        """Gera a URL pública direta para visualizar o lote na interface web do SLE."""
        return f"{BASE_URL}/portal/edital/{unidade}/{numero}/{exercicio}/lote/{lote_nr}"
