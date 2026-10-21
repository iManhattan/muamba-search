"use client";

import React, { useEffect, useState } from "react";
import { ExternalLink, Tag, Store, Search, ShoppingBag } from "lucide-react";

interface Anuncio {
  title: string;
  price: string;
  store: string;
  link: string;
  image?: string;
}

interface MarketPricesProps {
  produtoQuery: string;
}

export function MarketPricesSection({ produtoQuery }: MarketPricesProps) {
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [googleUrl, setGoogleUrl] = useState<string>("");
  const [mlUrl, setMlUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!produtoQuery) return;

    setLoading(true);
    fetch(`/api/market-prices?q=${encodeURIComponent(produtoQuery)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.anuncios) setAnuncios(data.anuncios);
        if (data.googleShoppingUrl) setGoogleUrl(data.googleShoppingUrl);
        if (data.mercadoLivreUrl) setMlUrl(data.mercadoLivreUrl);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [produtoQuery]);

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <Tag className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-bold text-white">
            Preços de Mercado na Internet (3 a 5 primeiros anúncios):
          </span>
        </div>

        <span className="text-xs text-slate-400 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800 self-start sm:self-auto">
          Ref: {produtoQuery}
        </span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-slate-900 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : anuncios.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {anuncios.map((anuncio, idx) => (
            <a
              key={idx}
              href={anuncio.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/40 rounded-xl transition group"
            >
              <div className="flex items-center space-x-3 overflow-hidden pr-2">
                {anuncio.image && (
                  <img
                    src={anuncio.image}
                    alt={anuncio.title}
                    className="h-10 w-10 object-contain rounded bg-white p-0.5 shrink-0"
                  />
                )}
                <div className="overflow-hidden">
                  <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider block">
                    {anuncio.store}
                  </span>
                  <p className="text-xs text-slate-200 group-hover:text-white truncate font-medium">
                    {anuncio.title}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-bold text-emerald-400 block">
                  {anuncio.price}
                </span>
                <span className="text-[10px] text-slate-400 flex items-center justify-end space-x-0.5 group-hover:text-emerald-300">
                  <span>Ver</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </span>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="text-xs text-slate-400 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
          Nenhum anúncio direto retornado para este modelo específico. Utilize os botões abaixo para buscar diretamente no Google Shopping e Mercado Livre.
        </div>
      )}

      {/* Botões de Pesquisa Direta no Google Shopping e Mercado Livre */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-900">
        {googleUrl && (
          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 rounded-lg text-xs font-medium transition"
          >
            <Search className="h-3.5 w-3.5 text-blue-400" />
            <span>Ver no Google Shopping</span>
            <ExternalLink className="h-3 w-3 text-slate-500" />
          </a>
        )}

        {mlUrl && (
          <a
            href={mlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 rounded-lg text-xs font-medium transition"
          >
            <ShoppingBag className="h-3.5 w-3.5 text-yellow-400" />
            <span>Ver no Mercado Livre</span>
            <ExternalLink className="h-3 w-3 text-slate-500" />
          </a>
        )}
      </div>
    </div>
  );
}
