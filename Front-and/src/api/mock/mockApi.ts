/*
 * API simulada para desenvolver e apresentar o front sem o back-end rodando.
 * Ative com VITE_USE_MOCK=true. Os dados ficam no localStorage do navegador.
 *
 * As regras daqui espelham as da API real:
 *  - cada chamado vai para a equipe da categoria: Biblioteca, Suporte de TI, Secretaria ou Coordenação;
 *  - para a Coordenação, o aluno escolhe o curso, e só quem coordena esse curso vê e atende o chamado;
 *  - atendentes veem e atendem só a própria equipe; administradores (Suporte de TI) veem todas;
 *  - só administradores cadastram atendentes; o cadastro público é só para alunos e funcionários;
 *  - atendente criado pelo administrador entra com senha provisória e precisa trocá-la antes de usar o sistema;
 *  - "Esqueci minha senha" gera um código de 6 dígitos (aqui ele aparece na tela, porque não há e-mail);
 *  - RN01: só o solicitante ou o atendente responsável encerra o chamado;
 *  - RN02: e-mail único.
 */
import type { Api } from '../contrato';
import type {
  Atendente,
  Categoria,
  Chamado,
  ChamadoDetalhe,
  Curso,
  Equipe,
  Perfil,
  RespostaAssistente,
  Usuario,
} from '../../types';
import { ApiError } from '../http';
import { decodificarJwt, textoParaBase64Url } from '../../auth/jwt';
import { lerSessao, notificarSessaoExpirada } from '../../auth/sessao';
import { nomeCompletoDoCurso, ordenarCursos } from '../../utils/cursos';
import { EQUIPES } from '../../utils/equipes';
import { gerarId } from '../../utils/id';
import { semAcento } from '../../utils/texto';
import { CURSOS_UNISA } from './cursos';

interface UsuarioMock {
  id: string;
  nome: string;
  email: string;
  senha: string;
  perfil: Perfil;
  equipe: Equipe | null;
  /** Ids dos cursos que coordena (só na Coordenação). */
  cursos: string[];
  /** Senha inicial criada pelo administrador, ainda não trocada. */
  precisaTrocarSenha: boolean;
  ativo: boolean;
  criadoEm: string;
}

interface CodigoMock {
  usuarioId: string;
  codigo: string;
  criadoEm: number;
  expiraEm: number;
  tentativasErradas: number;
  usado: boolean;
}

interface BancoMock {
  versao: number;
  proximoProtocolo: number;
  usuarios: UsuarioMock[];
  categorias: Categoria[];
  cursos: Curso[];
  chamados: ChamadoDetalhe[];
  codigos: CodigoMock[];
}

const CHAVE = 'atendimento-on:mock';
const VERSAO = 5;
const ANO = new Date().getFullYear();

export const CONTAS_DEMONSTRACAO: { rotulo: string; email: string; senha: string }[] = [
  { rotulo: 'Aluno', email: 'aluno@unisa.br', senha: '123456' },
  { rotulo: 'Funcionário', email: 'funcionario@unisa.br', senha: '123456' },
  { rotulo: 'Biblioteca', email: 'biblioteca@unisa.br', senha: '123456' },
  { rotulo: 'Secretaria', email: 'secretaria@unisa.br', senha: '123456' },
  { rotulo: 'Coordenação', email: 'coordenacao@unisa.br', senha: '123456' },
  { rotulo: 'Administrador (TI)', email: 'admin@unisa.br', senha: '123456' },
];

const minutosAtras = (minutos: number) => new Date(Date.now() - minutos * 60_000).toISOString();
const protocolo = (numero: number) => `ON-${ANO}-${String(numero).padStart(4, '0')}`;

function pessoa(
  id: string,
  nome: string,
  email: string,
  perfil: Perfil,
  equipe: Equipe | null = null,
  cursos: string[] = [],
): UsuarioMock {
  return {
    id,
    nome,
    email,
    senha: '123456',
    perfil,
    equipe,
    cursos,
    precisaTrocarSenha: false,
    ativo: true,
    criadoEm: minutosAtras(60 * 24 * 30),
  };
}

