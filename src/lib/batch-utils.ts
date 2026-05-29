/** Extrai o nome da carga a partir do nome do arquivo (sem extensão). */
export function batchNameFromFileName(fileName: string): string {
  const base = fileName.replace(/\\/g, "/").split("/").pop() ?? fileName;
  const dot = base.lastIndexOf(".");
  return dot > 0 ? base.slice(0, dot) : base;
}

export type BatchStats = {
  total: number;
  novo: number;
  contatoIniciado: number;
  semResposta: number;
  interessado: number;
  propostaEnviada: number;
  negociacao: number;
  vendido: number;
  perdido: number;
};

export function emptyBatchStats(): BatchStats {
  return { total: 0, novo: 0, contatoIniciado: 0, semResposta: 0, interessado: 0, propostaEnviada: 0, negociacao: 0, vendido: 0, perdido: 0 };
}
