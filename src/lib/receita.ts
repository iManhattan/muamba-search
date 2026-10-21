import { Edital, Lote, ItemLote, ImagemLote, AvisoErrata } from "./types";

const SLE_BASE = "https://www25.receita.fazenda.gov.br/sle-sociedade";

const DEFAULT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  Referer: `${SLE_BASE}/portal`,
  "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
};

export function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function parseEdle(edle: string): { unidade: string; numero: string; exercicio: string } {
  const parts = edle.trim().split("/");
  if (parts.length === 3) {
    return { unidade: parts[0], numero: parts[1], exercicio: parts[2] };
  }
  throw new Error(`Edle inválido: ${edle}`);
}

export function buildOficialUrl(unidade: string, numero: string, exercicio: string, loteNr: number): string {
  return `${SLE_BASE}/portal/edital/${unidade}/${numero}/${exercicio}/lote/${loteNr}`;
}

export async function getEditaisDisponiveis(apenasAbertos = true): Promise<Edital[]> {
  const res = await fetch(`${SLE_BASE}/api/editais-disponiveis`, {
    headers: DEFAULT_HEADERS,
    next: { revalidate: 300 }, // Cache por 5 minutos
  });

  if (!res.ok) {
    throw new Error(`Falha ao buscar editais: status ${res.status}`);
  }

  const data = await res.json();
  const editais: Edital[] = [];

  for (const sit of data.situacoes || []) {
    // 2 = propostas abertas / futuras, 3 = disputas abertas
    if (apenasAbertos && sit.situacao !== 2 && sit.situacao !== 3) {
      continue;
    }
    for (const item of sit.lista || []) {
      editais.push(item);
    }
  }

  return editais;
}

export async function getEditalDetalhes(unidade: string, numero: string, exercicio: string): Promise<any> {
  const res = await fetch(`${SLE_BASE}/api/edital/${unidade}/${numero}/${exercicio}`, {
    headers: DEFAULT_HEADERS,
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`Falha ao carregar edital ${unidade}/${numero}/${exercicio}`);
  }

  return res.json();
}

export async function getLoteDetalhes(
  unidade: string,
  numero: string,
  exercicio: string,
  loteNr: number
): Promise<any | null> {
  try {
    const res = await fetch(`${SLE_BASE}/api/lote/${unidade}/${numero}/${exercicio}/${loteNr}`, {
      headers: DEFAULT_HEADERS,
      next: { revalidate: 600 },
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Executa promessas em lotes com limite de concorrência para evitar sobrecarga.
 */
export async function mapConcurrent<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  const executing: Promise<void>[] = [];

  for (const item of items) {
    const p = fn(item).then((res) => {
      results.push(res);
    });
    executing.push(p);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      // Remove promessas concluídas
      for (let i = executing.length - 1; i >= 0; i--) {
        // @ts-ignore
        if (executing[i].isFulfilled || p === executing[i]) {
          executing.splice(i, 1);
        }
      }
    }
  }

  await Promise.all(executing);
  return results;
}
