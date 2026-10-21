import { NextRequest, NextResponse } from "next/server";
import {
  getEditaisDisponiveis,
  getEditalDetalhes,
  getLoteDetalhes,
  normalizeText,
  parseEdle,
  buildOficialUrl,
} from "@/lib/receita";
import { Lote, ItemLote, ImagemLote, AvisoErrata } from "@/lib/types";

export const maxDuration = 60; // 60 segundos no runtime serverless

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const query = searchParams.get("q") || "";
  const apenasPF = searchParams.get("pf") === "true";
  const maxValorStr = searchParams.get("maxValor");
  const maxValor = maxValorStr ? parseFloat(maxValorStr) : null;
  const cidade = searchParams.get("cidade") || "";
  const editalFiltro = searchParams.get("edital") || "";
  const limiteEditais = parseInt(searchParams.get("limiteEditais") || "10", 10);

  const keywords = query
    .split(",")
    .map((k) => normalizeText(k))
    .filter((k) => k.length > 0);

  const cidadeNorm = normalizeText(cidade);

  try {
    let editais = await getEditaisDisponiveis(true);

    if (editalFiltro) {
      editais = editais.filter((e) => e.edle === editalFiltro || e.edital === editalFiltro);
    }

    if (apenasPF) {
      editais = editais.filter((e) => e.permitePF);
    }

    if (cidadeNorm) {
      editais = editais.filter((e) => normalizeText(e.cidade || "").includes(cidadeNorm));
    }

    if (limiteEditais > 0) {
      editais = editais.slice(0, limiteEditais);
    }

    const resultados: Lote[] = [];

    // Processa cada edital
    for (const edital of editais) {
      let unidade = "";
      let numero = "";
      let exercicio = "";

      try {
        const parts = parseEdle(edital.edle);
        unidade = parts.unidade;
        numero = parts.numero;
        exercicio = parts.exercicio;
      } catch {
        continue;
      }

      let dadosEdital: any;
      try {
        dadosEdital = await getEditalDetalhes(unidade, numero, exercicio);
      } catch {
        continue;
      }

      const listaLotes = dadosEdital.listaLotes || [];

      // Filtra candidatos no nível do lote
      const candidatos = listaLotes.filter((l: any) => {
        if (apenasPF && !l.permitePF) return false;
        if (maxValor !== null && (l.valorMinimo || 0) > maxValor) return false;
        return true;
      });

      // Busca os detalhes dos lotes em paralelo (chunks de 15)
      const chunkSize = 15;
      for (let i = 0; i < candidatos.length; i += chunkSize) {
        const chunk = candidatos.slice(i, i + chunkSize);
        const promessas = chunk.map(async (loteInfo: any) => {
          const loteNr = loteInfo.nrAtribuido || loteInfo.loleNrSq;
          if (!loteNr) return null;

          const detalhe = await getLoteDetalhes(unidade, numero, exercicio, loteNr);
          if (!detalhe || !detalhe.itensDetalhesLote) return null;

          const todosItens: ItemLote[] = (detalhe.itensDetalhesLote || []).map((it: any) => ({
            recintoArmazenador: it.recintoArmazenador || null,
            nrReferencia: it.nrReferencia || null,
            quantidade: it.quantidade || 1,
            unMedida: it.unMedida || "un",
            descricao: it.descricao || "",
          }));

          let itensMatch: ItemLote[] = [];
          if (keywords.length === 0) {
            itensMatch = todosItens;
          } else {
            itensMatch = todosItens.filter((it) => {
              const dNorm = normalizeText(it.descricao);
              return keywords.some((kw) => dNorm.includes(kw));
            });

            // Se não bateu na descrição mas bateu na categoria
            if (itensMatch.length === 0 && detalhe.tipo) {
              const tipoNorm = normalizeText(detalhe.tipo);
              if (keywords.some((kw) => tipoNorm.includes(kw))) {
                itensMatch = todosItens;
              }
            }
          }

          if (itensMatch.length === 0) return null;

          const imagens: ImagemLote[] = (detalhe.imagens || []).map((img: any) => ({
            imllNrSq: img.imllNrSq,
            src: img.src,
            min: img.min || img.src,
            w: img.w,
            h: img.h,
            destaque: img.destaque || false,
          }));

          const avisosErratas: AvisoErrata[] = (detalhe.avisosErratas || []).map((av: any) => ({
            data: av.data,
            codigoTipo: av.codigoTipo,
            tipo: av.tipo || (av.codigoTipo === 1 ? "Aviso" : "Errata"),
            texto: av.texto || "",
          }));

          const loteResultado: Lote = {
            edital: edital.edital,
            edle: edital.edle,
            numero: loteNr,
            tipo: detalhe.tipo || loteInfo.tipo || "DIVERSOS",
            permitePF: loteInfo.permitePF ?? false,
            cidade: edital.cidade || detalhe.cidade || "Brasil",
            valorMinimo: Number(loteInfo.valorMinimo || 0),
            valorAvaliacao: Number(loteInfo.valorAvaliacao || 0),
            itens: todosItens,
            itensMatch,
            imagens,
            avisosErratas,
            nrAvisos: detalhe.nrAvisos || avisosErratas.filter((a) => a.tipo === "Aviso").length,
            nrErratas: detalhe.nrErratas || avisosErratas.filter((a) => a.tipo === "Errata").length,
            urlOficial: buildOficialUrl(unidade, numero, exercicio, loteNr),
          };

          return loteResultado;
        });

        const resolvidos = await Promise.all(promessas);
        for (const lote of resolvidos) {
          if (lote) resultados.push(lote);
        }
      }
    }

    // Ordena por edital e lote
    resultados.sort((a, b) => a.edle.localeCompare(b.edle) || a.numero - b.numero);

    return NextResponse.json({
      total: resultados.length,
      editaisAnalisados: editais.length,
      lotes: resultados,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Erro ao executar pesquisa de lotes", details: error.message },
      { status: 500 }
    );
  }
}
