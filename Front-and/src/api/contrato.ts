import type {
  AlteracaoAtendente,
  Atendente,
  Categoria,
  Chamado,
  ChamadoDetalhe,
  Curso,
  DadosCadastro,
  MensagemAssistente,
  NovoAtendente,
  NovoChamado,
  RespostaAssistente,
  Usuario,
} from '../types';

export interface RespostaLogin {
  token: string;
  /** Opcional: se o login devolver os dados do usuário, eles completam as claims do token. */
  usuario?: Partial<Usuario>;
}

/**
 * Tudo o que o front precisa da API. Existem duas implementações:
 * httpApi (API real em C#) e mockApi (dados simulados no navegador).
 */
export interface Api {
  login(email: string, senha: string): Promise<RespostaLogin>;
  /** Troca a senha de quem está logado. Devolve um token novo. */
  trocarSenha(senhaAtual: string, novaSenha: string): Promise<RespostaLogin>;
  /**
   * "Esqueci minha senha": pede o código por e-mail. A API responde igual exista a conta ou não.
   * No modo demonstração, que não envia e-mails, o código volta em codigoDeDemonstracao.
   */
  pedirCodigoDeRecuperacao(email: string): Promise<{ codigoDeDemonstracao?: string }>;
  redefinirSenha(email: string, codigo: string, novaSenha: string): Promise<void>;
  cadastrar(dados: DadosCadastro): Promise<void>;
  listarCategorias(): Promise<Categoria[]>;
  /** Cursos de graduação, para falar com a coordenação e para vincular coordenadores. */
  listarCursos(): Promise<Curso[]>;
  listarChamados(): Promise<Chamado[]>;
  obterChamado(id: string): Promise<ChamadoDetalhe>;
  abrirChamado(dados: NovoChamado): Promise<Chamado>;
  enviarMensagem(chamadoId: string, conteudo: string): Promise<void>;
  assumirChamado(id: string): Promise<void>;
  encerrarChamado(id: string): Promise<void>;
  perguntarAoAssistente(mensagem: string, historico: MensagemAssistente[]): Promise<RespostaAssistente>;

  /* Gestão da equipe de atendimento: só administradores (Suporte de TI). */
  listarAtendentes(): Promise<Atendente[]>;
  cadastrarAtendente(dados: NovoAtendente): Promise<Atendente>;
  atualizarAtendente(id: string, dados: AlteracaoAtendente): Promise<Atendente>;
}
