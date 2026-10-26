import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '../api';
import type { RespostaLogin } from '../api/contrato';
import type { Sessao, Usuario } from '../types';
import { marcarAvisoDoAssistente } from './avisoDoAssistente';
import { usuarioDoToken } from './jwt';
import { aoExpirarSessao, lerSessao, limparSessao, salvarSessao } from './sessao';

interface ValorAuth {
  usuario: Usuario | null;
  /** true quando a API recusou o token (401) e o usuário precisa entrar de novo. */
  sessaoExpirou: boolean;
  entrar: (email: string, senha: string) => Promise<Usuario>;
  /** Troca o token e os dados guardados, por exemplo depois de trocar a senha. */
  atualizarSessao: (resposta: RespostaLogin) => Usuario;
  sair: () => void;
}

const AuthContexto = createContext<ValorAuth | null>(null);

function definidos<T extends object>(objeto: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(objeto).filter(([, valor]) => valor !== undefined && valor !== null && valor !== ''),
  ) as Partial<T>;
}

/** Junta as claims do JWT com os dados que o login devolver (os do login têm prioridade). */
function montarUsuario(token: string, extra: Partial<Usuario> | undefined, emailDigitado: string): Usuario {
  const dados: Partial<Usuario> = { ...definidos(usuarioDoToken(token)), ...definidos(extra ?? {}) };
  const email = dados.email ?? emailDigitado;
  return {
    id: dados.id ?? email,
    nome: dados.nome ?? email.split('@')[0],
    email,
    perfil: dados.perfil ?? 'Aluno',
    equipe: dados.equipe ?? null,
    cursos: dados.cursos ?? [],
    precisaTrocarSenha: dados.precisaTrocarSenha ?? false,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Sessao | null>(() => lerSessao());
  const [sessaoExpirou, setSessaoExpirou] = useState(false);

  useEffect(
    () =>
      aoExpirarSessao(() => {
        setSessao(null);
        setSessaoExpirou(true);
      }),
    [],
  );

  const entrar = useCallback(async (email: string, senha: string) => {
    const emailLimpo = email.trim();
    const resposta = await api.login(emailLimpo, senha);
    const usuario = montarUsuario(resposta.token, resposta.usuario, emailLimpo);
    const nova: Sessao = { token: resposta.token, usuario };
    salvarSessao(nova);
    // Alunos e funcionários veem, a cada login, a sugestão de perguntar ao assistente antes de abrir chamado.
    if (usuario.perfil === 'Aluno' || usuario.perfil === 'Funcionario') marcarAvisoDoAssistente();
    setSessaoExpirou(false);
    setSessao(nova);
    return usuario;
  }, []);

  const atualizarSessao = useCallback(
    (resposta: RespostaLogin) => {
      const usuario = montarUsuario(resposta.token, resposta.usuario, sessao?.usuario.email ?? '');
      const nova: Sessao = { token: resposta.token, usuario };
      salvarSessao(nova);
      setSessao(nova);
      return usuario;
    },
    [sessao],
  );

  const sair = useCallback(() => {
    limparSessao();
    try {
      sessionStorage.clear();
    } catch {
      // ignora
    }
    setSessaoExpirou(false);
    setSessao(null);
  }, []);

  const valor = useMemo<ValorAuth>(
    () => ({ usuario: sessao?.usuario ?? null, sessaoExpirou, entrar, atualizarSessao, sair }),
    [sessao, sessaoExpirou, entrar, atualizarSessao, sair],
  );

  return <AuthContexto.Provider value={valor}>{children}</AuthContexto.Provider>;
}

export function useAuth(): ValorAuth {
  const contexto = useContext(AuthContexto);
  if (!contexto) throw new Error('useAuth precisa ser usado dentro de <AuthProvider>.');
  return contexto;
}

const SEM_USUARIO: Usuario = {
  id: '',
  nome: '',
  email: '',
  perfil: 'Aluno',
  equipe: null,
  cursos: [],
  precisaTrocarSenha: false,
};

/** Para páginas protegidas: o usuário sempre existe ali (RotaProtegida garante). */
export function useUsuarioLogado(): Usuario {
  return useAuth().usuario ?? SEM_USUARIO;
}
