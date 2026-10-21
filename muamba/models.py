from __future__ import annotations

from typing import List, Optional, Tuple
from pydantic import BaseModel, Field


class ItemLote(BaseModel):
    """Representa um item individual dentro de um lote."""
    recintoArmazenador: Optional[str] = Field(default=None, description="Local/depósito de armazenagem")
    nrReferencia: Optional[str] = Field(default=None, description="Número de referência interna")
    quantidade: Optional[float] = Field(default=1, description="Quantidade do item no lote")
    unMedida: Optional[str] = Field(default="un", description="Unidade de medida (un, kg, cx, etc.)")
    descricao: str = Field(default="", description="Descrição completa da mercadoria")


class LoteResumo(BaseModel):
    """Resumo de um lote listado em um edital."""
    loleNrSq: Optional[int] = Field(default=None)
    nrAtribuido: int = Field(default=0, description="Número do lote visível ao público")
    tipo: Optional[str] = Field(default=None, description="Categoria do lote (Informática, Veículo, etc.)")
    valorMinimo: Optional[float] = Field(default=0.0, description="Lance mínimo inicial em R$")
    valorAvaliacao: Optional[float] = Field(default=0.0, description="Valor estimado de avaliação em R$")
    permitePF: bool = Field(default=False, description="Se aceita propostas de Pessoa Física")
    possuiImagens: Optional[bool] = Field(default=False)


class LoteDetalhado(LoteResumo):
    """Detalhes completos de um lote, incluindo os itens componentes."""
    edle: Optional[str] = Field(default=None)
    edital: Optional[str] = Field(default=None)
    orgao: Optional[str] = Field(default=None)
    cidade: Optional[str] = Field(default=None)
    itensDetalhesLote: List[ItemLote] = Field(default_factory=list, description="Lista de mercadorias no lote")


class EditalResumo(BaseModel):
    """Resumo de um edital listado nos editais disponíveis."""
    edital: str = Field(..., description="Número formatado do edital (ex: 0600100/000006/2026)")
    edle: str = Field(..., description="Identificador simplificado edle (ex: 600100/6/2026)")
    codigoSituacao: Optional[int] = Field(default=None)
    permitePF: bool = Field(default=False)
    tipo: Optional[str] = Field(default=None)
    uaNm: Optional[str] = Field(default=None, description="Nome da Unidade Administrativa")
    orgao: Optional[str] = Field(default=None)
    cidade: Optional[str] = Field(default=None)
    dataInicioPropostas: Optional[str] = Field(default=None)
    dataFimPropostas: Optional[str] = Field(default=None)
    dataAberturaLances: Optional[str] = Field(default=None)

    def parse_edle_parts(self) -> Tuple[str, str, str]:
        """Extrai (unidade, numero, exercicio) do campo edle."""
        parts = self.edle.strip().split("/")
        if len(parts) == 3:
            return parts[0], parts[1], parts[2]
        raise ValueError(f"Formato inesperado de edle: {self.edle}")


class LoteEncontrado(BaseModel):
    """Representa uma oportunidade de lote encontrada nos filtros."""
    edital: str
    edle: str
    numero_lote: int
    categoria: str
    permite_pf: bool
    cidade: str
    valor_minimo: float
    valor_avaliacao: float
    itens_correspondentes: List[ItemLote] = Field(default_factory=list)
    todos_itens: List[ItemLote] = Field(default_factory=list)
    url_lote: str
