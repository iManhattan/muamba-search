import { NextRequest, NextResponse } from "next/server";
import { getSupabase, isSupabaseConfigured, rowToLote, loteToRow } from "@/lib/supabase";
import { Lote } from "@/lib/types";

export async function GET(req: NextRequest) {
  const db = getSupabase();
  if (!isSupabaseConfigured() || !db) {
    return NextResponse.json({
      lotes: [],
      isConfigured: false,
      message: "Supabase não configurado. Adicione NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    });
  }

  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.toLowerCase();

    let dbQuery = db
      .from("saved_lotes")
      .select("*")
      .order("salvo_em", { ascending: false });

    const { data, error } = await dbQuery;

    if (error) {
      console.error("Erro ao buscar lotes salvos no Supabase:", error);
      return NextResponse.json(
        { error: "Erro ao consultar o banco de dados.", details: error.message },
        { status: 500 }
      );
    }

    let lotes: Lote[] = (data || []).map(rowToLote);

    // Filtro adicional por busca de texto se fornecido
    if (query) {
      lotes = lotes.filter((l) => {
        const matchEdital = l.edle.toLowerCase().includes(query);
        const matchLoteNum = l.numero.toString().includes(query);
        const matchTipo = l.tipo.toLowerCase().includes(query);
        const matchCidade = l.cidade.toLowerCase().includes(query);
        const matchItens = l.itens.some((i) =>
          i.descricao.toLowerCase().includes(query)
        );
        return matchEdital || matchLoteNum || matchTipo || matchCidade || matchItens;
      });
    }

    return NextResponse.json({
      lotes,
      isConfigured: true,
      total: lotes.length,
    });
  } catch (err: any) {
    console.error("Erro inesperado em GET /api/saved-lotes:", err);
    return NextResponse.json(
      { error: "Erro interno no servidor.", details: err?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const db = getSupabase();
  if (!isSupabaseConfigured() || !db) {
    return NextResponse.json(
      {
        error: "Supabase não configurado.",
        isConfigured: false,
      },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const lote: Lote = body.lote;

    if (!lote || !lote.edle || typeof lote.numero !== "number") {
      return NextResponse.json(
        { error: "Payload inválido. 'edle' e 'numero' são obrigatórios." },
        { status: 400 }
      );
    }

    const row = loteToRow(lote);

    const { error } = await db
      .from("saved_lotes")
      .upsert(row, { onConflict: "id" });

    if (error) {
      console.error("Erro ao salvar lote no Supabase:", error);
      return NextResponse.json(
        { error: "Falha ao gravar no banco.", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, lote });
  } catch (err: any) {
    console.error("Erro inesperado em POST /api/saved-lotes:", err);
    return NextResponse.json(
      { error: "Erro interno ao processar requisição.", details: err?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const db = getSupabase();
  if (!isSupabaseConfigured() || !db) {
    return NextResponse.json(
      { error: "Supabase não configurado.", isConfigured: false },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const edle = searchParams.get("edle");
    const numeroStr = searchParams.get("numero");

    if (!edle || !numeroStr) {
      return NextResponse.json(
        { error: "Parâmetros 'edle' e 'numero' são obrigatórios." },
        { status: 400 }
      );
    }

    const id = `${edle}_${numeroStr}`;

    const { error } = await db
      .from("saved_lotes")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Erro ao deletar lote no Supabase:", error);
      return NextResponse.json(
        { error: "Falha ao remover do banco.", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error("Erro inesperado em DELETE /api/saved-lotes:", err);
    return NextResponse.json(
      { error: "Erro interno ao processar requisição.", details: err?.message },
      { status: 500 }
    );
  }
}
