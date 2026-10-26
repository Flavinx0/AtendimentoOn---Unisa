import type { ReactNode } from 'react';
import type { Curso, Equipe } from '../types';
import { nomeCompletoDoCurso, ordenarCursos } from '../utils/cursos';
import { EQUIPES } from '../utils/equipes';
import { IconeCapelo, IconeLivro, IconeMonitor, IconePrancheta } from './Icones';

const ICONES = {
  Biblioteca: IconeLivro,
  SuporteTI: IconeMonitor,
  Secretaria: IconePrancheta,
  Coordenacao: IconeCapelo,
};

export function IconeDaEquipe({ equipe, tamanho = 18 }: { equipe: Equipe; tamanho?: number }) {
  const Icone = ICONES[equipe];
  return <Icone tamanho={tamanho} />;
}

/** Etiqueta pequena com o nome da equipe. */
export function SeloEquipe({ equipe }: { equipe: Equipe }) {
  return (
    <span className="selo-equipe">
      <IconeDaEquipe equipe={equipe} tamanho={14} />
      {EQUIPES[equipe].nome}
    </span>
  );
}

const LISTA_PT = new Intl.ListFormat('pt-BR', { style: 'long', type: 'conjunction' });
const CURSOS_VISIVEIS = 3;

/** Faixa que identifica a equipe no topo das telas do atendente. Na Coordenação, mostra os cursos. */
export function FaixaEquipe({ equipe, cursos, children }: { equipe: Equipe; cursos?: Curso[]; children?: ReactNode }) {
  const nomes = ordenarCursos(cursos ?? []).map(nomeCompletoDoCurso);
  const resumo =
    nomes.length > CURSOS_VISIVEIS
      ? `${nomes.slice(0, CURSOS_VISIVEIS).join(', ')} e mais ${nomes.length - CURSOS_VISIVEIS}`
      : LISTA_PT.format(nomes);

  return (
    <div className="faixa-equipe">
      <span className="faixa-equipe-icone" aria-hidden="true">
        <IconeDaEquipe equipe={equipe} tamanho={22} />
      </span>
      <div className="faixa-equipe-texto">
        <strong>{EQUIPES[equipe].nome}</strong>
        <span>{EQUIPES[equipe].descricao}</span>
        {equipe === 'Coordenacao' && (
          <span className="faixa-equipe-cursos" title={nomes.length > CURSOS_VISIVEIS ? LISTA_PT.format(nomes) : undefined}>
            {nomes.length > 0
              ? `Seus cursos: ${resumo}.`
              : 'Você ainda não tem cursos vinculados. Peça ao Suporte de TI para vincular os cursos que você coordena.'}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
