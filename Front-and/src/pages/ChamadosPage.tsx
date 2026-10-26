import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useUsuarioLogado } from '../auth/AuthContext';
import { Alerta } from '../components/Alerta';
import { Carregando } from '../components/Carregando';
import { EstadoVazio } from '../components/EstadoVazio';
import { IconeBusca, IconeMais } from '../components/Icones';
import { ItemChamado } from '../components/ItemChamado';
import { FaixaEquipe, IconeDaEquipe } from '../components/SeloEquipe';
import { useAsync } from '../hooks/useAsync';
import type { Chamado } from '../types';
import { ordenarAntigos, ordenarRecentes } from '../utils/chamados';
import { EQUIPES, LISTA_EQUIPES, ehAtendimento, nomeDaFila } from '../utils/equipes';
import { mensagemDeErro } from '../utils/erros';
import { semAcento } from '../utils/texto';

interface Aba {
  id: string;
  rotulo: string;
  filtro: (chamado: Chamado) => boolean;
  ordem: 'recentes' | 'antigos';
}

/**
 * Lista de chamados. Para quem abre chamados, mostra os próprios. Para atendentes (e administradores),
 * mostra a fila da própria equipe. Com `supervisao`, é a tela "Outras equipes" do administrador,
 * que acompanha as áreas além da dele, separadas da fila de trabalho.
 */
