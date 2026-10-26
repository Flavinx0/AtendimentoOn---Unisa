import type { Perfil, StatusChamado } from '../types';

export const STATUS: Record<StatusChamado, { rotulo: string; classe: string }> = {
  Aberto: { rotulo: 'Aberto', classe: 'aberto' },
  EmAtendimento: { rotulo: 'Em atendimento', classe: 'andamento' },
  AguardandoUsuario: { rotulo: 'Aguardando usuário', classe: 'aguardando' },
  Encerrado: { rotulo: 'Encerrado', classe: 'encerrado' },
};

/** Para quem abriu o chamado, "Aguardando usuário" vira "Aguardando você". */
export function rotuloStatus(status: StatusChamado, ehSolicitante = false): string {
  if (status === 'AguardandoUsuario' && ehSolicitante) return 'Aguardando você';
  return STATUS[status].rotulo;
}

export const ROTULO_PERFIL: Record<Perfil, string> = {
  Aluno: 'Aluno',
  Funcionario: 'Funcionário',
  Atendente: 'Atendente',
  Administrador: 'Administrador',
};

/** "ON-2026-0042" → { prefixo: "ON-2026", numero: "0042" } */
export function dividirProtocolo(protocolo: string): { prefixo: string; numero: string } {
  const partes = protocolo.match(/^(.*?)[-./](\d{1,8})$/);
  if (partes) return { prefixo: partes[1], numero: partes[2] };
  return { prefixo: '', numero: protocolo };
}
