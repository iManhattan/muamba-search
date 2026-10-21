import { NextResponse } from "next/server";
import { getEditaisDisponiveis } from "@/lib/receita";

export async function GET() {
  try {
    const editais = await getEditaisDisponiveis(true);
    return NextResponse.json({ editais, total: editais.length });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Erro ao buscar editais disponíveis", details: error.message },
      { status: 500 }
    );
  }
}
