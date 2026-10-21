from __future__ import annotations

"""
Módulo de exportação de dados para Excel e CSV conforme AGENT.md.
"""

from pathlib import Path
from typing import Iterable, Union
import pandas as pd
from muamba.models import LoteEncontrado
from muamba.analyzer import ScannerOportunidades


def para_dataframe(lotes: Iterable[LoteEncontrado]) -> pd.DataFrame:
    """Converte lista de lotes em DataFrame do Pandas."""
    return ScannerOportunidades.para_dataframe(lotes)


def exportar_lotes(lotes: Iterable[LoteEncontrado], destino: Union[str, Path]) -> Path:
    """Exporta os lotes encontrados para arquivo .xlsx ou .csv com base na extensão."""
    df = para_dataframe(lotes)
    caminho = Path(destino).resolve()
    caminho.parent.mkdir(parents=True, exist_ok=True)

    if caminho.suffix.lower() == ".xlsx":
        df.to_excel(caminho, index=False)
    else:
        df.to_csv(caminho, index=False, encoding="utf-8-sig")

    return caminho
