/*
 * Aviso para alunos e funcionários: a cada login, sugere perguntar ao assistente virtual antes de abrir
 * um chamado. Fica no sessionStorage, que o "Sair" limpa: no próximo login, o aviso aparece de novo.
 */
const CHAVE = 'atendimento-on:aviso-assistente';

export function marcarAvisoDoAssistente(): void {
  try {
    sessionStorage.setItem(CHAVE, 'pendente');
  } catch {
    // armazenamento bloqueado: o aviso só não aparece
  }
}

export function avisoDoAssistentePendente(): boolean {
  try {
    return sessionStorage.getItem(CHAVE) === 'pendente';
  } catch {
    return false;
  }
}

export function concluirAvisoDoAssistente(): void {
  try {
    sessionStorage.setItem(CHAVE, 'visto');
  } catch {
    // ignora
  }
}
