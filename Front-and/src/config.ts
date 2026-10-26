export const config = {
  /** Usa a API simulada (src/api/mock) em vez da API em C#. */
  usarMock: import.meta.env.VITE_USE_MOCK === 'true',

  /**
   * Em desenvolvimento as chamadas usam caminho relativo (/api/...) e passam pelo
   * proxy do Vite (vite.config.ts). No build de produção, usam a URL completa da API.
   */
  apiBaseUrl: import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, ''),
};