/** Curso dos dados de demonstração pelo nome, grau e modalidade. */
function cursoDemo(nome: string, grau: Curso['grau'], modalidade: Curso['modalidade']): Curso {
  const curso = CURSOS_UNISA.find((c) => c.nome === nome && c.grau === grau && c.modalidade === modalidade);
  if (!curso) throw new Error(`Curso não encontrado: ${nome}`);
  return curso;
}

function bancoInicial(): BancoMock {
  const ana = pessoa('u-ana', 'Ana Souza', 'aluno@unisa.br', 'Aluno');
  const carlos = pessoa('u-carlos', 'Carlos Lima', 'funcionario@unisa.br', 'Funcionario');
  const beatriz = pessoa('u-beatriz', 'Beatriz Rocha', 'biblioteca@unisa.br', 'Atendente', 'Biblioteca');
  const julia = pessoa('u-julia', 'Júlia Costa', 'secretaria@unisa.br', 'Atendente', 'Secretaria');
  const marcos = pessoa('u-marcos', 'Marcos Vieira', 'admin@unisa.br', 'Administrador', 'SuporteTI');
  const lucas = pessoa('u-lucas', 'Lucas Pereira', 'lucas@unisa.br', 'Aluno');

  // Renata coordena três cursos. Psicologia ainda não tem coordenação cadastrada no sistema.
  const adsPresencial = cursoDemo('Análise e Desenvolvimento de Sistemas', 'Tecnologo', 'Presencial');
  const adsEad = cursoDemo('Análise e Desenvolvimento de Sistemas', 'Tecnologo', 'EaD');
  const engSoftware = cursoDemo('Engenharia de Software', 'Bacharelado', 'Presencial');
  const psicologia = cursoDemo('Psicologia', 'Bacharelado', 'Presencial');
  const renata = pessoa('u-renata', 'Renata Alves', 'coordenacao@unisa.br', 'Atendente', 'Coordenacao', [
    adsPresencial.id,
    adsEad.id,
    engSoftware.id,
  ]);
  const doCurso = (curso: Curso) => ({ cursoId: curso.id, cursoNome: nomeCompletoDoCurso(curso) });

  const categorias: Categoria[] = [
    { id: '1', nome: 'Financeiro', equipe: 'Secretaria' },
    { id: '2', nome: 'Secretaria acadêmica', equipe: 'Secretaria' },
    { id: '3', nome: 'Suporte de TI', equipe: 'SuporteTI' },
    { id: '4', nome: 'Biblioteca', equipe: 'Biblioteca' },
    { id: '5', nome: 'Outros assuntos', equipe: 'Secretaria' },
    { id: '6', nome: 'Coordenação de curso', equipe: 'Coordenacao' },
  ];
  const categoria = (id: string) => categorias.find((c) => c.id === id)!;

  function chamado(
    numero: number,
    titulo: string,
    descricao: string,
    categoriaId: string,
    solicitante: UsuarioMock,
    criadoHaMinutos: number,
    extra: Partial<ChamadoDetalhe> = {},
  ): ChamadoDetalhe {
    const cat = categoria(categoriaId);
    return {
      id: `c-${numero}`,
      protocolo: protocolo(numero),
      titulo,
      descricao,
      categoriaId: cat.id,
      categoriaNome: cat.nome,
      cursoId: null,
      cursoNome: null,
      status: 'Aberto',
      equipe: cat.equipe,
      solicitanteId: solicitante.id,
      solicitanteNome: solicitante.nome,
      atendenteId: null,
      atendenteNome: null,
      criadoEm: minutosAtras(criadoHaMinutos),
      encerradoEm: null,
      mensagens: [],
      ...extra,
    };
  }

  const mensagem = (id: string, autor: UsuarioMock, conteudo: string, haMinutos: number) => ({
    id,
    autorId: autor.id,
    autorNome: autor.nome,
    origem: autor.perfil === 'Atendente' || autor.perfil === 'Administrador' ? ('Atendente' as const) : ('Usuario' as const),
    conteudo,
    enviadaEm: minutosAtras(haMinutos),
  });

  const chamados: ChamadoDetalhe[] = [
    chamado(9, 'Horas complementares do 3º semestre', 'Fiz um curso on-line de 40 horas e queria saber se ele conta como atividade complementar e como envio o certificado.', '6', lucas, 60 * 2, doCurso(psicologia)),
    chamado(8, 'Aproveitamento de disciplinas da faculdade anterior', 'Cursei Algoritmos e Banco de Dados em outra faculdade. Como peço o aproveitamento dessas disciplinas e quais documentos preciso enviar?', '6', ana, 15, doCurso(adsPresencial)),
    chamado(7, 'Sala de estudos para o grupo de TCC', 'Gostaria de reservar uma sala de estudos para quatro pessoas na quinta-feira, das 14h às 16h.', '4', ana, 20),
    chamado(6, 'Holerite de outubro não aparece', 'O holerite de outubro ainda não está disponível no portal do funcionário. Os anteriores aparecem normalmente.', '1', carlos, 50),
    chamado(5, 'Projetor da sala 204 não liga', 'O projetor da sala 204 do bloco B não liga desde ontem. Já testei outra tomada e outro cabo HDMI.', '3', carlos, 35),
    chamado(4, 'Declaração de matrícula para o estágio', 'Preciso de uma declaração de matrícula com o horário das aulas para entregar na empresa do estágio até sexta-feira.', '2', ana, 60 * 3),
    chamado(3, 'Sem acesso ao e-mail institucional', 'Depois da troca de senha obrigatória não consigo entrar no e-mail institucional. Aparece "usuário bloqueado".', '3', carlos, 60 * 26, {
      status: 'EmAtendimento',
      atendenteId: marcos.id,
      atendenteNome: marcos.nome,
      mensagens: [
        mensagem('m-3-1', marcos, 'Oi, Carlos! Seu usuário foi bloqueado por excesso de tentativas. Já pedi o desbloqueio. Consegue testar daqui a 15 minutos?', 60 * 25),
        mensagem('m-3-2', carlos, 'Testei agora há pouco e continua aparecendo a mesma mensagem.', 60 * 2),
      ],
    }),
    chamado(2, 'Boleto de outubro com valor diferente', 'O boleto de outubro veio com valor maior que o dos meses anteriores e não encontrei o motivo no portal.', '1', ana, 60 * 24 * 2, {
      status: 'AguardandoUsuario',
      atendenteId: julia.id,
      atendenteNome: julia.nome,
      mensagens: [
        mensagem('m-2-1', julia, 'Olá, Ana! A diferença é uma parcela de material didático lançada neste mês. Você recebeu o e-mail com o detalhamento? Se não, confirmo o endereço cadastrado.', 60 * 20),
      ],
    }),
    chamado(1, 'Renovação de livro com reserva', 'Não consigo renovar o empréstimo do livro de Cálculo I. O sistema diz que existe uma reserva.', '4', ana, 60 * 24 * 9, {
      status: 'Encerrado',
      atendenteId: beatriz.id,
      atendenteNome: beatriz.nome,
      encerradoEm: minutosAtras(60 * 24 * 8),
      mensagens: [
        mensagem('m-1-1', beatriz, 'Oi, Ana! Quando há reserva, a renovação fica bloqueada. Separei outro exemplar para você retirar no balcão até sexta.', 60 * 24 * 8 + 180),
        mensagem('m-1-2', ana, 'Perfeito, retiro amanhã. Obrigada!', 60 * 24 * 8 + 60),
      ],
    }),
  ];

  return {
    versao: VERSAO,
    proximoProtocolo: 10,
    usuarios: [ana, carlos, beatriz, julia, renata, marcos, lucas],
    categorias,
    cursos: CURSOS_UNISA,
    chamados,
    codigos: [],
  };
}

