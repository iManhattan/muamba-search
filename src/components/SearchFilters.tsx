"use client";

import React, { useState } from "react";
import { Search, Filter, SlidersHorizontal, UserCheck, DollarSign, MapPin, X } from "lucide-react";

interface SearchFiltersProps {
  onSearch: (filters: {
    query: string;
    apenasPF: boolean;
    maxValor: string;
    cidade: string;
    limiteEditais: number;
  }) => void;
  loading: boolean;
}

const QUICK_TAGS = [
  "iPhone",
  "MacBook",
  "Videogame",
  "Memória",
  "Placa de Vídeo",
  "Drone",
  "Smartwatch",
  "Bebidas",
];

export function SearchFilters({ onSearch, loading }: SearchFiltersProps) {
  const [query, setQuery] = useState("");
  const [apenasPF, setApenasPF] = useState(false);
  const [maxValor, setMaxValor] = useState("");
  const [cidade, setCidade] = useState("");
  const [limiteEditais, setLimiteEditais] = useState<number>(5);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ query, apenasPF, maxValor, cidade, limiteEditais });
  };

  const handleTagClick = (tag: string) => {
    if (query.toLowerCase().includes(tag.toLowerCase())) {
      return;
    }
    const newQuery = query ? `${query}, ${tag}` : tag;
    setQuery(newQuery);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl mb-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Campo Principal de Busca */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Digite o que procura (ex: iphone, macbook, placa de video, memoria)..."
              className="w-full pl-10 pr-10 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition text-sm sm:text-base"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-emerald-600/20 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Buscando...</span>
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                <span>Buscar Oportunidades</span>
              </>
            )}
          </button>
        </div>

        {/* Tags Rápidas */}
        <div className="flex items-center space-x-2 overflow-x-auto py-1 scrollbar-none text-xs">
          <span className="text-slate-400 whitespace-nowrap">Sugestões:</span>
          {QUICK_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleTagClick(tag)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg border border-slate-700 transition whitespace-nowrap"
            >
              + {tag}
            </button>
          ))}
        </div>

        {/* Botão de Toggle de Filtros Avançados */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={apenasPF}
                onChange={(e) => setApenasPF(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
              />
              <span className="text-sm font-medium text-slate-200 flex items-center space-x-1.5">
                <UserCheck className="h-4 w-4 text-emerald-400" />
                <span>Apenas Pessoa Física (PF)</span>
              </span>
            </label>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-slate-200 font-medium py-1 px-2 rounded-lg hover:bg-slate-800 transition"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>{showAdvanced ? "Menos Filtros" : "Mais Filtros"}</span>
          </button>
        </div>

        {/* Filtros Avançados Expansíveis */}
        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800/60 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center space-x-1">
                <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                <span>Lance Mínimo Máximo (R$)</span>
              </label>
              <input
                type="number"
                placeholder="Ex: 5000"
                value={maxValor}
                onChange={(e) => setMaxValor(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center space-x-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span>Cidade ou Superintendência</span>
              </label>
              <input
                type="text"
                placeholder="Ex: Curitiba, Belo Horizonte, Santos"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Alcance da Varredura (Editais)
              </label>
              <select
                value={limiteEditais}
                onChange={(e) => setLimiteEditais(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value={3}>3 editais mais recentes (Mais Rápido)</option>
                <option value={5}>5 editais (Recomendado)</option>
                <option value={10}>10 editais</option>
                <option value={30}>Todos os editais abertos</option>
              </select>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
