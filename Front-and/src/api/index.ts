import { config } from '../config';
import type { Api } from './contrato';
import { httpApi } from './httpApi';
import { mockApi } from './mock/mockApi';

export const api: Api = config.usarMock ? mockApi : httpApi;

export { ApiError } from './http';
export type { Api, RespostaLogin } from './contrato';