let banco: BancoMock | null = null;

function db(): BancoMock {
  if (banco) return banco;
  try {
    const salvo = localStorage.getItem(CHAVE);
    if (salvo) {
      const lido = JSON.parse(salvo) as BancoMock;
      if (lido.versao === VERSAO) {
        banco = lido;
        return banco;
      }
    }
  } catch {
    // dados corrompidos: recomeça do zero
  }
  banco = bancoInicial();
  persistir();
  return banco;
}

function persistir(): void {
  if (!banco) return;
  try {
    localStorage.setItem(CHAVE, JSON.stringify(banco));
  } catch {
    // armazenamento cheio ou bloqueado: segue só em memória
  }
}

export function restaurarDadosDemonstracao(): void {
  banco = bancoInicial();
  persistir();
}

const esperar = (ms = 300) => new Promise<void>((resolver) => setTimeout(resolver, ms + Math.random() * 200));
const copiar = <T>(valor: T): T => JSON.parse(JSON.stringify(valor)) as T;

function resumo(chamado: ChamadoDetalhe): Chamado {
  const { mensagens, ...dados } = chamado;
  void mensagens;
  return copiar(dados);
}

const ehAtendimento = (u: UsuarioMock) => u.perfil === 'Atendente' || u.perfil === 'Administrador';
/** Na Coordenação, além da equipe, a pessoa precisa coordenar o curso do chamado. */
const podeAtender = (u: UsuarioMock, c: ChamadoDetalhe) =>
  u.perfil === 'Administrador' ||
  (u.perfil === 'Atendente' &&
    u.equipe === c.equipe &&
    (c.equipe !== 'Coordenacao' || (c.cursoId !== null && u.cursos.includes(c.cursoId))));
