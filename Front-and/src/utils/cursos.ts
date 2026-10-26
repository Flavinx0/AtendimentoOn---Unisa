import type { Curso, GrauDoCurso, ModalidadeDoCurso } from '../types';
import { semAcento } from './texto';

export const GRAUS: Record<GrauDoCurso, string> = {
  Bacharelado: 'Bacharelado',
  Licenciatura: 'Licenciatura',
  Tecnologo: 'Tecnólogo',
};

export const MODALIDADES: Record<ModalidadeDoCurso, string> = {
  Presencial: 'Presencial',
  EaD: 'EaD',
  Semipresencial: 'Semipresencial',
};

export const LISTA_MODALIDADES = Object.keys(MODALIDADES) as ModalidadeDoCurso[];

/** "Análise e Desenvolvimento de Sistemas (Tecnólogo, Presencial)", igual ao que a API devolve no chamado. */
export function nomeCompletoDoCurso(curso: Curso): string {
  return `${curso.nome} (${GRAUS[curso.grau]}, ${MODALIDADES[curso.modalidade]})`;
}

/** "Análise e Desenvolvimento de Sistemas (Tecnólogo)": para listas já separadas por modalidade. */
export function nomeComGrau(curso: Curso): string {
  return `${curso.nome} (${GRAUS[curso.grau]})`;
}

export function ordenarCursos(cursos: Curso[]): Curso[] {
  return [...cursos].sort(
    (a, b) => a.nome.localeCompare(b.nome, 'pt-BR') || GRAUS[a.grau].localeCompare(GRAUS[b.grau], 'pt-BR'),
  );
}

/** Separa os cursos por modalidade, na ordem Presencial, EaD, Semipresencial. */
export function agruparPorModalidade(cursos: Curso[]): { modalidade: ModalidadeDoCurso; cursos: Curso[] }[] {
  return LISTA_MODALIDADES.map((modalidade) => ({
    modalidade,
    cursos: ordenarCursos(cursos.filter((c) => c.modalidade === modalidade)),
  })).filter((grupo) => grupo.cursos.length > 0);
}

/** Busca sem acento e sem diferenciar maiúsculas, pelo nome, grau ou modalidade. */
export function filtrarCursos(cursos: Curso[], termo: string): Curso[] {
  const procurado = semAcento(termo.trim());
  if (!procurado) return cursos;
  return cursos.filter((curso) => semAcento(nomeCompletoDoCurso(curso)).includes(procurado));
}
