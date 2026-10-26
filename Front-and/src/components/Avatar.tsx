import { iniciais } from '../utils/texto';

export function Avatar({ nome, destaque = false }: { nome: string; destaque?: boolean }) {
  return (
    <span className={destaque ? 'avatar avatar--destaque' : 'avatar'} aria-hidden="true">
      {iniciais(nome)}
    </span>
  );
}
