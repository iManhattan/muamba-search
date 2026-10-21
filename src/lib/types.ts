export interface Edital {
  edital: string;
  edle: string;
  codigoSituacao?: number;
  permitePF: boolean;
  tipo?: string;
  uaNm?: string;
  orgao?: string;
  cidade?: string;
  dataInicioPropostas?: string;
  dataFimPropostas?: string;
  dataAberturaLances?: string;
}

export interface ItemLote {
  recintoArmazenador?: string | null;
  nrReferencia?: string | null;
  quantidade?: number;
  unMedida?: string;
  descricao: string;
}

export interface ImagemLote {
  imllNrSq: number;
  src: string;
  min: string;
  w?: number;
  h?: number;
  destaque?: boolean;
}

export interface AvisoErrata {
  data?: string;
  codigoTipo?: number;
  tipo: string;
  texto: string;
}

export interface Lote {
  edital: string;
  edle: string;
  numero: number;
  tipo: string;
  permitePF: boolean;
  cidade: string;
  valorMinimo: number;
  valorAvaliacao: number;
  itens: ItemLote[];
  itensMatch: ItemLote[];
  imagens: ImagemLote[];
  avisosErratas: AvisoErrata[];
  nrAvisos: number;
  nrErratas: number;
  dataInicioPropostas?: string;
  dataFimPropostas?: string;
  dataAberturaLances?: string;
  urlOficial: string;
}

export interface SearchFilters {
  q?: string;
  apenasPF?: boolean;
  valorMax?: number;
  cidade?: string;
  edital?: string;
  limiteEditais?: number;
}
