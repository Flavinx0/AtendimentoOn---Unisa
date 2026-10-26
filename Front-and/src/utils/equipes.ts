import type { Chamado, Equipe, Perfil, Usuario } from '../types';

interface InfoEquipe {
  nome: string;
  /** "da" ou "do", para frases como "Fila da Biblioteca". */
  artigo: 'da' | 'do';
  descricao: string;
}

export const EQUIPES: Record<Equipe, InfoEquipe> = {
  Biblioteca: {
    nome: 'Biblioteca',
    artigo: 'da',
    descricao: 'Empréstimos, renovações, reservas e multas.',
  },
  SuporteTI: {
    nome: 'Suporte de TI',
    artigo: 'do',
    descricao: 'Acessos, senhas, e-mail institucional e equipamentos. Também gerencia a equipe de atendimento.',
  },
  Secretaria: {
    nome: 'Secretaria',
    artigo: 'da',
    descricao: 'Financeiro, documentos, matrícula e os demais pedidos de alunos e funcionários.',
  },
  Coordenacao: {
    nome: 'Coordenação',
    artigo: 'da',
    descricao: 'Assuntos do curso: disciplinas, estágio, TCC e aproveitamento de estudos. Cada coordenação atende os seus cursos.',
  },
};

export const LISTA_EQUIPES = Object.keys(EQUIPES) as Equipe[];

/** "Fila da Biblioteca", "Fila do Suporte de TI"... */
export function nomeDaFila(equipe: Equipe): string {
  return `Fila ${EQUIPES[equipe].artigo} ${EQUIPES[equipe].nome}`;
}

export function ehAtendimento(perfil: Perfil): boolean {
  return perfil === 'Atendente' || perfil === 'Administrador';
}

/**
 * Pode assumir e responder: administrador, ou atendente da equipe do chamado.
 * Na Coordenação, o atendente também precisa coordenar o curso do chamado.
 */
export function podeAtender(usuario: Usuario, chamado: Pick<Chamado, 'equipe' | 'cursoId'>): boolean {
  if (usuario.perfil === 'Administrador') return true;
  if (usuario.perfil !== 'Atendente' || usuario.equipe !== chamado.equipe) return false;
  return chamado.equipe !== 'Coordenacao' || usuario.cursos.some((curso) => curso.id === chamado.cursoId);
}

/** Converte o texto de um parâmetro da URL em equipe (ou nada). */
export function equipeOuNulo(valor: string | null): Equipe | null {
  return valor && (LISTA_EQUIPES as string[]).includes(valor) ? (valor as Equipe) : null;
}
