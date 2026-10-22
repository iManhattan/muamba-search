"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Lote } from "./types";
import { getSupabase, isSupabaseConfigured, rowToLote } from "./supabase";

const LOCAL_STORAGE_KEY = "muamba_saved_lotes_fallback_v1";

export function useSavedLotes() {
  const [savedLotes, setSavedLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState<boolean>(true);
  const isConfiguredRef = useRef(true);

  // Carregar lotes salvos
  const fetchSavedLotes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/saved-lotes");
      const data = await res.json();

      if (data.isConfigured === false) {
        setIsConfigured(false);
        isConfiguredRef.current = false;
        // Fallback local caso ainda não tenha configurado as chaves no Supabase
        if (typeof window !== "undefined") {
          try {
            const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (raw) setSavedLotes(JSON.parse(raw));
          } catch {}
        }
      } else if (Array.isArray(data.lotes)) {
        setIsConfigured(true);
        isConfiguredRef.current = true;
        setSavedLotes(data.lotes);
      }
    } catch (err) {
      console.error("Falha ao carregar lotes salvos:", err);
      // Fallback local
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (raw) setSavedLotes(JSON.parse(raw));
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSavedLotes();
  }, [fetchSavedLotes]);

  // Sincronização em tempo real (Supabase Realtime)
  useEffect(() => {
    const client = getSupabase();
    if (!isSupabaseConfigured() || !client) return;

    const channel = client
      .channel("realtime_saved_lotes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "saved_lotes" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const novoLote = rowToLote(payload.new);
            setSavedLotes((prev) => {
              if (prev.some((l) => l.edle === novoLote.edle && l.numero === novoLote.numero)) {
                return prev;
              }
              return [novoLote, ...prev];
            });
          } else if (payload.eventType === "DELETE") {
            const oldId = payload.old.id; // edle_numero
            setSavedLotes((prev) =>
              prev.filter((l) => `${l.edle}_${l.numero}` !== oldId)
            );
          } else if (payload.eventType === "UPDATE") {
            const atualizado = rowToLote(payload.new);
            setSavedLotes((prev) =>
              prev.map((l) =>
                l.edle === atualizado.edle && l.numero === atualizado.numero
                  ? atualizado
                  : l
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      client?.removeChannel(channel);
    };
  }, []);

  // Verifica se um lote está salvo
  const isSaved = useCallback(
    (edle: string, numero: number): boolean => {
      return savedLotes.some((l) => l.edle === edle && l.numero === numero);
    },
    [savedLotes]
  );

  // Alterna o estado de salvo com Optimistic UI
  const toggleSave = useCallback(
    async (lote: Lote) => {
      const jaSalvo = savedLotes.some(
        (l) => l.edle === lote.edle && l.numero === lote.numero
      );

      const previousState = [...savedLotes];

      if (jaSalvo) {
        // Optimistic remove
        const updated = savedLotes.filter(
          (l) => !(l.edle === lote.edle && l.numero === lote.numero)
        );
        setSavedLotes(updated);

        if (!isConfiguredRef.current) {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
          return false;
        }

        try {
          const res = await fetch(
            `/api/saved-lotes?edle=${encodeURIComponent(lote.edle)}&numero=${lote.numero}`,
            { method: "DELETE" }
          );
          if (!res.ok) throw new Error("Erro na exclusão");
          return false;
        } catch (err) {
          console.error("Erro ao remover lote salvo:", err);
          setSavedLotes(previousState);
          return true;
        }
      } else {
        // Optimistic add
        const loteComData: Lote = {
          ...lote,
          salvoEm: new Date().toISOString(),
        };
        const updated = [loteComData, ...savedLotes];
        setSavedLotes(updated);

        if (!isConfiguredRef.current) {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
          return true;
        }

        try {
          const res = await fetch("/api/saved-lotes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lote: loteComData }),
          });
          if (!res.ok) throw new Error("Erro ao salvar");
          return true;
        } catch (err) {
          console.error("Erro ao salvar lote:", err);
          setSavedLotes(previousState);
          return false;
        }
      }
    },
    [savedLotes]
  );

  const removeSaved = useCallback(
    async (edle: string, numero: number) => {
      const lote = savedLotes.find((l) => l.edle === edle && l.numero === numero);
      if (lote) {
        await toggleSave(lote);
      }
    },
    [savedLotes, toggleSave]
  );

  return {
    savedLotes,
    savedCount: savedLotes.length,
    loading,
    isConfigured,
    isSaved,
    toggleSave,
    removeSaved,
    refreshSaved: fetchSavedLotes,
  };
}
