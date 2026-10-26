import type { Chamado } from '../types';

const instante = (iso: string) => new Date(iso).getTime() || 0;

export function ordenarRecentes<T extends Chamado>(lista: T[]): T[] {
  return [...lista].sort((a, b) => instante(b.criadoEm) - instante(a.criadoEm));
}

/** A fila de atendimento é atendida por ordem de chegada. */
export function ordenarAntigos<T extends Chamado>(lista: T[]): T[] {
  return [...lista].sort((a, b) => instante(a.criadoEm) - instante(b.criadoEm));
}

export function reduzirMovimento(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}
