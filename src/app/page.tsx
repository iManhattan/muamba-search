"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { SearchFilters } from "@/components/SearchFilters";
import { LoteCard } from "@/components/LoteCard";
import { LoteModal } from "@/components/LoteModal";
import { Lote } from "@/lib/types";
import {
  Download,
  AlertCircle,
  Sparkles,
  ArrowUpDown,
  PackageSearch,
  CheckCircle2,
} from "lucide-react";

export default function Home() {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLote, setSelectedLote] = useState<Lote | null>(null);
  const [editaisCount, setEditaisCount] = useState<number>(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [sortBy, setSortBy] = useState<"menorPreco" | "maiorPreco" | "maisFotos" | "desconto">(
    "menorPreco"
  );

  // Carrega contagem de editais disponíveis ao iniciar
  useEffect(() => {
    fetch("/api/editais")
      .then((res) => res.json())
      .then((data) => {
        if (data.total) setEditaisCount(data.total);
      })
      .catch(() => {});
  }, []);

  const handleSearch = async (filters: {
    query: string;
    apenasPF: boolean;
    maxValor: string;
    cidade: string;
    limiteEditais: number;
  }) => {
    setLoading(true);
    setHasSearched(true);

    try {
      const params = new URLSearchParams();
      if (filters.query) params.set("q", filters.query);
      if (filters.apenasPF) params.set("pf", "true");
      if (filters.maxValor) params.set("maxValor", filters.maxValor);
      if (filters.cidade) params.set("cidade", filters.cidade);
      if (filters.limiteEditais) params.set("limiteEditais", filters.limiteEditais.toString());

      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();

      if (data.lotes) {
        setLotes(data.lotes);
      } else {
        setLotes([]);
      }
    } catch (err) {
      console.error("Erro na busca:", err);
      setLotes([]);
    } finally {
      setLoading(false);
    }
  };

  // Ordenação
  const lotesOrdenados = [...lotes].sort((a, b) => {
    if (sortBy === "menorPreco") return a.valorMinimo - b.valorMinimo;
    if (sortBy === "maiorPreco") return b.valorMinimo - a.valorMinimo;
    if (sortBy === "maisFotos") return (b.imagens?.length || 0) - (a.imagens?.length || 0);
    if (sortBy === "desconto") {
      const descA = a.valorAvaliacao > a.valorMinimo ? a.valorAvaliacao - a.valorMinimo : 0;
      const descB = b.valorAvaliacao > b.valorMinimo ? b.valorAvaliacao - b.valorMinimo : 0;
      return descB - descA;
    }
    return 0;
  });

  // Exportar para CSV direto no navegador
  const handleExportCSV = () => {
    if (lotes.length === 0) return;

    const headers = [
      "Edital",
      "Lote",
      "Categoria",
      "Aceita PF",
      "Cidade",
      "Lance Minimo (R$)",
      "Avaliacao (R$)",
      "Total Itens",
      "Total Fotos",
      "Possui Avisos",
      "Mercadorias",
      "Link Oficial",
    ];

    const rows = lotes.map((l) => [
      `"${l.edle}"`,
      l.numero,
      `"${l.tipo.replace(/"/g, '""')}"`,
      l.permitePF ? "Sim" : "Nao (PJ)",
      `"${l.cidade.replace(/"/g, '""')}"`,
      l.valorMinimo,
      l.valorAvaliacao,
      l.itens.length,
      l.imagens.length,
      l.avisosErratas.length > 0 ? "Sim" : "Nao",
      `"${l.itensMatch.map((i) => `${i.quantidade}x ${i.descricao}`).join(" | ").replace(/"/g, '""')}"`,
      `"${l.urlOficial}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(";"), ...rows.map((e) => e.join(";"))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `muamba_search_lotes_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar editaisCount={editaisCount} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-xs text-emerald-400 font-medium mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Varredura direta no SLE da Receita Federal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
            Encontre as Melhores Oportunidades para Revenda
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            Pesquise eletrônicos, informática e veículos com fotos, avisos oficiais de armazenagem e filtros de Pessoa Física / Jurídica.
          </p>
        </div>

        {/* Formulário de Busca e Filtros */}
        <SearchFilters onSearch={handleSearch} loading={loading} />

        {/* Barra de Status e Ações */}
        {hasSearched && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div className="text-sm text-slate-300">
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  <span>Consultando a Receita Federal em tempo real...</span>
                </div>
              ) : (
                <span>
                  Encontrado(s) <strong className="text-emerald-400">{lotes.length}</strong> lote(s)
                  de oportunidade.
                </span>
              )}
            </div>

            {!loading && lotes.length > 0 && (
              <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                {/* Seletor de Ordenação */}
                <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="menorPreco">Menor Lance Mínimo</option>
                    <option value="maiorPreco">Maior Lance Mínimo</option>
                    <option value="desconto">Maior Desconto sobre Avaliação</option>
                    <option value="maisFotos">Com Mais Fotos</option>
                  </select>
                </div>

                {/* Botão de Exportar */}
                <button
                  onClick={handleExportCSV}
                  className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition"
                >
                  <Download className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Exportar Planilha</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Grid de Cards de Lotes */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-slate-900 border border-slate-800 rounded-2xl h-96 animate-pulse"
              >
                <div className="h-48 bg-slate-800/60 rounded-t-2xl" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-slate-800 rounded w-1/3" />
                  <div className="h-6 bg-slate-800 rounded w-2/3" />
                  <div className="h-16 bg-slate-800/40 rounded-xl" />
                  <div className="h-8 bg-slate-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : lotesOrdenados.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lotesOrdenados.map((lote) => (
              <LoteCard
                key={`${lote.edle}-${lote.numero}`}
                lote={lote}
                onOpenDetails={setSelectedLote}
              />
            ))}
          </div>
        ) : hasSearched ? (
          <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800/60 p-8">
            <PackageSearch className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">Nenhum lote encontrado</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Tente utilizar palavras-chave mais genéricas (ex: "celular" em vez de "iphone 15 pro max"), remover o filtro de Pessoa Física ou aumentar a quantidade de editais varridos.
            </p>
          </div>
        ) : (
          /* Estado Inicial antes da primeira busca */
          <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl p-8">
            <PackageSearch className="h-14 w-14 text-emerald-500/40 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">Pronto para Buscar Lotes</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto mb-4">
              Clique em uma das tags acima ou digite termos como <strong>"iPhone"</strong>, <strong>"MacBook"</strong> ou <strong>"Videogame"</strong> para iniciar a varredura nos editais abertos.
            </p>
          </div>
        )}
      </main>

      {/* Modal de Detalhes e Fotos do Lote */}
      <LoteModal lote={selectedLote} onClose={() => setSelectedLote(null)} />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>
          Muamba Search - Dados públicos extraídos do Sistema de Leilão Eletrônico (SLE) da Receita Federal do Brasil.
        </p>
      </footer>
    </div>
  );
}
