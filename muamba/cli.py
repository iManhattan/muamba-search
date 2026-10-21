from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import List, Optional

# Garante suporte a UTF-8 no Windows terminal
if sys.platform == "win32":
    try:
        if hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8")
        if hasattr(sys.stderr, "reconfigure"):
            sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TimeElapsedColumn

from muamba.analyzer import ScannerOportunidades
from muamba.api import ReceitaSLEClient

console = Console(legacy_windows=False)


def render_banner():
    """Exibe o cabeçalho inicial no terminal."""
    banner = (
        "[bold cyan][*] MUAMBA SEARCH[/bold cyan] - "
        "[yellow]Scanner de Oportunidades do Leilao da Receita Federal (SLE)[/yellow]\n"
        "[dim]Portal: https://www25.receita.fazenda.gov.br/sle-sociedade/portal[/dim]"
    )
    console.print(Panel(banner, border_style="cyan"))


def cmd_listar_editais(client: ReceitaSLEClient):
    """Lista todos os editais atualmente disponíveis."""
    with console.status("[bold green]Consultando editais disponíveis na Receita Federal..."):
        editais = client.get_editais_disponiveis(apenas_com_propostas_abertas=False)

    if not editais:
        console.print("[yellow]Nenhum edital encontrado no momento.[/yellow]")
        return

    table = Table(title="Editais no Sistema de Leilão Eletrônico (SLE)", header_style="bold magenta")
    table.add_column("Edital (edle)", style="bold cyan")
    table.add_column("Cidade / Órgão")
    table.add_column("Aceita PF?", justify="center")
    table.add_column("Início Propostas")
    table.add_column("Fim Propostas")
    table.add_column("Abertura Lances")

    for ed in editais:
        pf_str = "[green]Sim[/green]" if ed.permitePF else "[red]Não (Só PJ)[/red]"
        table.add_row(
            ed.edle,
            f"{ed.cidade or 'Brasil'} - {ed.orgao or 'RFB'}",
            pf_str,
            ed.dataInicioPropostas or "-",
            ed.dataFimPropostas or "-",
            ed.dataAberturaLances or "-",
        )

    console.print(table)
    console.print(f"\n[bold green]Total de {len(editais)} edital(is) encontrado(s).[/bold green]\n")


