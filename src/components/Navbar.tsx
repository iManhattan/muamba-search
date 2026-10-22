"use client";

import React from "react";
import { Search, ExternalLink, Star } from "lucide-react";

interface NavbarProps {
  editaisCount?: number;
  savedCount?: number;
  activeTab?: "search" | "saved";
  onTabChange?: (tab: "search" | "saved") => void;
}

export function Navbar({
  editaisCount,
  savedCount = 0,
  activeTab = "search",
  onTabChange,
}: NavbarProps) {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div
          onClick={() => onTabChange?.("search")}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/10 group-hover:scale-105 transition">
            <Search className="h-5 w-5 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl tracking-tight text-white">
                Muamba<span className="text-emerald-400">Search</span>
              </span>
              <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-medium">
                SLE Receita
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Scanner de oportunidades e lotes para revenda
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Botão de Lotes Salvos na Nuvem */}
          <button
            type="button"
            onClick={() => onTabChange?.(activeTab === "saved" ? "search" : "saved")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition shadow-sm ${
              activeTab === "saved"
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-slate-800/80 text-slate-300 border-slate-700/60 hover:text-white hover:bg-slate-700"
            }`}
          >
            <Star
              className={`h-3.5 w-3.5 ${
                savedCount > 0 ? "fill-amber-400 text-amber-400" : "text-slate-400"
              }`}
            />
            <span className="hidden xs:inline">Salvos</span>
            <span className="bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded-md text-[11px] font-bold">
              {savedCount}
            </span>
          </button>

          {typeof editaisCount === "number" && (
            <div className="hidden md:flex items-center space-x-2 bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-lg text-xs text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{editaisCount} editais abertos</span>
            </div>
          )}

          <a
            href="https://www25.receita.fazenda.gov.br/sle-sociedade/portal"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg transition"
          >
            <span className="hidden sm:inline">Portal Oficial</span>
            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
          </a>
        </div>
      </div>
    </header>
  );
}
