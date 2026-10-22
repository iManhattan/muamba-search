import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Lote } from "./types";

export const isSupabaseConfigured = (): boolean => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return (
    typeof url === "string" &&
    url.length > 0 &&
    !url.includes("sua-url-aqui") &&
    typeof key === "string" &&
    key.length > 0
  );
};

let cachedClient: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (cachedClient) return cachedClient;
  if (!isSupabaseConfigured()) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  cachedClient = createClient(url, key, {
    auth: {
      persistSession: false,
    },
  });

  return cachedClient;
};

// Cliente para uso direto em componentes e hooks
export const supabase: SupabaseClient | null = getSupabase();

// Converte um registro do banco (snake_case) para a interface Lote (camelCase)
export function rowToLote(row: any): Lote {
  return {
    edle: row.edle,
    numero: Number(row.numero),
    edital: row.edital || row.edle,
    tipo: row.tipo || "Diversos",
    cidade: row.cidade || "N/A",
    permitePF: Boolean(row.permite_pf),
    valorMinimo: Number(row.valor_minimo) || 0,
    valorAvaliacao: Number(row.valor_avaliacao) || 0,
    urlOficial: row.url_oficial || "",
    itens: Array.isArray(row.itens) ? row.itens : [],
    itensMatch: Array.isArray(row.itens_match) ? row.itens_match : (Array.isArray(row.itens) ? row.itens : []),
    imagens: Array.isArray(row.imagens) ? row.imagens : [],
    avisosErratas: Array.isArray(row.avisos_erratas) ? row.avisos_erratas : [],
    nrAvisos: Array.isArray(row.avisos_erratas) ? row.avisos_erratas.length : 0,
    nrErratas: 0,
    dataInicioPropostas: row.data_inicio_propostas || undefined,
    dataFimPropostas: row.data_fim_propostas || undefined,
    dataAberturaLances: row.data_abertura_lances || undefined,
    salvoEm: row.salvo_em,
  };
}

// Converte a interface Lote para o formato de linha da tabela no Supabase
export function loteToRow(lote: Lote) {
  return {
    id: `${lote.edle}_${lote.numero}`,
    edle: lote.edle,
    numero: lote.numero,
    edital: lote.edital || lote.edle,
    tipo: lote.tipo,
    cidade: lote.cidade,
    permite_pf: lote.permitePF,
    valor_minimo: lote.valorMinimo,
    valor_avaliacao: lote.valorAvaliacao || 0,
    url_oficial: lote.urlOficial,
    itens: lote.itens || [],
    itens_match: lote.itensMatch || lote.itens || [],
    imagens: lote.imagens || [],
    avisos_erratas: lote.avisosErratas || [],
    data_inicio_propostas: lote.dataInicioPropostas || null,
    data_fim_propostas: lote.dataFimPropostas || null,
    data_abertura_lances: lote.dataAberturaLances || null,
    salvo_em: lote.salvoEm || new Date().toISOString(),
  };
}
