"use client";

import React, { useState } from "react";
import { Lote } from "@/lib/types";
import { formatarDataBR, getStatusPrazo } from "@/lib/date-utils";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  AlertTriangle,
  MapPin,
  Package,
  ShieldCheck,
  Building,
  Calendar,
  Clock,
  Landmark,
} from "lucide-react";

interface LoteModalProps {
  lote: Lote | null;
  onClose: () => void;
}

export function LoteModal({ lote, onClose }: LoteModalProps) {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  if (!lote) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  const fotos = lote.imagens || [];
  const temFotos = fotos.length > 0;
  const fotoAtual = temFotos ? fotos[activePhotoIndex] : null;

  const statusPrazo = getStatusPrazo(lote.dataInicioPropostas, lote.dataFimPropostas);

  const nextPhoto = () => {
    setActivePhotoIndex((prev) => (prev + 1) % fotos.length);
  };

  const prevPhoto = () => {
    setActivePhotoIndex((prev) => (prev - 1 + fotos.length) % fotos.length);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300 border border-slate-700">
                Edital {lote.edle}
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                  lote.permitePF
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                }`}
              >
                {lote.permitePF ? "Pessoa Física e Jurídica" : "Apenas Pessoa Jurídica (PJ)"}
              </span>

              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-medium border flex items-center space-x-1.5 ${statusPrazo.badgeClass}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${statusPrazo.dotClass}`} />
                <span>{statusPrazo.label}</span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
              Lote {lote.numero} - {lote.tipo}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Conteúdo do Modal */}
        <div className="p-6 space-y-6">
          {/* Cronograma do Edital com Datas Formatadas */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 flex items-center space-x-1 font-medium">
                <Clock className="h-3.5 w-3.5 text-slate-500" />
                <span>Início das Propostas:</span>
              </span>
              <span className="text-white font-semibold block text-sm">
                {formatarDataBR(lote.dataInicioPropostas)}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 flex items-center space-x-1 font-medium">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                <span>Fim das Propostas (Prazo):</span>
              </span>
              <span className="text-amber-300 font-semibold block text-sm">
                {formatarDataBR(lote.dataFimPropostas)}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 flex items-center space-x-1 font-medium">
                <Calendar className="h-3.5 w-3.5 text-emerald-500" />
                <span>Sessão de Lances (Disputa):</span>
              </span>
              <span className="text-emerald-400 font-semibold block text-sm">
                {formatarDataBR(lote.dataAberturaLances)}
              </span>
            </div>
          </div>

          {/* Carrossel de Fotos */}
          {temFotos ? (
            <div className="space-y-3">
              <div className="relative h-72 sm:h-96 w-full bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800">
                <img
                  src={fotoAtual?.src || fotoAtual?.min}
                  alt={`Foto ${activePhotoIndex + 1} do Lote ${lote.numero}`}
                  className="max-h-full max-w-full object-contain"
                />

                {fotos.length > 1 && (
                  <>
                    <button
                      onClick={prevPhoto}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/70 hover:bg-slate-900 text-white border border-white/10 transition"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={nextPhoto}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/70 hover:bg-slate-900 text-white border border-white/10 transition"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}

                <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur px-3 py-1 rounded-full text-xs font-medium text-white border border-white/10">
                  {activePhotoIndex + 1} de {fotos.length} fotos
                </div>
              </div>

              {/* Miniaturas */}
              {fotos.length > 1 && (
                <div className="flex items-center space-x-2 overflow-x-auto py-1 scrollbar-none">
                  {fotos.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActivePhotoIndex(idx)}
                      className={`h-16 w-20 rounded-lg overflow-hidden shrink-0 border-2 transition ${
                        activePhotoIndex === idx
                          ? "border-emerald-500 scale-105"
                          : "border-slate-800 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={img.min || img.src}
                        alt={`Miniatura ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-950/50 rounded-2xl border border-slate-800 text-slate-500">
              Não há fotos anexadas para este lote no sistema da Receita Federal.
            </div>
          )}

          {/* Seção de Avisos e Erratas */}
          {lote.avisosErratas && lote.avisosErratas.length > 0 && (
            <div className="space-y-3 bg-amber-500/10 border border-amber-500/30 p-4 sm:p-5 rounded-2xl">
              <div className="flex items-center space-x-2 text-amber-300 font-bold text-sm">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                <span>Avisos e Erratas Oficiais ({lote.avisosErratas.length})</span>
              </div>
              <div className="space-y-2.5">
                {lote.avisosErratas.map((aviso, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-900/80 rounded-xl border border-amber-500/20 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-amber-400 font-semibold">
                      <span>{aviso.tipo}</span>
                      {aviso.data && (
                        <span className="text-slate-400 font-normal flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatarDataBR(aviso.data)}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-slate-200 leading-relaxed">{aviso.texto}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resumo Financeiro e Logística */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Lance Mínimo Inicial</span>
              <span className="text-2xl font-black text-emerald-400">
                {formatCurrency(lote.valorMinimo)}
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Valor de Avaliação</span>
              <span className="text-xl font-bold text-slate-300">
                {lote.valorAvaliacao > 0 ? formatCurrency(lote.valorAvaliacao) : "Não informada"}
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Local de Retirada</span>
              <div className="flex items-center space-x-1.5 text-slate-200 text-sm font-semibold truncate">
                <MapPin className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="truncate">{lote.cidade}</span>
              </div>
            </div>
          </div>

          {/* Relação Completa de Mercadorias */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-white font-bold text-base">
              <Package className="h-5 w-5 text-emerald-400" />
              <span>Itens Componentes do Lote ({lote.itens.length})</span>
            </div>

            <div className="border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800/80 bg-slate-950/40">
              {lote.itens.map((item, idx) => (
                <div key={idx} className="p-3.5 sm:p-4 text-xs sm:text-sm space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-white leading-snug">
                      {item.descricao}
                    </span>
                    <span className="bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded text-xs whitespace-nowrap">
                      {item.quantidade} {item.unMedida || "un"}
                    </span>
                  </div>

                  {item.recintoArmazenador && (
                    <div className="flex items-center space-x-1 text-slate-400 text-xs">
                      <Building className="h-3 w-3 text-slate-500" />
                      <span>Depósito: {item.recintoArmazenador}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer com botão direto e destacado para a Receita Federal */}
        <div className="sticky bottom-0 z-20 bg-slate-900/95 backdrop-blur border-t border-slate-800 p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Atenção: A Receita não faz envio. Verifique o ICMS estadual e custos de retirada.
          </div>

          <a
            href={lote.urlOficial}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-emerald-500/25 transition duration-200"
          >
            <Landmark className="h-4 w-4" />
            <span>Acessar no Portal Oficial da Receita Federal</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
