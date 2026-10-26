/*
 * Tipos do domínio no front-end. Espelham as entidades do back-end (DDD):
 * Usuario, Chamado, Mensagem e Categoria.
 */

export type Perfil = 'Aluno' | 'Funcionario' | 'Atendente' | 'Administrador';

/** Equipes de atendimento: cada atendente pertence a uma, e cada chamado vai para uma. */
export type Equipe = 'Biblioteca' | 'SuporteTI' | 'Secretaria' | 'Coordenacao';

export type GrauDoCurso = 'Bacharelado' | 'Licenciatura' | 'Tecnologo';
export type ModalidadeDoCurso = 'Presencial' | 'EaD' | 'Semipresencial';

/** Curso de graduação da Unisa. Cada curso tem a sua coordenação. */
export interface Curso {
  id: string;
  nome: string;
  grau: GrauDoCurso;
  modalidade: ModalidadeDoCurso;
}

/** Aberto → EmAtendimento ⇄ AguardandoUsuario → Encerrado */
export type StatusChamado = 'Aberto' | 'EmAtendimento' | 'AguardandoUsuario' | 'Encerrado';

export type OrigemMensagem = 'Usuario' | 'Atendente' | 'Bot';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  /** Só atendentes e administradores têm equipe. */
  equipe: Equipe | null;
  /** Cursos que a pessoa coordena. Só quem está na Coordenação tem. */
  cursos: Curso[];
  /** true enquanto a pessoa estiver com a senha inicial criada pelo administrador. */
  precisaTrocarSenha: boolean;
}

export interface Categoria {
  id: string;
  nome: string;
  /** Equipe que recebe os chamados desta categoria. */
  equipe: Equipe;
}

export interface Chamado {
  id: string;
  protocolo: string;
  titulo: string;
  descricao: string;
  categoriaId: string;
  categoriaNome: string;
  /** Só nos chamados para a Coordenação: o curso decide quem atende. */
  cursoId: string | null;
  cursoNome: string | null;
  status: StatusChamado;
  equipe: Equipe;
  solicitanteId: string;
  solicitanteNome: string;
  atendenteId: string | null;
  atendenteNome: string | null;
  criadoEm: string;
  encerradoEm: string | null;
}

export interface Mensagem {
  id: string;
  autorId: string | null;
  autorNome: string | null;
  origem: OrigemMensagem;
  conteudo: string;
  enviadaEm: string;
}

export interface ChamadoDetalhe extends Chamado {
  mensagens: Mensagem[];
}

export interface NovoChamado {
  titulo: string;
  descricao: string;
  categoriaId: string;
  /** Obrigatório quando a categoria é da Coordenação. */
  cursoId?: string;
}

export interface DadosCadastro {
  nome: string;
  email: string;
  senha: string;
  perfil: 'Aluno' | 'Funcionario';
}

/** Conta da equipe de atendimento, como o administrador vê na tela Equipe. */
export interface Atendente {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  equipe: Equipe | null;
  ativo: boolean;
  criadoEm: string;
  /** Cursos que coordena (só na Coordenação). */
  cursos: Curso[];
  /** Ainda não entrou para trocar a senha inicial. */
  precisaTrocarSenha: boolean;
}

export interface NovoAtendente {
  nome: string;
  email: string;
  senha: string;
  equipe: Equipe;
  administrador: boolean;
  /** Ids dos cursos. Pelo menos um na Coordenação. */
  cursos: string[];
}

export interface AlteracaoAtendente {
  equipe: Equipe;
  administrador: boolean;
  ativo: boolean;
  cursos: string[];
}

/** Item do histórico enviado ao chatbot a cada pergunta. */
export interface MensagemAssistente {
  papel: 'usuario' | 'assistente';
  conteudo: string;
}

export interface RespostaAssistente {
  resposta: string;
  /** true quando o bot entende que o caso precisa de um atendente humano. */
  escalar: boolean;
}

export interface Sessao {
  token: string;
  usuario: Usuario;
}
