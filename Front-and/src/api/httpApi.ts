import type { Api } from './contrato';
import { ApiError, http } from './http';
import {
  normalizarAtendente,
  normalizarCategoria,
  normalizarChamado,
  normalizarChamadoDetalhe,
  normalizarCurso,
  normalizarLista,
  normalizarRespostaAssistente,
  normalizarRespostaLogin,
} from './adaptadores';

/** Ids inteiros vão como número; GUIDs continuam texto. */
function idParaApi(id: string): string | number {
  return /^\d+$/.test(id) ? Number(id) : id;
}

const rota = (id: string) => `/api/chamados/${encodeURIComponent(id)}`;

export const httpApi: Api = {
  async login(email, senha) {
    try {
      return normalizarRespostaLogin(await http.post<unknown>('/api/auth/login', { email, senha }));
    } catch (erro) {
      if (erro instanceof ApiError && erro.status === 401) {
        throw new ApiError('E-mail ou senha incorretos.', 401);
      }
      throw erro;
    }
  },

  async trocarSenha(senhaAtual, novaSenha) {
    return normalizarRespostaLogin(await http.post<unknown>('/api/auth/trocar-senha', { senhaAtual, novaSenha }));
  },

  async pedirCodigoDeRecuperacao(email) {
    await http.post('/api/auth/esqueci-senha', { email });
    return {};
  },

  async redefinirSenha(email, codigo, novaSenha) {
    await http.post('/api/auth/redefinir-senha', { email, codigo, novaSenha });
  },

  async cadastrar(dados) {
    await http.post('/api/usuarios', dados);
  },

  async listarCategorias() {
    return normalizarLista(await http.get<unknown>('/api/categorias'), normalizarCategoria);
  },

  async listarCursos() {
    return normalizarLista(await http.get<unknown>('/api/cursos'), normalizarCurso);
  },

  async listarChamados() {
    return normalizarLista(await http.get<unknown>('/api/chamados'), normalizarChamado);
  },

  async obterChamado(id) {
    return normalizarChamadoDetalhe(await http.get<unknown>(rota(id)));
  },

  async abrirChamado(dados) {
    const criado = await http.post<unknown>('/api/chamados', {
      ...dados,
      categoriaId: idParaApi(dados.categoriaId),
      cursoId: dados.cursoId ? idParaApi(dados.cursoId) : null,
    });
    return normalizarChamado(criado);
  },

  async enviarMensagem(chamadoId, conteudo) {
    await http.post(`${rota(chamadoId)}/mensagens`, { conteudo });
  },

  async assumirChamado(id) {
    await http.patch(`${rota(id)}/assumir`);
  },

  async encerrarChamado(id) {
    await http.patch(`${rota(id)}/encerrar`);
  },

  async perguntarAoAssistente(mensagem, historico) {
    const resposta = await http.post<unknown>('/api/chatbot/mensagens', { mensagem, historico });
    return normalizarRespostaAssistente(resposta);
  },

  async listarAtendentes() {
    return normalizarLista(await http.get<unknown>('/api/equipe/atendentes'), normalizarAtendente);
  },

  async cadastrarAtendente(dados) {
    const corpo = { ...dados, cursos: dados.cursos.map(idParaApi) };
    return normalizarAtendente(await http.post<unknown>('/api/equipe/atendentes', corpo));
  },

  async atualizarAtendente(id, dados) {
    const corpo = { ...dados, cursos: dados.cursos.map(idParaApi) };
    return normalizarAtendente(await http.put<unknown>(`/api/equipe/atendentes/${encodeURIComponent(id)}`, corpo));
  },
};
