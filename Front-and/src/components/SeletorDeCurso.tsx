import { useId, useMemo, useState } from 'react';
import type { Curso } from '../types';
import { agruparPorModalidade, filtrarCursos, MODALIDADES, nomeComGrau, nomeCompletoDoCurso, ordenarCursos } from '../utils/cursos';
import { IconeBusca } from './Icones';

interface PropsCurso {
  id: string;
  cursos: Curso[];
  valor: string;
  aoMudar: (id: string) => void;
  descricaoId?: string;
}

/** Um curso, para quem abre o chamado. Lista nativa, separada por modalidade (Presencial, EaD...). */
export function SeletorDeCurso({ id, cursos, valor, aoMudar, descricaoId }: PropsCurso) {
  const grupos = useMemo(() => agruparPorModalidade(cursos), [cursos]);
  return (
    <select
      id={id}
      className="entrada"
      required
      value={valor}
      aria-describedby={descricaoId}
      onChange={(e) => aoMudar(e.target.value)}
    >
      <option value="">Escolha o seu curso</option>
      {grupos.map((grupo) => (
        <optgroup key={grupo.modalidade} label={MODALIDADES[grupo.modalidade]}>
          {grupo.cursos.map((curso) => (
            <option key={curso.id} value={curso.id}>
              {nomeComGrau(curso)}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

interface PropsCursos {
  cursos: Curso[];
  selecionados: string[];
  aoMudar: (ids: string[]) => void;
  /** Texto para leitores de tela, ex.: "Cursos que Renata coordena". */
  rotulo: string;
}

/** Vários cursos, para vincular quem atende na Coordenação. Tem busca, porque são muitos cursos. */
export function SeletorDeCursos({ cursos, selecionados, aoMudar, rotulo }: PropsCursos) {
  const idBase = useId();
  const [busca, setBusca] = useState('');
  const grupos = useMemo(() => agruparPorModalidade(filtrarCursos(cursos, busca)), [cursos, busca]);
  const escolhidos = useMemo(
    () => ordenarCursos(cursos.filter((curso) => selecionados.includes(curso.id))),
    [cursos, selecionados],
  );

  function alternar(cursoId: string, marcado: boolean) {
    aoMudar(marcado ? [...selecionados, cursoId] : selecionados.filter((id) => id !== cursoId));
  }

  return (
    <div className="seletor-cursos" role="group" aria-label={rotulo}>
      <div className="seletor-cursos-topo">
        <div className="busca busca--compacta">
          <IconeBusca tamanho={16} />
          <label htmlFor={`${idBase}-busca`} className="visualmente-oculto">
            Buscar curso
          </label>
          <input
            id={`${idBase}-busca`}
            type="search"
            className="entrada"
            placeholder="Buscar curso pelo nome"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <span className="seletor-cursos-contagem" aria-live="polite">
          {escolhidos.length === 0
            ? 'Nenhum curso escolhido'
            : escolhidos.length === 1
              ? '1 curso escolhido'
              : `${escolhidos.length} cursos escolhidos`}
        </span>
      </div>

      {escolhidos.length > 0 && (
        <ul className="seletor-cursos-escolhidos" aria-label="Cursos escolhidos">
          {escolhidos.map((curso) => (
            <li key={curso.id}>
              <span>{nomeCompletoDoCurso(curso)}</span>
              <button
                type="button"
                className="seletor-cursos-remover"
                aria-label={`Tirar ${nomeCompletoDoCurso(curso)}`}
                onClick={() => alternar(curso.id, false)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="seletor-cursos-lista">
        {grupos.length === 0 ? (
          <p className="seletor-cursos-vazio">Nenhum curso com esse nome.</p>
        ) : (
          grupos.map((grupo) => (
            <fieldset key={grupo.modalidade} className="seletor-cursos-grupo">
              <legend>{MODALIDADES[grupo.modalidade]}</legend>
              {grupo.cursos.map((curso) => (
                <label key={curso.id} className="marcador marcador--pequeno">
                  <input
                    type="checkbox"
                    checked={selecionados.includes(curso.id)}
                    onChange={(e) => alternar(curso.id, e.target.checked)}
                  />
                  <span>{nomeComGrau(curso)}</span>
                </label>
              ))}
            </fieldset>
          ))
        )}
      </div>
    </div>
  );
}
