import type { Sessao } from '../types';
import { tokenExpirado } from './jwt';

const CHAVE = 'atendimento-on:sessao';
const aoExpirar = new Set<() => void>();

export function lerSessao(): Sessao | null {
  try {
    const salvo = localStorage.getItem(CHAVE);
    if (!salvo) return null;
    const sessao = JSON.parse(salvo) as Sessao;
    if (!sessao?.token || !sessao.usuario) return null;
    // Sessões gravadas antes das equipes e dos cursos existirem pedem um novo login.
    if (!('equipe' in sessao.usuario) || !('cursos' in sessao.usuario)) {
      localStorage.removeItem(CHAVE);
      return null;
    }
    if (tokenExpirado(sessao.token)) {
      localStorage.removeItem(CHAVE);
      return null;
    }
    return sessao;
  } catch {
    return null;
  }
}

export function salvarSessao(sessao: Sessao): void {
  localStorage.setItem(CHAVE, JSON.stringify(sessao));
}

export function limparSessao(): void {
  localStorage.removeItem(CHAVE);
}

/** Chamado pela camada HTTP quando a API responde 401 com um token enviado. */
export function notificarSessaoExpirada(): void {
  limparSessao();
  aoExpirar.forEach((ouvinte) => ouvinte());
}

export function aoExpirarSessao(ouvinte: () => void): () => void {
  aoExpirar.add(ouvinte);
  return () => {
    aoExpirar.delete(ouvinte);
  };
}