export function ChamadosPage({ supervisao = false }: { supervisao?: boolean }) {
  const usuario = useUsuarioLogado();
  const atendimento = ehAtendimento(usuario.perfil);
  const [parametros, setParametros] = useSearchParams();
  const [busca, setBusca] = useState('');
  const chamados = useAsync(() => api.listarChamados(), []);
  const categorias = useAsync(() => api.listarCategorias(), []);

  const outrasEquipes = useMemo(() => LISTA_EQUIPES.filter((e) => e !== usuario.equipe), [usuario.equipe]);
  const equipe = supervisao
    ? (outrasEquipes.find((e) => e === parametros.get('equipe')) ?? outrasEquipes[0] ?? null)
    : atendimento
      ? usuario.equipe
      : null;

  const abas = useMemo<Aba[]>(() => {
    if (!atendimento) {
      return [
        { id: 'todos', rotulo: 'Todos', filtro: () => true, ordem: 'recentes' },
        {
          id: 'aguardando',
          rotulo: 'Aguardando você',
          filtro: (c) => c.status === 'AguardandoUsuario',
          ordem: 'recentes',
        },
        {
          id: 'andamento',
          rotulo: 'Em andamento',
          filtro: (c) => c.status === 'Aberto' || c.status === 'EmAtendimento',
          ordem: 'recentes',
        },
        { id: 'encerrados', rotulo: 'Encerrados', filtro: (c) => c.status === 'Encerrado', ordem: 'recentes' },
      ];
    }
    const daEquipe = (c: Chamado) => c.equipe === equipe;
    const semAtendente: Aba = {
      id: 'fila',
      rotulo: 'Sem atendente',
      filtro: (c) => daEquipe(c) && !c.atendenteId && c.status !== 'Encerrado',
      ordem: 'antigos',
    };
    const todos: Aba = { id: 'todos', rotulo: 'Todos', filtro: daEquipe, ordem: 'recentes' };
    return supervisao
      ? [
          semAtendente,
          {
            id: 'andamento',
            rotulo: 'Em andamento',
            filtro: (c) => daEquipe(c) && Boolean(c.atendenteId) && c.status !== 'Encerrado',
            ordem: 'recentes',
          },
          todos,
        ]
      : [
          semAtendente,
          {
            id: 'meus',
            rotulo: 'Com você',
            filtro: (c) => daEquipe(c) && c.atendenteId === usuario.id && c.status !== 'Encerrado',
            ordem: 'recentes',
          },
          todos,
        ];
  }, [atendimento, supervisao, equipe, usuario.id]);

  const abaAtual = abas.find((aba) => aba.id === parametros.get('aba')) ?? abas[0];
  const categoria = parametros.get('categoria') ?? '';
  const lista = useMemo(() => chamados.dados ?? [], [chamados.dados]);

  // Na fila da Coordenação todos os chamados têm a mesma categoria: o filtro útil é o curso.
  const filtrarPorCurso = equipe === 'Coordenacao';
  const curso = filtrarPorCurso ? (parametros.get('curso') ?? '') : '';
  const cursosNaFila = useMemo(() => {
    if (!filtrarPorCurso) return [];
    const nomes = new Map<string, string>();
    lista.forEach((c) => {
      if (c.equipe === 'Coordenacao' && c.cursoId && c.cursoNome) nomes.set(c.cursoId, c.cursoNome);
    });
    return [...nomes]
      .map(([id, nome]) => ({ id, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [lista, filtrarPorCurso]);

  const contagem = useMemo(
    () => Object.fromEntries(abas.map((aba) => [aba.id, lista.filter(aba.filtro).length])),
    [abas, lista],
  );

  // Resumo de cada área, para o administrador escolher qual acompanhar.
  const resumoDasEquipes = useMemo(
    () =>
      outrasEquipes.map((e) => {
        const abertos = lista.filter((c) => c.equipe === e && c.status !== 'Encerrado');
        return {
          equipe: e,
          semAtendente: abertos.filter((c) => !c.atendenteId).length,
          emAndamento: abertos.filter((c) => c.atendenteId).length,
        };
      }),
    [outrasEquipes, lista],
  );

  const visiveis = useMemo(() => {
    const termo = semAcento(busca.trim());
    const filtrados = lista.filter(
      (c) =>
        abaAtual.filtro(c) &&
        (filtrarPorCurso ? !curso || c.cursoId === curso : !categoria || c.categoriaId === categoria) &&
        (!termo || semAcento(`${c.protocolo} ${c.titulo} ${c.solicitanteNome} ${c.cursoNome ?? ''}`).includes(termo)),
    );
    return abaAtual.ordem === 'antigos' ? ordenarAntigos(filtrados) : ordenarRecentes(filtrados);
  }, [lista, abaAtual, categoria, curso, filtrarPorCurso, busca]);

  function alterarParametro(chave: string, valor: string) {
    setParametros(
      (atuais) => {
        const novos = new URLSearchParams(atuais);
        if (valor) novos.set(chave, valor);
        else novos.delete(chave);
        return novos;
      },
      { replace: true },
    );
  }

  function limparFiltros() {
    setBusca('');
    alterarParametro('categoria', '');
    alterarParametro('curso', '');
  }

  const temFiltro = Boolean(busca.trim() || (filtrarPorCurso ? curso : categoria));
  const titulo = supervisao
    ? 'Outras equipes'
    : !atendimento
      ? 'Meus chamados'
      : equipe
        ? nomeDaFila(equipe)
        : 'Fila de atendimento';
  const descricao = supervisao
    ? `Acompanhe as filas das outras áreas. Os chamados ${
        usuario.equipe ? `${EQUIPES[usuario.equipe].artigo} ${EQUIPES[usuario.equipe].nome}` : 'da sua equipe'
      } ficam na sua fila.`
    : !atendimento
      ? 'Acompanhe o andamento e responda a equipe de atendimento.'
      : 'Na aba Sem atendente, os chamados mais antigos vêm primeiro.';

  return (
    <div className="pagina">
      <header className="pagina-cabecalho">
        <div>
          <h1>{titulo}</h1>
          <p>{descricao}</p>
        </div>
        {!atendimento && (
          <Link to="/chamados/novo" className="botao botao--primario">
            <IconeMais tamanho={18} />
            Abrir chamado
          </Link>
        )}
      </header>

      {atendimento && !supervisao && usuario.equipe && <FaixaEquipe equipe={usuario.equipe} cursos={usuario.cursos} />}

      {supervisao && (
        <div className="seletor-equipes" role="group" aria-label="Escolher a equipe">
          {resumoDasEquipes.map((resumo) => (
            <button
              key={resumo.equipe}
              type="button"
              className="seletor-equipe"
              aria-pressed={resumo.equipe === equipe}
              onClick={() => alterarParametro('equipe', resumo.equipe)}
            >
              <span className="seletor-equipe-topo">
                <span className="faixa-equipe-icone" aria-hidden="true">
                  <IconeDaEquipe equipe={resumo.equipe} tamanho={20} />
                </span>
                {EQUIPES[resumo.equipe].nome}
              </span>
              <span className="seletor-equipe-numeros">
                <span>
                  <strong className={resumo.semAtendente > 0 ? 'tem-pendencia' : undefined}>{resumo.semAtendente}</strong>
                  sem atendente
                </span>
                <span>
                  <strong>{resumo.emAndamento}</strong>
                  em andamento
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="abas" role="group" aria-label="Filtrar por situação">
        {abas.map((aba) => (
          <button
            key={aba.id}
            type="button"
            className="aba"
            aria-pressed={aba.id === abaAtual.id}
            onClick={() => alterarParametro('aba', aba.id === abas[0].id ? '' : aba.id)}
          >
            {aba.rotulo}
            {chamados.dados && <span className="aba-contagem">{contagem[aba.id]}</span>}
          </button>
        ))}
      </div>

      <div className="filtros">
        <div className="busca">
          <IconeBusca tamanho={18} />
          <label htmlFor="busca" className="visualmente-oculto">
            Buscar chamados
          </label>
          <input
            id="busca"
            type="search"
            className="entrada"
            placeholder={
              filtrarPorCurso
                ? 'Buscar por protocolo, assunto, solicitante ou curso'
                : atendimento
                  ? 'Buscar por protocolo, assunto ou solicitante'
                  : 'Buscar por protocolo ou assunto'
            }
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        {filtrarPorCurso ? (
          <>
            <label htmlFor="curso" className="visualmente-oculto">
              Curso
            </label>
            <select
              id="curso"
              className="entrada filtro-categoria"
              value={curso}
              onChange={(e) => alterarParametro('curso', e.target.value)}
            >
              <option value="">Todos os cursos</option>
              {cursosNaFila.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </>
        ) : (
          <>
            <label htmlFor="categoria" className="visualmente-oculto">
              Categoria
            </label>
            <select
              id="categoria"
              className="entrada filtro-categoria"
              value={categoria}
              onChange={(e) => alterarParametro('categoria', e.target.value)}
            >
              <option value="">Todas as categorias</option>
              {(categorias.dados ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      {chamados.erro ? (
        <Alerta
          tipo="erro"
          acao={
            <button type="button" className="botao botao--secundario botao--pequeno" onClick={() => void chamados.recarregar()}>
              Tentar de novo
            </button>
          }
        >
          {mensagemDeErro(chamados.erro)}
        </Alerta>
      ) : chamados.carregando ? (
        <Carregando texto="Carregando chamados…" />
      ) : visiveis.length === 0 ? (
        <EstadoVazio
          titulo={
            temFiltro
              ? 'Nenhum chamado encontrado com esses filtros'
              : lista.length === 0 && !atendimento
                ? 'Você ainda não abriu chamados'
                : 'Nenhum chamado por aqui'
          }
          acao={
            temFiltro ? (
              <button type="button" className="botao botao--secundario botao--pequeno" onClick={limparFiltros}>
                Limpar filtros
              </button>
            ) : lista.length === 0 && !atendimento ? (
              <Link to="/chamados/novo" className="botao botao--secundario botao--pequeno">
                Abrir chamado
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          <p className="texto-suave texto-pequeno" aria-live="polite">
            {visiveis.length === 1 ? '1 chamado' : `${visiveis.length} chamados`}
          </p>
          <ul className="lista-chamados">
            {visiveis.map((chamado) => (
              <ItemChamado key={chamado.id} chamado={chamado} usuarioId={usuario.id} mostrarSolicitante={atendimento} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
