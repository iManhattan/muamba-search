"use client";

import React from "react";
import { Search, ExternalLink, ShieldCheck, Sparkles } from "lucide-react";

export function Navbar({ editaisCount }: { editaisCount?: number }) {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/10">
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

        <div className="flex items-center space-x-4">
          {typeof editaisCount === "number" && (
            <div className="hidden sm:flex items-center space-x-2 bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-lg text-xs text-slate-300">
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
            <span>Portal Oficial</span>
            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
          </a>
        </div>
      </div>
    </header>
  );
}
