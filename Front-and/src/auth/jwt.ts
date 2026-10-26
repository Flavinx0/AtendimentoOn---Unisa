import type { Usuario } from '../types';
import { normalizarEquipe, normalizarPerfil } from '../api/adaptadores';

type Claims = Record<string, unknown>;

function base64UrlParaTexto(parte: string): string {
  const base64 = parte.replace(/-/g, '+').replace(/_/g, '/');
  const completo = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const binario = atob(completo);
  const bytes = Uint8Array.from(binario, (caractere) => caractere.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function textoParaBase64Url(texto: string): string {
  let binario = '';
  new TextEncoder().encode(texto).forEach((byte) => {
    binario += String.fromCharCode(byte);
  });
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Lê o payload do JWT. Não valida assinatura: isso é papel da API. */
export function decodificarJwt(token: string): Claims | null {
  const partes = token.split('.');
  if (partes.length < 2) return null;
  try {
    const payload: unknown = JSON.parse(base64UrlParaTexto(partes[1]));
    return payload && typeof payload === 'object' ? (payload as Claims) : null;
  } catch {
    return null;
  }
}

export function tokenExpirado(token: string): boolean {
  const exp = decodificarJwt(token)?.exp;
  return typeof exp === 'number' && Date.now() >= exp * 1000;
}

/*
 * O .NET pode gravar as claims com nomes curtos (nameid, unique_name, role)
 * ou com as URIs completas de ClaimTypes. Procuramos pelas duas formas.
 */
const CLAIMS = {
  id: ['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier', 'nameid', 'sub', 'id', 'userId', 'usuarioId'],
  nome: ['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name', 'name', 'nome', 'unique_name', 'given_name'],
  email: ['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress', 'email'],
  perfil: ['http://schemas.microsoft.com/ws/2008/06/identity/claims/role', 'role', 'roles', 'perfil'],
  equipe: ['equipe', 'team'],
};

function primeiraClaim(claims: Claims, nomes: string[]): string | undefined {
  for (const nome of nomes) {
    const valor = claims[nome];
    if (Array.isArray(valor) && valor.length > 0) return String(valor[0]);
    if (valor !== undefined && valor !== null && valor !== '') return String(valor);
  }
  return undefined;
}

export function usuarioDoToken(token: string): Partial<Usuario> {
  const claims = decodificarJwt(token);
  if (!claims) return {};
  const perfil = primeiraClaim(claims, CLAIMS.perfil);
  const equipe = primeiraClaim(claims, CLAIMS.equipe);
  return {
    id: primeiraClaim(claims, CLAIMS.id),
    nome: primeiraClaim(claims, CLAIMS.nome),
    email: primeiraClaim(claims, CLAIMS.email),
    perfil: perfil === undefined ? undefined : normalizarPerfil(perfil),
    equipe: equipe === undefined ? undefined : normalizarEquipe(equipe),
  };
}
