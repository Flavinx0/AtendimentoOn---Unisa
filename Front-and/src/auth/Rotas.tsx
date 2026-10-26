import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { Perfil } from '../types';
import { useAuth, useUsuarioLogado } from './AuthContext';

/**
 * Só deixa passar quem está logado. Quem ainda está com a senha inicial criada pelo administrador
 * vai direto para a troca de senha: até trocar, o resto do sistema fica fechado.
 */
export function RotaProtegida() {
  const { usuario, sessaoExpirou } = useAuth();
  const location = useLocation();
  if (!usuario) {
    // Se a sessão expirou, volta para a mesma página depois do novo login.
    const estado = sessaoExpirou ? { de: location.pathname + location.search } : undefined;
    return <Navigate to="/login" replace state={estado} />;
  }
  if (usuario.precisaTrocarSenha && location.pathname !== '/trocar-senha') {
    return <Navigate to="/trocar-senha" replace />;
  }
  return <Outlet />;
}

/** Telas exclusivas de alguns perfis, como a gestão da equipe (só administradores). */
export function RotaPorPerfil({ perfis }: { perfis: Perfil[] }) {
  const usuario = useUsuarioLogado();
  return perfis.includes(usuario.perfil) ? <Outlet /> : <Navigate to="/" replace />;
}

/** Login e cadastro: quem já está logado vai direto para o início. */
export function RotaPublica() {
  const { usuario } = useAuth();
  const location = useLocation();
  if (usuario) {
    const destino = (location.state as { de?: string } | null)?.de;
    return <Navigate to={destino && destino !== '/login' ? destino : '/'} replace />;
  }
  return <Outlet />;
}
