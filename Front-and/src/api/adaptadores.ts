/*
 * "Ponte" entre o JSON da API em C# e os tipos do front.
 * Se algum DTO do back-end usar outro nome de campo, ajuste só aqui:
 * o resto da aplicação continua igual.
 */
import type { RespostaLogin } from './contrato';
import type {
  Atendente,
  Categoria,
  Chamado,
  ChamadoDetalhe,
  Curso,
  Equipe,
  GrauDoCurso,
  Mensagem,
  ModalidadeDoCurso,
  OrigemMensagem,
  Perfil,
  RespostaAssistente,
  StatusChamado,
  Usuario,
} from '../types';
import { normalizarData, normalizarDataOuNulo } from '../utils/datas';
import { gerarId } from '../utils/id';
import { semAcento } from '../utils/texto';

type Bruto = Record<string, unknown>;

function objeto(valor: unknown): Bruto {
  return valor && typeof valor === 'object' ? (valor as Bruto) : {};
}

function texto(valor: unknown, padrao = ''): string {
  return valor === null || valor === undefined ? padrao : String(valor);
}

function textoOuNulo(valor: unknown): string | null {
  return valor === null || valor === undefined || valor === '' ? null : String(valor);
}

function chave(valor: unknown): string {
  return semAcento(String(valor ?? '')).replace(/[\s_-]/g, '');
}

const STATUS: StatusChamado[] = ['Aberto', 'EmAtendimento', 'AguardandoUsuario', 'Encerrado'];
const ORIGENS: OrigemMensagem[] = ['Usuario', 'Atendente', 'Bot'];
const PERFIS: Perfil[] = ['Aluno', 'Funcionario', 'Atendente', 'Administrador'];
const EQUIPES: Equipe[] = ['Biblioteca', 'SuporteTI', 'Secretaria', 'Coordenacao'];
const GRAUS: GrauDoCurso[] = ['Bacharelado', 'Licenciatura', 'Tecnologo'];
const MODALIDADES: ModalidadeDoCurso[] = ['Presencial', 'EaD', 'Semipresencial'];

/** Aceita enum como texto ("EmAtendimento") ou como número (0, 1, 2...). */
function porNomeOuIndice<T extends string>(valor: unknown, opcoes: T[], padrao: T): T {
  if (typeof valor === 'number') return opcoes[valor] ?? padrao;
  const procurado = chave(valor);
  if (/^\d+$/.test(procurado)) return opcoes[Number(procurado)] ?? padrao;
  return opcoes.find((opcao) => chave(opcao) === procurado) ?? padrao;
}

export function normalizarStatus(valor: unknown): StatusChamado {
  return porNomeOuIndice(valor, STATUS, 'Aberto');
}

export function normalizarPerfil(valor: unknown): Perfil {
  const procurado = chave(valor);
  if (procurado.includes('admin')) return 'Administrador';
  if (procurado.includes('atend')) return 'Atendente';
  if (procurado.includes('func')) return 'Funcionario';
  return porNomeOuIndice(valor, PERFIS, 'Aluno');
}

/** Aceita a equipe como texto ("SuporteTI") ou número (0, 1, 2...). Vazio vira null. */
export function normalizarEquipe(valor: unknown): Equipe | null {
  if (valor === null || valor === undefined || valor === '') return null;
  const procurado = chave(valor);
  if (/^\d+$/.test(procurado)) return EQUIPES[Number(procurado)] ?? null;
  return EQUIPES.find((equipe) => chave(equipe) === procurado) ?? null;
}

export function normalizarCurso(dado: unknown): Curso {
  const d = objeto(dado);
  return {
    id: texto(d.id),
    nome: texto(d.nome, 'Curso sem nome'),
    grau: porNomeOuIndice(d.grau, GRAUS, 'Bacharelado'),
    modalidade: porNomeOuIndice(d.modalidade, MODALIDADES, 'Presencial'),
  };
}

function normalizarCursos(valor: unknown): Curso[] {
  return Array.isArray(valor) ? valor.map(normalizarCurso) : [];
}

export function normalizarUsuario(dado: unknown): Partial<Usuario> {
  const d = objeto(dado);
  const nome = d.nome ?? d.name;
  const perfil = d.perfil ?? d.role ?? d.tipo;
  return {
    id: d.id === undefined || d.id === null ? undefined : String(d.id),
    nome: typeof nome === 'string' ? nome : undefined,
    email: typeof d.email === 'string' ? d.email : undefined,
    perfil: perfil === undefined || perfil === null ? undefined : normalizarPerfil(perfil),
    equipe: d.equipe === undefined ? undefined : normalizarEquipe(d.equipe),
    cursos: d.cursos === undefined ? undefined : normalizarCursos(d.cursos),
    precisaTrocarSenha: d.precisaTrocarSenha === undefined ? undefined : d.precisaTrocarSenha === true,
  };
}