const podeVer = (u: UsuarioMock, c: ChamadoDetalhe) => u.id === c.solicitanteId || podeAtender(u, c);

const cursosDe = (u: UsuarioMock): Curso[] => ordenarCursos(db().cursos.filter((c) => u.cursos.includes(c.id)));

function paraUsuario(u: UsuarioMock): Usuario {
  return {
    id: u.id,
    nome: u.nome,
    email: u.email,
    perfil: u.perfil,
    equipe: u.equipe,
    cursos: cursosDe(u),
    precisaTrocarSenha: u.precisaTrocarSenha,
  };
}

function paraAtendente(u: UsuarioMock): Atendente {
  return {
    id: u.id,
    nome: u.nome,
    email: u.email,
    perfil: u.perfil,
    equipe: u.equipe,
    ativo: u.ativo,
    criadoEm: u.criadoEm,
    cursos: cursosDe(u),
    precisaTrocarSenha: u.precisaTrocarSenha,
  };
}

function usuarioLogado(): UsuarioMock {
  const token = lerSessao()?.token;
  const id = token ? decodificarJwt(token)?.sub : undefined;
  const usuario = db().usuarios.find((u) => u.id === id);
  if (!usuario || !usuario.ativo) {
    notificarSessaoExpirada();
    throw new ApiError('Sua sessão expirou. Entre novamente.', 401);
  }
  return usuario;
}

/** Como na API: com a senha inicial do administrador, só a troca de senha funciona. */
function usuarioLiberado(): UsuarioMock {
  const usuario = usuarioLogado();
  if (usuario.precisaTrocarSenha) {
    throw new ApiError('Antes de continuar, troque a senha inicial que o administrador criou por uma senha sua.', 403);
  }
  return usuario;
}

function administradorLogado(): UsuarioMock {
  const usuario = usuarioLiberado();
  if (usuario.perfil !== 'Administrador') {
    throw new ApiError('Só administradores do Suporte de TI gerenciam a equipe de atendimento.', 403);
  }
  return usuario;
}

function buscarChamado(id: string): ChamadoDetalhe {
  const chamado = db().chamados.find((c) => c.id === id);
  if (!chamado) throw new ApiError('Chamado não encontrado.', 404);
  return chamado;
}

function validarNovaSenha(senha: string) {
  if (senha.length < 6) throw new ApiError('A senha precisa ter pelo menos 6 caracteres.', 400);
  if (senha.length > 100) throw new ApiError('A senha pode ter até 100 caracteres.', 400);
}