def cmd_buscar(
    palavras_chave: Optional[List[str]],
    apenas_pf: bool,
    valor_max: Optional[float],
    cidade: Optional[str],
    limite_editais: Optional[int],
    arquivo_exportacao: Optional[str],
):
    """Executa a busca de lotes e exibe os resultados."""
    client = ReceitaSLEClient()
    scanner = ScannerOportunidades(client=client)

    filtros_info = []
    if palavras_chave:
        filtros_info.append(f"Termos: [bold]{', '.join(palavras_chave)}[/bold]")
    if apenas_pf:
        filtros_info.append("Pessoa Física: [green]Sim[/green]")
    if valor_max is not None:
        filtros_info.append(f"Valor Máx: [yellow]R$ {valor_max:,.2f}[/yellow]")
    if cidade:
        filtros_info.append(f"Cidade/Região: [bold]{cidade}[/bold]")

    filtro_msg = " | ".join(filtros_info) if filtros_info else "Todos os lotes"
    console.print(f"[cyan]Filtros ativos:[/cyan] {filtro_msg}\n")

    cidades_lista = [cidade] if cidade else None

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
        TimeElapsedColumn(),
        console=console,
    ) as progress:
        task = progress.add_task("[green]Iniciando varredura...", total=100)

        def callback(msg: str, idx: int, total: int):
            porcentagem = int((idx / total) * 100) if total > 0 else 0
            progress.update(task, description=f"[green]{msg}", completed=porcentagem)

        resultados = scanner.escanear(
            palavras_chave=palavras_chave,
            apenas_pf=apenas_pf,
            valor_maximo=valor_max,
            cidades=cidades_lista,
            limite_editais=limite_editais,
            progresso_callback=callback,
        )

    if not resultados:
        console.print("\n[yellow]Nenhum lote correspondeu aos critérios especificados.[/yellow]\n")
        return

    console.print(f"\n[bold green]Encontrado(s) {len(resultados)} lote(s) correspondente(s)![/bold green]\n")

    table = Table(
        title="Lotes Encontrados para Oportunidade",
        header_style="bold cyan",
        show_lines=True,
    )
    table.add_column("Edital", style="bold")
    table.add_column("Lote", justify="right", style="bold yellow")
    table.add_column("PF?", justify="center")
    table.add_column("Lance Mín.", justify="right", style="bold green")
    table.add_column("Cidade / Local", style="dim")
    table.add_column("Mercadorias Identificadas", style="white")
    table.add_column("Link do Lote", style="blue underline")

    for lote in resultados:
        pf_badge = "[green]PF/PJ[/green]" if lote.permite_pf else "[red]PJ[/red]"
        valor_str = f"R$ {lote.valor_minimo:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
        
        # Cria resumo com os 3 primeiros itens encontrados
        itens_resumo = []
        for it in lote.itens_correspondentes[:3]:
            qtd = f"{int(it.quantidade)}x " if it.quantidade else ""
            itens_resumo.append(f"• {qtd}{it.descricao}")
        if len(lote.itens_correspondentes) > 3:
            itens_resumo.append(f"[dim]... e mais {len(lote.itens_correspondentes) - 3} item(ns)[/dim]")

        table.add_row(
            lote.edle,
            str(lote.numero_lote),
            pf_badge,
            valor_str,
            lote.cidade,
            "\n".join(itens_resumo),
            lote.url_lote,
        )

    console.print(table)

    # Exportação opcional
    if arquivo_exportacao:
        df = scanner.para_dataframe(resultados)
        caminho = Path(arquivo_exportacao).resolve()
        
        # Cria diretório pai caso não exista
        caminho.parent.mkdir(parents=True, exist_ok=True)
        
        if caminho.suffix.lower() == ".xlsx":
            df.to_excel(caminho, index=False)
        else:
            df.to_csv(caminho, index=False, encoding="utf-8-sig")

        console.print(f"\n[bold green][V] Resultados exportados com sucesso para:[/bold green] [cyan]{caminho}[/cyan]")


def main():
    parser = argparse.ArgumentParser(
        description="Muamba Search - Busca automatizada por lotes no Leilão da Receita Federal (SLE)."
    )
    parser.add_argument(
        "-t", "--termos",
        type=str,
        default="",
        help="Termos/palavras-chave separados por vírgula (ex: 'iphone, notebook, drone, switch')",
    )
    parser.add_argument(
        "--pf",
        action="store_true",
        help="Filtrar apenas lotes que aceitam Pessoa Física (PF)",
    )
    parser.add_argument(
        "-v", "--max-valor",
        type=float,
        default=None,
        help="Valor máximo do lance mínimo inicial (ex: 5000.00)",
    )
    parser.add_argument(
        "-c", "--cidade",
        type=str,
        default=None,
        help="Filtrar por cidade ou superintendência (ex: 'Belo Horizonte', 'Santos', 'Curitiba')",
    )
    parser.add_argument(
        "-l", "--limite-editais",
        type=int,
        default=None,
        help="Limita o número de editais varridos (útil para testes rápidos)",
    )
    parser.add_argument(
        "-o", "--export",
        type=str,
        default=None,
        help="Exporta os resultados para arquivo .csv ou .xlsx (ex: 'lotes.xlsx')",
    )
    parser.add_argument(
        "--listar-editais",
        action="store_true",
        help="Apenas lista os editais abertos no momento, sem escanear lotes",
    )

    args = parser.parse_args()

    render_banner()

    if args.listar_editais:
        cmd_listar_editais(ReceitaSLEClient())
        return

    termos_lista = [t.strip() for t in args.termos.split(",") if t.strip()] if args.termos else None

    cmd_buscar(
        palavras_chave=termos_lista,
        apenas_pf=args.pf,
        valor_max=args.max_valor,
        cidade=args.cidade,
        limite_editais=args.limite_editais,
        arquivo_exportacao=args.export,
    )


if __name__ == "__main__":
    main()