export function normalizarRespostaLogin(dado: unknown): RespostaLogin {
  if (typeof dado === 'string' && dado.split('.').length === 3) return { token: dado };
  const d = objeto(dado);
  const token = [d.token, d.accessToken, d.access_token, d.jwt].find(
    (valor): valor is string => typeof valor === 'string' && valor !== '',
  );
  if (!token) {
    throw new Error('O login respondeu sem um token JWT. Confira o retorno de POST /api/auth/login.');
  }
  const usuario = d.usuario ?? d.user;
  return { token, usuario: usuario ? normalizarUsuario(usuario) : undefined };
}

export function normalizarCategoria(dado: unknown): Categoria {
  const d = objeto(dado);
  return { id: texto(d.id), nome: texto(d.nome ?? d.descricao, 'Sem nome'), equipe: normalizarEquipe(d.equipe) ?? 'Secretaria' };
}

export function normalizarChamado(dado: unknown): Chamado {
  const d = objeto(dado);
  const categoria = objeto(d.categoria);
  const solicitante = objeto(d.solicitante);
  const atendente = objeto(d.atendente);
  const id = texto(d.id);
  return {
    id,
    protocolo: texto(d.protocolo, id.slice(0, 8).toUpperCase()),
    titulo: texto(d.titulo),
    descricao: texto(d.descricao),
    categoriaId: texto(d.categoriaId ?? categoria.id),
    categoriaNome: texto(d.categoriaNome ?? categoria.nome, 'Sem categoria'),
    cursoId: textoOuNulo(d.cursoId ?? objeto(d.curso).id),
    cursoNome: textoOuNulo(d.cursoNome ?? objeto(d.curso).nome),
    status: normalizarStatus(d.status),
    equipe: normalizarEquipe(d.equipe) ?? 'Secretaria',
    solicitanteId: texto(d.solicitanteId ?? solicitante.id),
    solicitanteNome: texto(d.solicitanteNome ?? solicitante.nome),
    atendenteId: textoOuNulo(d.atendenteId ?? atendente.id),
    atendenteNome: textoOuNulo(d.atendenteNome ?? atendente.nome),
    criadoEm: normalizarData(d.criadoEm ?? d.dataAbertura),
    encerradoEm: normalizarDataOuNulo(d.encerradoEm ?? d.dataEncerramento),
  };
}

export function normalizarMensagem(dado: unknown): Mensagem {
  const d = objeto(dado);
  const autor = objeto(d.autor);
  return {
    id: texto(d.id, gerarId()),
    autorId: textoOuNulo(d.autorId ?? autor.id),
    autorNome: textoOuNulo(d.autorNome ?? autor.nome),
    origem: porNomeOuIndice(d.origem, ORIGENS, 'Usuario'),
    conteudo: texto(d.conteudo ?? d.texto),
    enviadaEm: normalizarData(d.enviadaEm ?? d.criadoEm),
  };
}

export function normalizarChamadoDetalhe(dado: unknown): ChamadoDetalhe {
  const d = objeto(dado);
  const mensagens = Array.isArray(d.mensagens) ? d.mensagens.map(normalizarMensagem) : [];
  mensagens.sort((a, b) => new Date(a.enviadaEm).getTime() - new Date(b.enviadaEm).getTime());
  return { ...normalizarChamado(d), mensagens };
}

/** Aceita lista pura ou paginada ({ itens: [...] }, { items: [...] }). */
export function normalizarLista<T>(dado: unknown, normalizar: (item: unknown) => T): T[] {
  if (Array.isArray(dado)) return dado.map((item) => normalizar(item));
  const d = objeto(dado);
  const itens = d.itens ?? d.items ?? d.dados ?? d.data;
  return Array.isArray(itens) ? itens.map((item) => normalizar(item)) : [];
}

export function normalizarRespostaAssistente(dado: unknown): RespostaAssistente {
  if (typeof dado === 'string') return { resposta: dado, escalar: false };
  const d = objeto(dado);
  return {
    resposta: texto(d.resposta ?? d.mensagem ?? d.texto, 'O assistente não enviou resposta.'),
    escalar: d.escalar === true || d.escalarParaAtendente === true,
  };
}

export function normalizarAtendente(dado: unknown): Atendente {
  const d = objeto(dado);
  return {
    id: texto(d.id),
    nome: texto(d.nome),
    email: texto(d.email),
    perfil: normalizarPerfil(d.perfil),
    equipe: normalizarEquipe(d.equipe),
    ativo: d.ativo !== false,
    criadoEm: normalizarData(d.criadoEm),
    cursos: normalizarCursos(d.cursos),
    precisaTrocarSenha: d.precisaTrocarSenha === true,
  };
}