/** Só o código mais recente vale: pedir um novo invalida os anteriores. */
function codigoMaisRecente(usuarioId: string): CodigoMock | undefined {
  return db()
    .codigos.filter((c) => c.usuarioId === usuarioId)
    .sort((a, b) => b.criadoEm - a.criadoEm)[0];
}

function validarEquipe(equipe: Equipe, administrador: boolean) {
  if (!(equipe in EQUIPES)) throw new ApiError('Escolha uma equipe válida.', 400);
  if (administrador && equipe !== 'SuporteTI') throw new ApiError('Administradores fazem parte do Suporte de TI.', 400);
}

/** Na Coordenação, pelo menos um curso válido. Nas outras equipes, nenhum. */
function validarCursos(equipe: Equipe, ids: string[] | undefined): string[] {
  if (equipe !== 'Coordenacao') return [];
  const distintos = [...new Set(ids ?? [])];
  if (distintos.length === 0) throw new ApiError('Escolha pelo menos um curso para quem atende na Coordenação.', 400);
  if (distintos.some((id) => !db().cursos.some((c) => c.id === id))) {
    throw new ApiError('Algum dos cursos escolhidos não está mais disponível. Atualize a página e tente de novo.', 400);
  }
  return distintos;
}

function gerarToken(usuario: UsuarioMock): string {
  const cabecalho = textoParaBase64Url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const corpo = textoParaBase64Url(
    JSON.stringify({
      sub: usuario.id,
      name: usuario.nome,
      email: usuario.email,
      role: usuario.perfil,
      ...(usuario.equipe ? { equipe: usuario.equipe } : {}),
      exp: Math.floor(Date.now() / 1000) + 8 * 60 * 60,
    }),
  );
  return `${cabecalho}.${corpo}.simulado`;
}

/* ---------- Chatbot simulado (no modo real, quem responde é o Gemini) ---------- */

const BASE_DE_RESPOSTAS: { palavras: string[]; resposta: string }[] = [
  {
    palavras: ['boleto', 'mensalidade', 'pagamento', 'financeiro', 'parcela', '2a via', '2ª via'],
    resposta:
      'Boletos e mensalidades ficam com o setor **Financeiro**. A 2ª via costuma estar disponível na área do aluno do portal.\n\nSe o boleto não aparecer ou o valor estiver diferente do esperado, abra um chamado na categoria Financeiro.',
  },
  {
    palavras: ['senha', 'acesso', 'login', 'bloqueado', 'portal', 'e-mail institucional', 'email institucional'],
    resposta:
      'Para problemas de acesso, tente primeiro a opção "Esqueci minha senha" na tela de login do portal.\n\nSe aparecer "usuário bloqueado", o **Suporte de TI** precisa liberar o acesso manualmente. Nesse caso, abra um chamado.',
  },
  {
    palavras: ['declaracao', 'historico', 'matricula', 'documento', 'certificado'],
    resposta:
      'Declarações, históricos e certificados são emitidos pela **Secretaria acadêmica**. Informe no chamado para que o documento será usado e se precisa constar o horário das aulas.',
  },
  {
    palavras: ['coordenacao', 'coordenador', 'estagio', 'tcc', 'disciplina', 'aproveitamento', 'grade', 'horas complementares'],
    resposta:
      'Assuntos do curso, como disciplinas, estágio, TCC e aproveitamento de estudos, ficam com a **Coordenação do seu curso**.\n\nAbra um chamado na categoria Coordenação de curso e escolha o seu curso: ele vai direto para quem coordena.',
  },
  {
    palavras: ['biblioteca', 'livro', 'emprestimo', 'renovar', 'renovacao', 'reserva'],
    resposta:
      'Empréstimos podem ser renovados enquanto não houver reserva para o mesmo exemplar. Para multas ou reservas, abra um chamado na categoria **Biblioteca**.',
  },
];

