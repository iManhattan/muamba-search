/**
 * Converte data da Receita (ex: "2026-11-16 08:00") para formato brasileiro legível
 */
export function formatarDataBR(dataStr?: string): string {
  if (!dataStr) return "-";
  const [data, hora] = dataStr.split(" ");
  if (!data) return dataStr;

  const partes = data.split("-");
  if (partes.length === 3) {
    const dia = partes[2];
    const mes = partes[1];
    const ano = partes[0];
    const horaFormatada = hora ? ` às ${hora.replace(":", "h")}` : "";
    return `${dia}/${mes}/${ano}${horaFormatada}`;
  }

  return dataStr;
}

export function formatarDataCurta(dataStr?: string): string {
  if (!dataStr) return "-";
  const [data, hora] = dataStr.split(" ");
  if (!data) return dataStr;

  const partes = data.split("-");
  if (partes.length === 3) {
    const dia = partes[2];
    const mes = partes[1];
    const horaFormatada = hora ? ` ${hora}` : "";
    return `${dia}/${mes}${horaFormatada}`;
  }

  return dataStr;
}

export interface StatusProposta {
  label: string;
  badgeClass: string;
  dotClass: string;
}

export function getStatusPrazo(inicio?: string, fim?: string): StatusProposta {
  if (!inicio && !fim) {
    return {
      label: "Prazo não informado",
      badgeClass: "bg-slate-800 text-slate-400 border-slate-700",
      dotClass: "bg-slate-400",
    };
  }

  const parseData = (str?: string) => {
    if (!str) return null;
    // Formato "YYYY-MM-DD HH:mm"
    return new Date(str.replace(" ", "T") + ":00-03:00");
  };

  const agora = new Date();
  const dataInicio = parseData(inicio);
  const dataFim = parseData(fim);

  if (dataInicio && agora < dataInicio) {
    return {
      label: `Abre em ${formatarDataCurta(inicio)}`,
      badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/30",
      dotClass: "bg-amber-400 animate-pulse",
    };
  }

  if (dataFim && agora <= dataFim) {
    return {
      label: `Aberto até ${formatarDataCurta(fim)}`,
      badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
      dotClass: "bg-emerald-400 animate-pulse",
    };
  }

  return {
    label: `Encerrado em ${formatarDataCurta(fim)}`,
    badgeClass: "bg-slate-800 text-slate-400 border-slate-700",
    dotClass: "bg-slate-500",
  };
}
