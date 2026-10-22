"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { SearchFilters } from "@/components/SearchFilters";
import { LoteCard } from "@/components/LoteCard";
import { LoteModal } from "@/components/LoteModal";
import { Lote } from "@/lib/types";
import { useSavedLotes } from "@/lib/useSavedLotes";
import {
  Download,
  Sparkles,
  ArrowUpDown,
  PackageSearch,
  Star,
  Search,
  Database,
  Info,
  X,
  ExternalLink,
} from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"search" | "saved">("search");
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLote, setSelectedLote] = useState<Lote | null>(null);
  const [editaisCount, setEditaisCount] = useState<number>(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [sortBy, setSortBy] = useState<"menorPreco" | "maiorPreco" | "maisFotos" | "desconto">(
    "menorPreco"
  );

  // Estado para busca e ordenação dentro dos Lotes Salvos
  const [savedSearchQuery, setSavedSearchQuery] = useState("");
  const [sortBySaved, setSortBySaved] = useState<"recente" | "menorPreco" | "maiorPreco" | "desconto">(
    "recente"
  );

  // Hook da nuvem Supabase
  const {
    savedLotes,
    savedCount,
    loading: loadingSaved,
    isConfigured,
    isSaved,
    toggleSave,
  } = useSavedLotes();

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
    setActiveTab("search");

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

  // Ordenação da busca normal
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

  // Filtro e Ordenação dos Lotes Salvos na Nuvem
  const lotesSalvosFiltrados = savedLotes
    .filter((l) => {
      if (!savedSearchQuery.trim()) return true;
      const q = savedSearchQuery.toLowerCase();
      const matchEdle = l.edle.toLowerCase().includes(q);
      const matchNum = l.numero.toString().includes(q);
      const matchTipo = l.tipo.toLowerCase().includes(q);
      const matchCidade = l.cidade.toLowerCase().includes(q);
      const matchItens = l.itens.some((i) =>
        i.descricao.toLowerCase().includes(q)
      );
      return matchEdle || matchNum || matchTipo || matchCidade || matchItens;
    })
    .sort((a, b) => {
      if (sortBySaved === "recente") {
        const timeA = a.salvoEm ? new Date(a.salvoEm).getTime() : 0;
        const timeB = b.salvoEm ? new Date(b.salvoEm).getTime() : 0;
        return timeB - timeA;
      }
      if (sortBySaved === "menorPreco") return a.valorMinimo - b.valorMinimo;
      if (sortBySaved === "maiorPreco") return b.valorMinimo - a.valorMinimo;
      if (sortBySaved === "desconto") {
        const descA = a.valorAvaliacao > a.valorMinimo ? a.valorAvaliacao - a.valorMinimo : 0;
        const descB = b.valorAvaliacao > b.valorMinimo ? b.valorAvaliacao - b.valorMinimo : 0;
        return descB - descA;
      }
      return 0;
    });

  // Exportar para CSV direto no navegador
  const handleExportCSV = (listaExportar: Lote[], nomeArquivo: string) => {
    if (listaExportar.length === 0) return;

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

    const rows = listaExportar.map((l) => [
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
      `"${(l.itensMatch || l.itens).map((i) => `${i.quantidade}x ${i.descricao}`).join(" | ").replace(/"/g, '""')}"`,
      `"${l.urlOficial}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(";"), ...rows.map((e) => e.join(";"))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${nomeArquivo}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar
        editaisCount={editaisCount}
        savedCount={savedCount}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-6">
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

        {/* Seletor de Abas Principal */}
        <div className="flex justify-center mb-8">
          <div className="bg-slate-900 border border-slate-800 p-1.5 rounded-2xl flex items-center space-x-1 shadow-lg">
            <button
              onClick={() => setActiveTab("search")}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
                activeTab === "search"
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Search className="h-4 w-4" />
              <span>Explorar Editais</span>
            </button>

            <button
              onClick={() => setActiveTab("saved")}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
                activeTab === "saved"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-md shadow-amber-500/10"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Star
                className={`h-4 w-4 ${
                  savedCount > 0 ? "fill-amber-400 text-amber-400" : "text-slate-400"
                }`}
              />
              <span>Lotes Salvos na Nuvem</span>
              <span className="bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full text-xs font-bold">
                {savedCount}
              </span>
            </button>
          </div>
        </div>

        {/* CONTEÚDO DA ABA 1: BUSCA E EXPLORAÇÃO */}
        {activeTab === "search" && (
          <>
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
                      onClick={() => handleExportCSV(lotes, "muamba_search_lotes")}
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
                    isSaved={isSaved(lote.edle, lote.numero)}
                    onToggleSave={toggleSave}
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
          </>
        )}

        {/* CONTEÚDO DA ABA 2: LOTES SALVOS NA NUVEM */}
        {activeTab === "saved" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Aviso de Configuração do Supabase (se pendente) */}
            {!isConfigured && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex items-start space-x-3 text-amber-200 text-xs sm:text-sm">
                <Database className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-amber-300 block text-sm">
                    Configuração do Supabase Pendente
                  </span>
                  <p className="text-amber-200/90 leading-relaxed">
                    Para conectar o banco na nuvem e habilitar a Watchlist Compartilhada permanente, crie o arquivo{" "}
                    <code className="bg-slate-950 px-1.5 py-0.5 rounded text-amber-300 font-mono">
                      .env.local
                    </code>{" "}
                    com as chaves <code className="bg-slate-950 px-1 py-0.5 rounded font-mono">NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
                    <code className="bg-slate-950 px-1 py-0.5 rounded font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, e execute o script{" "}
                    <code className="bg-slate-950 px-1 py-0.5 rounded font-mono">supabase/schema.sql</code> no SQL Editor do Supabase.
                  </p>
                  <span className="inline-block text-[11px] text-amber-400/80 pt-1">
                    Enquanto isso, seus lotes salvos estão funcionando em modo de contingência local no navegador.
                  </span>
                </div>
              </div>
            )}

            {/* Barra de Filtro e Ações dos Lotes Salvos */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Campo de Busca Rápida Dentro dos Salvos */}
              <div className="relative w-full md:max-w-md">
                <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={savedSearchQuery}
                  onChange={(e) => setSavedSearchQuery(e.target.value)}
                  placeholder="Filtrar por item, edital, cidade ou categoria..."
                  className="w-full pl-9 pr-9 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                {savedSearchQuery && (
                  <button
                    onClick={() => setSavedSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Status e Controles */}
              <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 w-full md:w-auto">
                <span className="text-xs text-slate-400">
                  Mostrando <strong className="text-amber-400">{lotesSalvosFiltrados.length}</strong> de{" "}
                  <strong>{savedLotes.length}</strong> lote(s)
                </span>

                {/* Ordenação dos Salvos */}
                <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  <select
                    value={sortBySaved}
                    onChange={(e: any) => setSortBySaved(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="recente">Mais Recentes Salvos</option>
                    <option value="menorPreco">Menor Lance Mínimo</option>
                    <option value="maiorPreco">Maior Lance Mínimo</option>
                    <option value="desconto">Maior Desconto sobre Avaliação</option>
                  </select>
                </div>

                {/* Exportar Salvos para Planilha */}
                {savedLotes.length > 0 && (
                  <button
                    onClick={() =>
                      handleExportCSV(lotesSalvosFiltrados, "muamba_lotes_salvos")
                    }
                    className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition"
                  >
                    <Download className="h-3.5 w-3.5 text-amber-400" />
                    <span>Exportar Salvos</span>
                  </button>
                )}
              </div>
            </div>

            {/* Grid de Cards dos Lotes Salvos */}
            {loadingSaved ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-slate-900 border border-slate-800 rounded-2xl h-96 animate-pulse"
                  >
                    <div className="h-48 bg-slate-800/60 rounded-t-2xl" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-slate-800 rounded w-1/3" />
                      <div className="h-6 bg-slate-800 rounded w-2/3" />
                      <div className="h-16 bg-slate-800/40 rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            ) : lotesSalvosFiltrados.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lotesSalvosFiltrados.map((lote) => (
                  <LoteCard
                    key={`saved-${lote.edle}-${lote.numero}`}
                    lote={lote}
                    onOpenDetails={setSelectedLote}
                    isSaved={isSaved(lote.edle, lote.numero)}
                    onToggleSave={toggleSave}
                  />
                ))}
              </div>
            ) : savedLotes.length === 0 ? (
              /* Nenhum lote salvo ainda */
              <div className="text-center py-20 border border-dashed border-slate-800 rounded-3xl p-8 bg-slate-900/30">
                <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
                  <Star className="h-8 w-8 text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Sua Watchlist de Oportunidades está Vazia
                </h3>
                <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
                  Quando estiver pesquisando nos editais, clique na <strong>estrela ⭐</strong> em qualquer card ou modal para salvar lotes de interesse aqui na nuvem.
                </p>
                <button
                  onClick={() => setActiveTab("search")}
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-600/20 transition"
                >
                  <Search className="h-4 w-4" />
                  <span>Explorar Editais Abertos Agora</span>
                </button>
              </div>
            ) : (
              /* Lotes salvos existem, mas o filtro de texto não encontrou nenhum */
              <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800/60 p-8">
                <PackageSearch className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-1">
                  Nenhum lote salvo corresponde ao filtro
                </h3>
                <p className="text-slate-400 text-sm max-w-md mx-auto mb-4">
                  Nenhum dos seus lotes salvos contém o termo <strong>"{savedSearchQuery}"</strong>.
                </p>
                <button
                  onClick={() => setSavedSearchQuery("")}
                  className="text-xs text-amber-400 hover:text-amber-300 underline font-medium"
                >
                  Limpar filtro de busca
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal de Detalhes e Fotos do Lote */}
      {selectedLote && (
        <LoteModal
          key={`${selectedLote.edle}-${selectedLote.numero}`}
          lote={selectedLote}
          onClose={() => setSelectedLote(null)}
          isSaved={isSaved(selectedLote.edle, selectedLote.numero)}
          onToggleSave={toggleSave}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>
          Muamba Search - Dados públicos extraídos do Sistema de Leilão Eletrônico (SLE) da Receita Federal do Brasil.
        </p>
      </footer>
    </div>
  );
}
