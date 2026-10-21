import sys
from pathlib import Path

# Garante a raiz do repositório no sys.path para execução em CI (GitHub Actions)
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import pytest
from muamba.models import EditalResumo, ItemLote, LoteDetalhado, LoteEncontrado
from muamba.analyzer import normalizar_texto, ScannerOportunidades
from muamba.api import ReceitaSLEClient


def test_normalizar_texto():
    assert normalizar_texto("Informática & Eletrônicos!") == "informatica & eletronicos!"
    assert normalizar_texto("São Paulo - SP") == "sao paulo - sp"
    assert normalizar_texto("") == ""
    assert normalizar_texto(None) == ""


def test_edital_parse_edle():
    edital = EditalResumo(
        edital="0600100/000006/2026",
        edle="600100/6/2026",
        cidade="BELO HORIZONTE",
        permitePF=True,
    )
    unidade, numero, exercicio = edital.parse_edle_parts()
    assert unidade == "600100"
    assert numero == "6"
    assert exercicio == "2026"


def test_web_url_generation():
    url = ReceitaSLEClient.get_web_url("600100", "6", "2026", 1)
    assert url == "https://www25.receita.fazenda.gov.br/sle-sociedade/portal/edital/600100/6/2026/lote/1"


def test_dataframe_conversion():
    item = ItemLote(
        recintoArmazenador="Recinto A",
        quantidade=5,
        unMedida="un",
        descricao="APPLE IPHONE 15 128GB",
    )
    lote = LoteEncontrado(
        edital="0600100/000006/2026",
        edle="600100/6/2026",
        numero_lote=10,
        categoria="CELULARES",
        permite_pf=True,
        cidade="Belo Horizonte",
        valor_minimo=2500.0,
        valor_avaliacao=5000.0,
        itens_correspondentes=[item],
        todos_itens=[item],
        url_lote="https://fake.url",
    )

    df = ScannerOportunidades.para_dataframe([lote])
    assert len(df) == 1
    assert df.iloc[0]["Edital"] == "600100/6/2026"
    assert df.iloc[0]["Lote"] == 10
    assert "APPLE IPHONE 15" in df.iloc[0]["Itens Encontrados"]
    assert df.iloc[0]["Lance Mínimo (R$)"] == 2500.0