const PEDIDOS_DE_ATENDENTE = ['atendente', 'humano', 'pessoa', 'reclamacao', 'falar com alguem'];

function responderComoAssistente(mensagem: string): RespostaAssistente {
  const texto = semAcento(mensagem);
  if (PEDIDOS_DE_ATENDENTE.some((termo) => texto.includes(termo))) {
    return { resposta: 'Certo. Vou encaminhar você para a equipe de atendimento.', escalar: true };
  }
  const encontrada = BASE_DE_RESPOSTAS.find((item) => item.palavras.some((palavra) => texto.includes(semAcento(palavra))));
  if (encontrada) return { resposta: encontrada.resposta, escalar: false };
  return {
    resposta: 'Não tenho uma resposta segura para isso. Um atendente da equipe pode analisar o seu caso.',
    escalar: true,
  };
}

/* ---------- Implementação da API ---------- */

export const mockApi: Api = {
  async login(email, senha) {
    await esperar();
    const usuario = db().usuarios.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!usuario || usuario.senha !== senha) throw new ApiError('E-mail ou senha incorretos.', 401);
    if (!usuario.ativo) throw new ApiError('Esta conta foi desativada. Fale com o Suporte de TI.', 403);
    return { token: gerarToken(usuario), usuario: paraUsuario(usuario) };
  },

  async trocarSenha(senhaAtual, novaSenha) {
    await esperar(400);
    const usuario = usuarioLogado(); // liberado mesmo com a senha inicial: é assim que ela é trocada
    if (usuario.senha !== senhaAtual) throw new ApiError('A senha atual não confere.', 400);
    validarNovaSenha(novaSenha);
    if (novaSenha === usuario.senha) throw new ApiError('Escolha uma senha diferente da atual.', 400);
    usuario.senha = novaSenha;
    usuario.precisaTrocarSenha = false;
    persistir();
    return { token: gerarToken(usuario), usuario: paraUsuario(usuario) };
  },

  async pedirCodigoDeRecuperacao(email) {
    await esperar(600);
    if (!email.trim()) throw new ApiError('Informe o e-mail.', 400);
    const usuario = db().usuarios.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!usuario || !usuario.ativo) return {}; // mesma resposta exista a conta ou não
    const agora = Date.now();
    const anterior = codigoMaisRecente(usuario.id);
    // Como na API, no máximo um código por minuto. Aqui o código atual volta para aparecer na tela.
    if (anterior && agora - anterior.criadoEm < 60_000) {
      return anterior.usado ? {} : { codigoDeDemonstracao: anterior.codigo };
    }
    const codigo = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
    db().codigos.push({ usuarioId: usuario.id, codigo, criadoEm: agora, expiraEm: agora + 15 * 60_000, tentativasErradas: 0, usado: false });
    persistir();
    return { codigoDeDemonstracao: codigo };
  },

  async redefinirSenha(email, codigo, novaSenha) {
    await esperar(500);
    validarNovaSenha(novaSenha);
    const recusado = new ApiError('Código incorreto ou vencido. Confira o e-mail ou peça um código novo.', 400);
    const usuario = db().usuarios.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!usuario || !usuario.ativo) throw recusado;
    const atual = codigoMaisRecente(usuario.id);
    if (!atual || atual.usado || Date.now() >= atual.expiraEm || atual.tentativasErradas >= 5) throw recusado;
    if (codigo.trim() !== atual.codigo) {
      atual.tentativasErradas += 1;
      persistir();
      throw recusado;
    }
    atual.usado = true;
    usuario.senha = novaSenha;
    usuario.precisaTrocarSenha = false;
    persistir();
  },

  async cadastrar(dados) {
    await esperar();
    if (dados.perfil !== 'Aluno' && dados.perfil !== 'Funcionario') {
      throw new ApiError('Contas de atendimento são criadas pelo Suporte de TI.', 403);
    }
    const email = dados.email.trim().toLowerCase();
    if (db().usuarios.some((u) => u.email.toLowerCase() === email)) {
      throw new ApiError('Já existe uma conta com este e-mail. Entre com ele ou use outro endereço.', 409); // RN02
    }
    db().usuarios.push({
      id: gerarId(),
      nome: dados.nome.trim(),
      email,
      senha: dados.senha,
      perfil: dados.perfil,
      equipe: null,
      cursos: [],
      precisaTrocarSenha: false,
      ativo: true,
      criadoEm: new Date().toISOString(),
    });
    persistir();
  },

  async listarCategorias() {
    await esperar(120);
    return copiar(db().categorias);
  },

  async listarCursos() {
    await esperar(120);
    usuarioLiberado();
    return copiar(ordenarCursos(db().cursos));
  },

  async listarChamados() {
    await esperar();
    const usuario = usuarioLiberado();
    const visiveis = db().chamados.filter((c) => podeVer(usuario, c));
    return visiveis.map(resumo);
  },

  async obterChamado(id) {
    await esperar();
    const usuario = usuarioLiberado();
    const chamado = buscarChamado(id);
    if (!podeVer(usuario, chamado)) throw new ApiError('Chamado não encontrado.', 404);
    return copiar(chamado);
  },

  async abrirChamado(dados) {
    await esperar(500);
    const usuario = usuarioLiberado();
    const categoria = db().categorias.find((c) => c.id === dados.categoriaId);
    if (!categoria) throw new ApiError('Escolha uma categoria válida.', 400);
    if (!dados.titulo.trim() || !dados.descricao.trim()) throw new ApiError('Preencha o assunto e a descrição.', 400);

    // Para a Coordenação, o curso escolhido decide quem atende.
    let curso: Curso | null = null;
    if (categoria.equipe === 'Coordenacao') {
      curso = db().cursos.find((c) => c.id === dados.cursoId) ?? null;
      if (!curso) throw new ApiError('Escolha o seu curso para falar com a coordenação certa.', 400);
    }

    const novo: ChamadoDetalhe = {
      id: gerarId(),
      protocolo: protocolo(db().proximoProtocolo++),
      titulo: dados.titulo.trim(),
      descricao: dados.descricao.trim(),
      categoriaId: categoria.id,
      categoriaNome: categoria.nome,
      cursoId: curso?.id ?? null,
      cursoNome: curso ? nomeCompletoDoCurso(curso) : null,
      status: 'Aberto',
      equipe: categoria.equipe,
      solicitanteId: usuario.id,
      solicitanteNome: usuario.nome,
      atendenteId: null,
      atendenteNome: null,
      criadoEm: new Date().toISOString(),
      encerradoEm: null,
      mensagens: [],
    };
    db().chamados.unshift(novo);
    persistir();
    return resumo(novo);
  },

  async enviarMensagem(chamadoId, conteudo) {
    await esperar(250);
    const usuario = usuarioLiberado();
    const chamado = buscarChamado(chamadoId);
    if (!podeVer(usuario, chamado)) throw new ApiError('Chamado não encontrado.', 404);
    if (chamado.status === 'Encerrado') throw new ApiError('Este chamado já foi encerrado.', 409);
    const ehResponsavel = chamado.atendenteId === usuario.id;
    const ehSolicitante = chamado.solicitanteId === usuario.id;
    if (!ehResponsavel && !ehSolicitante) {
      throw new ApiError('Assuma o chamado antes de responder.', 403);
    }
    if (!conteudo.trim()) throw new ApiError('Escreva uma mensagem antes de enviar.', 400);

    chamado.mensagens.push({
      id: gerarId(),
      autorId: usuario.id,
      autorNome: usuario.nome,
      origem: ehResponsavel ? 'Atendente' : 'Usuario',
      conteudo: conteudo.trim(),
      enviadaEm: new Date().toISOString(),
    });
    if (ehResponsavel) chamado.status = 'AguardandoUsuario';
    else if (chamado.status === 'AguardandoUsuario') chamado.status = 'EmAtendimento';
    persistir();
  },

  async assumirChamado(id) {
    await esperar(300);
    const usuario = usuarioLiberado();
    if (!ehAtendimento(usuario)) throw new ApiError('Só atendentes podem assumir chamados.', 403);
    const chamado = buscarChamado(id);
    if (!podeVer(usuario, chamado)) throw new ApiError('Chamado não encontrado.', 404);
    if (!podeAtender(usuario, chamado)) {
      throw new ApiError(
        usuario.equipe === chamado.equipe
          ? 'Este chamado é de um curso que você não coordena.'
          : `Este chamado é da equipe ${EQUIPES[chamado.equipe].nome}.`,
        403,
      );
    }
    if (chamado.status === 'Encerrado') throw new ApiError('Este chamado já foi encerrado.', 409);
    if (chamado.atendenteId && chamado.atendenteId !== usuario.id) {
      throw new ApiError(`Este chamado já está com ${chamado.atendenteNome}.`, 409);
    }
    chamado.atendenteId = usuario.id;
    chamado.atendenteNome = usuario.nome;
    if (chamado.status === 'Aberto') chamado.status = 'EmAtendimento';
    persistir();
  },

  async encerrarChamado(id) {
    await esperar(300);
    const usuario = usuarioLiberado();
    const chamado = buscarChamado(id);
    if (!podeVer(usuario, chamado)) throw new ApiError('Chamado não encontrado.', 404);
    // RN01
    if (chamado.solicitanteId !== usuario.id && chamado.atendenteId !== usuario.id) {
      throw new ApiError('Só quem abriu o chamado ou o atendente responsável pode encerrá-lo.', 403);
    }
    if (chamado.status === 'Encerrado') return;
    chamado.status = 'Encerrado';
    chamado.encerradoEm = new Date().toISOString();
    persistir();
  },

  async perguntarAoAssistente(mensagem) {
    await esperar(800);
    usuarioLiberado();
    return responderComoAssistente(mensagem);
  },

  async listarAtendentes() {
    await esperar();
    administradorLogado();
    return db()
      .usuarios.filter(ehAtendimento)
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
      .map(paraAtendente);
  },

  async cadastrarAtendente(dados) {
    await esperar(400);
    administradorLogado();
    validarEquipe(dados.equipe, dados.administrador);
    if (!dados.nome.trim()) throw new ApiError('Informe o nome.', 400);
    const email = dados.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError('Informe um e-mail válido.', 400);
    if (dados.senha.length < 6) throw new ApiError('A senha precisa ter pelo menos 6 caracteres.', 400);
    const cursos = validarCursos(dados.equipe, dados.cursos);
    if (db().usuarios.some((u) => u.email.toLowerCase() === email)) {
      throw new ApiError('Já existe uma conta com este e-mail.', 409);
    }
    const novo: UsuarioMock = {
      id: gerarId(),
      nome: dados.nome.trim(),
      email,
      senha: dados.senha,
      perfil: dados.administrador ? 'Administrador' : 'Atendente',
      equipe: dados.equipe,
      cursos,
      precisaTrocarSenha: true, // a senha é do administrador: a pessoa troca no primeiro acesso
      ativo: true,
      criadoEm: new Date().toISOString(),
    };
    db().usuarios.push(novo);
    persistir();
    return paraAtendente(novo);
  },

  async atualizarAtendente(id, dados) {
    await esperar(300);
    const administrador = administradorLogado();
    const atendente = db().usuarios.find((u) => u.id === id);
    if (!atendente || !ehAtendimento(atendente)) throw new ApiError('Atendente não encontrado.', 404);
    if (atendente.id === administrador.id && (!dados.ativo || !dados.administrador)) {
      throw new ApiError('Você não pode desativar a própria conta nem tirar o próprio acesso de administrador.', 409);
    }
    validarEquipe(dados.equipe, dados.administrador);
    const cursos = validarCursos(dados.equipe, dados.cursos);
    atendente.equipe = dados.equipe;
    atendente.cursos = cursos;
    atendente.perfil = dados.administrador ? 'Administrador' : 'Atendente';
    atendente.ativo = dados.ativo;
    persistir();
    return paraAtendente(atendente);
  },
};
