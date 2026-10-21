"use client";

import React from "react";
import { Lote } from "@/lib/types";
import {
  ExternalLink,
  ImageIcon,
  AlertTriangle,
  MapPin,
  Tag,
  Eye,
  TrendingDown,
} from "lucide-react";

interface LoteCardProps {
  lote: Lote;
  onOpenDetails: (lote: Lote) => void;
}

export function LoteCard({ lote, onOpenDetails }: LoteCardProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  const temFotos = lote.imagens && lote.imagens.length > 0;
  const fotoCapa = temFotos ? lote.imagens[0].min || lote.imagens[0].src : null;

  const temAvisos = lote.avisosErratas && lote.avisosErratas.length > 0;

  // Cálculo de desconto sobre o valor de avaliação
  const desconto =
    lote.valorAvaliacao > 0 && lote.valorAvaliacao > lote.valorMinimo
      ? Math.round(((lote.valorAvaliacao - lote.valorMinimo) / lote.valorAvaliacao) * 100)
      : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-emerald-500/5 transition duration-200 flex flex-col justify-between group">
      <div>
        {/* Imagem de Capa do Lote */}
        <div
          onClick={() => onOpenDetails(lote)}
          className="relative h-48 w-full bg-slate-950 flex items-center justify-center overflow-hidden cursor-pointer"
        >
          {temFotos && fotoCapa ? (
            <img
              src={fotoCapa}
              alt={`Lote ${lote.numero}`}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-600 space-y-1">
              <ImageIcon className="h-10 w-10 stroke-1" />
              <span className="text-xs">Sem fotos publicadas</span>
            </div>
          )}

          {/* Badge de Quantidade de Fotos */}
          {temFotos && (
            <div className="absolute bottom-2.5 right-2.5 bg-slate-950/80 backdrop-blur border border-white/10 px-2 py-0.5 rounded-md text-xs font-medium text-white flex items-center space-x-1">
              <ImageIcon className="h-3 w-3 text-emerald-400" />
              <span>{lote.imagens.length} foto{lote.imagens.length > 1 ? "s" : ""}</span>
            </div>
          )}

          {/* Badges Flutuantes */}
          <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border backdrop-blur ${
                lote.permitePF
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                  : "bg-blue-500/20 text-blue-300 border-blue-500/30"
              }`}
            >
              {lote.permitePF ? "PF e PJ" : "Apenas PJ"}
            </span>

            {desconto > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center space-x-1">
                <TrendingDown className="h-3 w-3" />
                <span>-{desconto}%</span>
              </span>
            )}
          </div>
        </div>

        {/* Informações Principais */}
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-mono bg-slate-800/80 px-2 py-0.5 rounded text-slate-300 border border-slate-700/60">
              Edital {lote.edle}
            </span>
            <span className="flex items-center space-x-1 text-slate-400 truncate max-w-[150px]">
              <MapPin className="h-3 w-3 text-slate-500 shrink-0" />
              <span className="truncate">{lote.cidade}</span>
            </span>
          </div>

          <h3 className="font-bold text-lg text-white group-hover:text-emerald-400 transition mb-1">
            Lote {lote.numero}
          </h3>

          <div className="flex items-center space-x-1 text-xs text-slate-400 mb-3">
            <Tag className="h-3 w-3 text-slate-500" />
            <span className="truncate">{lote.tipo}</span>
          </div>

          {/* Alerta de Avisos / Erratas da Receita */}
          {temAvisos && (
            <div className="mb-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 text-xs text-amber-200 flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5 overflow-hidden">
                <span className="font-semibold block">Aviso do Lote:</span>
                <p className="line-clamp-2 text-amber-200/90 text-[11px] leading-relaxed">
                  {lote.avisosErratas[0].texto}
                </p>
                {lote.avisosErratas.length > 1 && (
                  <span className="text-[10px] text-amber-400 font-medium">
                    + {lote.avisosErratas.length - 1} outro(s) aviso(s)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Lista de Mercadorias Encontradas */}
          <div className="space-y-1 mb-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Itens no Lote ({lote.itens.length}):
            </div>
            {lote.itensMatch.slice(0, 3).map((item, idx) => (
              <div key={idx} className="text-xs text-slate-200 flex items-start space-x-1.5 leading-snug">
                <span className="text-emerald-400 font-bold shrink-0">
                  {item.quantidade ? `${item.quantidade}x` : "•"}
                </span>
                <span className="truncate">{item.descricao}</span>
              </div>
            ))}
            {lote.itensMatch.length > 3 && (
              <div className="text-[11px] text-slate-400 font-medium pt-0.5">
                + {lote.itensMatch.length - 3} mercadoria(s) adicional(is)
              </div>
            )}
          </div>

          {/* Preços */}
          <div className="flex items-baseline justify-between pt-2 border-t border-slate-800">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Lance Mínimo</span>
              <span className="text-xl font-extrabold text-emerald-400">
                {formatCurrency(lote.valorMinimo)}
              </span>
            </div>
            {lote.valorAvaliacao > 0 && (
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">Avaliação</span>
                <span className="text-xs text-slate-400 line-through">
                  {formatCurrency(lote.valorAvaliacao)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="p-4 pt-0 grid grid-cols-2 gap-2">
        <button
          onClick={() => onOpenDetails(lote)}
          className="flex items-center justify-center space-x-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition"
        >
          <Eye className="h-3.5 w-3.5 text-slate-400" />
          <span>Ver Fotos ({lote.imagens.length})</span>
        </button>

        <a
          href={lote.urlOficial}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center space-x-1.5 py-2 px-3 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 text-xs font-semibold rounded-xl transition"
        >
          <span>Dar Lance</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
