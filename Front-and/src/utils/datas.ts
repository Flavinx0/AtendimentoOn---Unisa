const SEM_FUSO = /T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/;

/**
 * O .NET costuma devolver datas do SQL Server sem fuso ("2026-10-23T14:05:00").
 * Tratamos esses valores como UTC; por isso o back-end deve gravar DateTime.UtcNow.
 */
export function normalizarData(valor: unknown): string {
  if (typeof valor !== 'string' || !valor) return new Date().toISOString();
  return SEM_FUSO.test(valor) ? `${valor}Z` : valor;
}

export function normalizarDataOuNulo(valor: unknown): string | null {
  if (valor === null || valor === undefined || valor === '') return null;
  return normalizarData(valor);
}

const formatoDataHora = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
const formatoHora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });
const formatoDia = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' });
const relativo = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });

function paraData(iso: string): Date | null {
  const data = new Date(iso);
  return Number.isNaN(data.getTime()) ? null : data;
}

/** 23/10/2026, 14:05 */
export function formatarDataHora(iso: string): string {
  const data = paraData(iso);
  return data ? formatoDataHora.format(data) : '';
}

/** "hoje, 14:05", "ontem, 09:12" ou "23/10/2026, 14:05" */
export function formatarMomento(iso: string): string {
  const data = paraData(iso);
  if (!data) return '';
  const hoje = new Date();
  const ontem = new Date();
  ontem.setDate(hoje.getDate() - 1);
  if (data.toDateString() === hoje.toDateString()) return `hoje, ${formatoHora.format(data)}`;
  if (data.toDateString() === ontem.toDateString()) return `ontem, ${formatoHora.format(data)}`;
  return formatoDataHora.format(data);
}

/** "agora", "há 5 minutos", "ontem", "em 16 de out." */
export function tempoRelativo(iso: string): string {
  const data = paraData(iso);
  if (!data) return '';
  const segundos = Math.round((data.getTime() - Date.now()) / 1000);
  const absoluto = Math.abs(segundos);
  if (absoluto < 45) return 'agora';
  if (absoluto < 3600) return relativo.format(Math.round(segundos / 60), 'minute');
  if (absoluto < 86400) return relativo.format(Math.round(segundos / 3600), 'hour');
  if (absoluto < 86400 * 7) return relativo.format(Math.round(segundos / 86400), 'day');
  return `em ${formatoDia.format(data)}`;
}
