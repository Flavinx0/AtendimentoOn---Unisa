import { config } from '../config';
import { lerSessao, notificarSessaoExpirada } from '../auth/sessao';

export class ApiError extends Error {
  readonly status: number;
  /** Erros de validação por campo (ProblemDetails.errors do ASP.NET). */
  readonly campos?: Record<string, string[]>;

  constructor(mensagem: string, status: number, campos?: Record<string, string[]>) {
    super(mensagem);
    this.name = 'ApiError';
    this.status = status;
    this.campos = campos;
  }
}

const MENSAGEM_POR_STATUS: Record<number, string> = {
  400: 'Confira os dados informados.',
  401: 'Sua sessão expirou. Entre novamente.',
  403: 'Você não tem permissão para fazer isso.',
  404: 'Não encontramos o que você procurava.',
  409: 'Essa ação não é possível no estado atual do chamado.',
};

function mensagemPadrao(status: number): string {
  if (MENSAGEM_POR_STATUS[status]) return MENSAGEM_POR_STATUS[status];
  if (status >= 500) {
    return `A API respondeu com erro ${status}. Confira se ela está rodando e veja o log do servidor.`;
  }
  return `A API respondeu com erro ${status}.`;
}

function lerErrosDeValidacao(erros: unknown): { mensagem?: string; campos?: Record<string, string[]> } {
  if (Array.isArray(erros)) {
    return { mensagem: erros.find((item): item is string => typeof item === 'string') };
  }
  if (erros && typeof erros === 'object') {
    const campos: Record<string, string[]> = {};
    for (const [campo, valor] of Object.entries(erros as Record<string, unknown>)) {
      campos[campo] = Array.isArray(valor) ? valor.map(String) : [String(valor)];
    }
    return { mensagem: Object.values(campos)[0]?.[0], campos };
  }
  return {};
}

/** Entende ProblemDetails do ASP.NET, { mensagem } ou texto puro. */
async function criarErro(resposta: Response): Promise<ApiError> {
  const texto = await resposta.text().catch(() => '');
  let corpo: unknown = texto;
  try {
    corpo = texto ? JSON.parse(texto) : null;
  } catch {
    // corpo continua como texto
  }

  let mensagem: string | undefined;
  let campos: Record<string, string[]> | undefined;

  if (typeof corpo === 'string') {
    const limpo = corpo.trim();
    if (limpo && limpo.length <= 300 && !limpo.startsWith('<')) mensagem = limpo;
  } else if (corpo && typeof corpo === 'object') {
    const dados = corpo as Record<string, unknown>;
    const validacao = lerErrosDeValidacao(dados.errors ?? dados.erros);
    campos = validacao.campos;
    mensagem = [dados.detail, dados.mensagem, dados.message, validacao.mensagem].find(
      (valor): valor is string => typeof valor === 'string' && valor.trim() !== '',
    );
  }

  return new ApiError(mensagem ?? mensagemPadrao(resposta.status), resposta.status, campos);
}

type Metodo = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

async function requisicao<T>(metodo: Metodo, caminho: string, corpo?: unknown): Promise<T> {
  const cabecalhos: Record<string, string> = { Accept: 'application/json' };
  if (corpo !== undefined) cabecalhos['Content-Type'] = 'application/json';

  const token = lerSessao()?.token;
  if (token) cabecalhos.Authorization = `Bearer ${token}`;

  let resposta: Response;
  try {
    resposta = await fetch(`${config.apiBaseUrl}${caminho}`, {
      method: metodo,
      headers: cabecalhos,
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
  } catch {
    throw new ApiError(
      'Não foi possível conectar à API. Confira se ela está rodando e se VITE_API_URL aponta para o endereço certo.',
      0,
    );
  }

  if (!resposta.ok) {
    const erro = await criarErro(resposta);
    if (resposta.status === 401 && token) notificarSessaoExpirada();
    throw erro;
  }

  const texto = await resposta.text();
  if (!texto) return undefined as unknown as T;
  try {
    return JSON.parse(texto) as T;
  } catch {
    return texto as unknown as T;
  }
}

export const http = {
  get: <T>(caminho: string) => requisicao<T>('GET', caminho),
  post: <T>(caminho: string, corpo?: unknown) => requisicao<T>('POST', caminho, corpo),
  patch: <T>(caminho: string, corpo?: unknown) => requisicao<T>('PATCH', caminho, corpo),
  put: <T>(caminho: string, corpo?: unknown) => requisicao<T>('PUT', caminho, corpo),
};
