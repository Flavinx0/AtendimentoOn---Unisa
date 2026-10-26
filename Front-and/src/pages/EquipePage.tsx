import { useMemo, useState, type FormEvent } from 'react';
import { api } from '../api';
import { useUsuarioLogado } from '../auth/AuthContext';
import { Alerta } from '../components/Alerta';
import { Avatar } from '../components/Avatar';
import { Carregando } from '../components/Carregando';
import { IconeMais } from '../components/Icones';
import { IconeDaEquipe } from '../components/SeloEquipe';
import { SeletorDeCursos } from '../components/SeletorDeCurso';
import { useAsync } from '../hooks/useAsync';
import type { AlteracaoAtendente, Atendente, Curso, Equipe } from '../types';
import { agruparPorModalidade, MODALIDADES, nomeComGrau, nomeCompletoDoCurso, ordenarCursos } from '../utils/cursos';
import { EQUIPES, LISTA_EQUIPES } from '../utils/equipes';
import { mensagemDeErro } from '../utils/erros';

const FORMULARIO_VAZIO = {
  nome: '',
  email: '',
  senha: '',
  equipe: 'Secretaria' as Equipe,
  administrador: false,
  cursos: [] as string[],
};

/** Quantos cursos aparecem na linha de cada coordenador antes do "e mais N". */
const CURSOS_NA_LINHA = 3;

/** Edição dos cursos de alguém: ao abrir "Cursos" ou ao mover a pessoa para a Coordenação. */
interface EdicaoDeCursos {
  id: string;
  cursos: string[];
}

const primeiroNome = (nome: string) => nome.split(' ')[0];
const quantosCursos = (n: number) => (n === 1 ? '1 curso' : `${n} cursos`);

/** Gestão da equipe de atendimento. Só administradores (Suporte de TI) chegam aqui. */
export function EquipePage() {
  const usuario = useUsuarioLogado();
  const atendentes = useAsync(() => api.listarAtendentes(), []);
  const cursos = useAsync(() => api.listarCursos(), []);
  const [formularioAberto, setFormularioAberto] = useState(false);
  const [novo, setNovo] = useState(FORMULARIO_VAZIO);
  const [cadastrando, setCadastrando] = useState(false);
  const [salvandoId, setSalvandoId] = useState<string | null>(null);
  const [edicao, setEdicao] = useState<EdicaoDeCursos | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const porEquipe = useMemo(
    () =>
      LISTA_EQUIPES.map((equipe) => ({
        equipe,
        membros: (atendentes.dados ?? []).filter((a) => a.equipe === equipe),
      })),
    [atendentes.dados],
  );

  // Cursos sem ninguém ativo da Coordenação: os chamados deles só os administradores veem.
  const cobertura = useMemo(() => {
    const todos = cursos.dados ?? [];
    const comCoordenacao = new Set(
      (atendentes.dados ?? [])
        .filter((a) => a.ativo && a.equipe === 'Coordenacao')
        .flatMap((a) => a.cursos.map((c) => c.id)),
    );
    const semCoordenacao = todos.filter((c) => !comCoordenacao.has(c.id));
    return { total: todos.length, comCoordenacao: todos.length - semCoordenacao.length, semCoordenacao };
  }, [cursos.dados, atendentes.dados]);

  async function cadastrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);
    setAviso(null);
    const naCoordenacao = novo.equipe === 'Coordenacao';
    if (naCoordenacao && novo.cursos.length === 0) {
      setErro('Escolha pelo menos um curso para quem vai atender na Coordenação.');
      return;
    }
    setCadastrando(true);
    try {
      const criado = await api.cadastrarAtendente({
        ...novo,
        nome: novo.nome.trim(),
        email: novo.email.trim(),
        administrador: novo.equipe === 'SuporteTI' && novo.administrador,
        cursos: naCoordenacao ? novo.cursos : [],
      });
      setAviso(
        naCoordenacao
          ? `Conta de ${criado.nome} criada na Coordenação, com ${quantosCursos(criado.cursos.length)}. Passe o e-mail e a senha inicial para a pessoa: no primeiro acesso, o sistema pede uma senha nova.`
          : `Conta de ${criado.nome} criada na equipe ${EQUIPES[novo.equipe].nome}. Passe o e-mail e a senha inicial para a pessoa: no primeiro acesso, o sistema pede uma senha nova.`,
      );
      setNovo(FORMULARIO_VAZIO);
      setFormularioAberto(false);
      await atendentes.recarregar(true);
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setCadastrando(false);
    }
  }

  /** Salva a mudança e devolve true se deu certo. */
  async function alterar(atendente: Atendente, mudanca: Partial<AlteracaoAtendente>): Promise<boolean> {
    const dados: AlteracaoAtendente = {
      equipe: atendente.equipe ?? 'SuporteTI',
      administrador: atendente.perfil === 'Administrador',
      ativo: atendente.ativo,
      cursos: atendente.cursos.map((c) => c.id),
      ...mudanca,
    };
    // Administrador só existe no Suporte de TI, e cursos só na Coordenação.
    if (dados.equipe !== 'SuporteTI') dados.administrador = false;
    if (dados.equipe !== 'Coordenacao') dados.cursos = [];

    setSalvandoId(atendente.id);
    setErro(null);
    setAviso(null);
    try {
      const atualizado = await api.atualizarAtendente(atendente.id, dados);
      setAviso(`Alterações de ${atualizado.nome} salvas.`);
      await atendentes.recarregar(true);
      return true;
    } catch (e) {
      setErro(mensagemDeErro(e));
      return false;
    } finally {
      setSalvandoId(null);
    }
  }

  function mudarEquipe(atendente: Atendente, equipe: Equipe) {
    // Na Coordenação, a pessoa precisa de cursos: primeiro escolhe, depois salva tudo junto.
    if (equipe === 'Coordenacao') {
      setErro(null);
      setEdicao({ id: atendente.id, cursos: [] });
      return;
    }
    if (edicao?.id === atendente.id) setEdicao(null);
    void alterar(atendente, { equipe });
  }

  async function salvarCursos(atendente: Atendente) {
    if (!edicao) return;
    if (edicao.cursos.length === 0) {
      setErro('Escolha pelo menos um curso para quem atende na Coordenação.');
      return;
    }
    const salvou = await alterar(atendente, { equipe: 'Coordenacao', cursos: edicao.cursos });
    if (salvou) setEdicao(null);
  }

  return (
    <div className="pagina">
      <header className="pagina-cabecalho">
        <div>
          <h1>Equipe de atendimento</h1>
          <p>
            Cadastre os atendentes e defina a equipe de cada um. Cada atendente vê e atende só os chamados da
            própria equipe; na Coordenação, só os dos cursos a que está vinculado. Ninguém se cadastra sozinho como
            atendente.
          </p>
        </div>
        {!formularioAberto && (
          <button type="button" className="botao botao--primario" onClick={() => setFormularioAberto(true)}>
            <IconeMais tamanho={18} />
            Novo atendente
          </button>
        )}
      </header>

      {erro && <Alerta tipo="erro">{erro}</Alerta>}
      {aviso && <Alerta tipo="sucesso">{aviso}</Alerta>}

      {formularioAberto && (
        <form className="bloco formulario formulario-atendente" onSubmit={cadastrar}>
          <h2>Novo atendente</h2>
          <div className="grade-campos">
            <div className="campo">
              <label htmlFor="novo-nome">Nome completo</label>
              <input
                id="novo-nome"
                className="entrada"
                required
                value={novo.nome}
                onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
              />
            </div>
            <div className="campo">
              <label htmlFor="novo-email">E-mail</label>
              <input
                id="novo-email"
                type="email"
                className="entrada"
                required
                value={novo.email}
                onChange={(e) => setNovo({ ...novo, email: e.target.value })}
              />
            </div>
            <div className="campo">
              <label htmlFor="novo-senha">Senha inicial</label>
              <input
                id="novo-senha"
                type="text"
                className="entrada"
                required
                minLength={6}
                autoComplete="off"
                aria-describedby="novo-senha-ajuda"
                value={novo.senha}
                onChange={(e) => setNovo({ ...novo, senha: e.target.value })}
              />
              <span id="novo-senha-ajuda" className="campo-ajuda">
                Pelo menos 6 caracteres. No primeiro acesso, a pessoa troca por uma senha dela.
              </span>
            </div>
            <div className="campo">
              <label htmlFor="novo-equipe">Equipe</label>
              <select
                id="novo-equipe"
                className="entrada"
                value={novo.equipe}
                onChange={(e) => setNovo({ ...novo, equipe: e.target.value as Equipe })}
              >
                {LISTA_EQUIPES.map((equipe) => (
                  <option key={equipe} value={equipe}>
                    {EQUIPES[equipe].nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {novo.equipe === 'Coordenacao' ? (
            <div className="campo">
              <span className="rotulo-campo" id="novo-cursos-rotulo">
                Cursos que vai coordenar
              </span>
              <span className="campo-ajuda">
                Os chamados desses cursos vão para esta pessoa. Um curso pode ter mais de um coordenador.
              </span>
              <SeletorCarregado
                carregando={cursos.carregando}
                erro={cursos.erro}
                aoTentarDeNovo={() => void cursos.recarregar()}
                cursos={cursos.dados}
                selecionados={novo.cursos}
                aoMudar={(ids) => setNovo({ ...novo, cursos: ids })}
                rotulo="Cursos que vai coordenar"
              />
            </div>
          ) : (
            <label className="marcador">
              <input
                type="checkbox"
                checked={novo.equipe === 'SuporteTI' && novo.administrador}
                disabled={novo.equipe !== 'SuporteTI'}
                onChange={(e) => setNovo({ ...novo, administrador: e.target.checked })}
              />
              <span>
                Administrador: também cadastra e gerencia atendentes.
                {novo.equipe !== 'SuporteTI' && ' Disponível só para o Suporte de TI.'}
              </span>
            </label>
          )}

          <div className="form-acoes">
            <button type="submit" className="botao botao--primario" disabled={cadastrando}>
              {cadastrando ? 'Cadastrando…' : 'Cadastrar atendente'}
            </button>
            <button
              type="button"
              className="botao botao--fantasma"
              onClick={() => {
                setFormularioAberto(false);
                setNovo(FORMULARIO_VAZIO);
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {atendentes.erro ? (
        <Alerta
          tipo="erro"
          acao={
            <button type="button" className="botao botao--secundario botao--pequeno" onClick={() => void atendentes.recarregar()}>
              Tentar de novo
            </button>
          }
        >
          {mensagemDeErro(atendentes.erro)}
        </Alerta>
      ) : atendentes.carregando ? (
        <Carregando texto="Carregando a equipe…" />
      ) : (
        porEquipe.map(({ equipe, membros }) => (
          <section key={equipe} className="secao" aria-labelledby={`titulo-${equipe}`}>
            <div className="equipe-cabecalho">
              <span className="faixa-equipe-icone" aria-hidden="true">
                <IconeDaEquipe equipe={equipe} tamanho={20} />
              </span>
              <h2 id={`titulo-${equipe}`}>{EQUIPES[equipe].nome}</h2>
              <span className="aba-contagem">{membros.length}</span>
            </div>

            {equipe === 'Coordenacao' && cursos.dados && cobertura.total > 0 && (
              <CoberturaDosCursos
                total={cobertura.total}
                comCoordenacao={cobertura.comCoordenacao}
                semCoordenacao={cobertura.semCoordenacao}
              />
            )}

            {membros.length === 0 ? (
              <p className="vazio">Nenhum atendente nesta equipe ainda.</p>
            ) : (
              <ul className="lista-equipe">
                {membros.map((atendente) => {
                  const voce = atendente.id === usuario.id;
                  const salvando = salvandoId === atendente.id;
                  const editando = edicao?.id === atendente.id ? edicao : null;
                  const naCoordenacao = atendente.equipe === 'Coordenacao';
                  return (
                    <li key={atendente.id} className={atendente.ativo ? 'membro' : 'membro membro--inativo'}>
                      <div className="membro-pessoa">
                        <Avatar nome={atendente.nome} destaque={atendente.perfil === 'Administrador'} />
                        <div>
                          <strong>
                            {atendente.nome}
                            {voce && ' (você)'}
                          </strong>
                          <span>{atendente.email}</span>
                        </div>
                      </div>
                      <div className="membro-situacao">
                        {atendente.perfil === 'Administrador' && <span className="selo-equipe">Administrador</span>}
                        {atendente.ativo && atendente.precisaTrocarSenha && (
                          <span className="situacao situacao--pendente" title="Ainda não entrou para trocar a senha inicial.">
                            Senha inicial
                          </span>
                        )}
                        <span className={atendente.ativo ? 'situacao situacao--ativa' : 'situacao situacao--inativa'}>
                          {atendente.ativo ? 'Ativo' : 'Desativado'}
                        </span>
                      </div>
                      <div className="membro-controles">
                        <label className="visualmente-oculto" htmlFor={`equipe-${atendente.id}`}>
                          Equipe de {atendente.nome}
                        </label>
                        <select
                          id={`equipe-${atendente.id}`}
                          className="entrada entrada--pequena"
                          value={editando && !naCoordenacao ? 'Coordenacao' : (atendente.equipe ?? 'SuporteTI')}
                          disabled={voce || salvando}
                          onChange={(e) => mudarEquipe(atendente, e.target.value as Equipe)}
                        >
                          {LISTA_EQUIPES.map((e) => (
                            <option key={e} value={e}>
                              {EQUIPES[e].nome}
                            </option>
                          ))}
                        </select>
                        {atendente.equipe === 'SuporteTI' && !editando && (
                          <label className="marcador marcador--pequeno">
                            <input
                              type="checkbox"
                              checked={atendente.perfil === 'Administrador'}
                              disabled={voce || salvando}
                              onChange={(e) => void alterar(atendente, { administrador: e.target.checked })}
                            />
                            <span>Administrador</span>
                          </label>
                        )}
                        {naCoordenacao && !editando && (
                          <button
                            type="button"
                            className="botao botao--secundario botao--pequeno"
                            disabled={salvando}
                            aria-label={`Cursos de ${atendente.nome}`}
                            onClick={() => {
                              setErro(null);
                              setEdicao({ id: atendente.id, cursos: atendente.cursos.map((c) => c.id) });
                            }}
                          >
                            Cursos
                          </button>
                        )}
                        <button
                          type="button"
                          className="botao botao--secundario botao--pequeno"
                          disabled={voce || salvando}
                          onClick={() => void alterar(atendente, { ativo: !atendente.ativo })}
                        >
                          {salvando ? 'Salvando…' : atendente.ativo ? 'Desativar' : 'Reativar'}
                        </button>
                      </div>

                      {naCoordenacao && !editando && <CursosDoMembro cursos={atendente.cursos} />}

                      {editando && (
                        <div className="membro-editor">
                          <p className="membro-editor-titulo">
                            {naCoordenacao
                              ? `Cursos que ${primeiroNome(atendente.nome)} coordena`
                              : `Para mover ${primeiroNome(atendente.nome)} para a Coordenação, escolha os cursos que vai coordenar.`}
                          </p>
                          <SeletorCarregado
                            carregando={cursos.carregando}
                            erro={cursos.erro}
                            aoTentarDeNovo={() => void cursos.recarregar()}
                            cursos={cursos.dados}
                            selecionados={editando.cursos}
                            aoMudar={(ids) => setEdicao({ id: atendente.id, cursos: ids })}
                            rotulo={`Cursos que ${atendente.nome} coordena`}
                          />
                          <div className="form-acoes">
                            <button
                              type="button"
                              className="botao botao--primario botao--pequeno"
                              disabled={salvando}
                              onClick={() => void salvarCursos(atendente)}
                            >
                              {salvando ? 'Salvando…' : naCoordenacao ? 'Salvar cursos' : 'Mover para a Coordenação'}
                            </button>
                            <button
                              type="button"
                              className="botao botao--fantasma botao--pequeno"
                              disabled={salvando}
                              onClick={() => setEdicao(null)}
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ))
      )}
    </div>
  );
}

/** Lista de cursos com os estados de carregando e erro. */
function SeletorCarregado({
  carregando,
  erro,
  aoTentarDeNovo,
  cursos,
  selecionados,
  aoMudar,
  rotulo,
}: {
  carregando: boolean;
  erro: unknown;
  aoTentarDeNovo: () => void;
  cursos: Curso[] | null | undefined;
  selecionados: string[];
  aoMudar: (ids: string[]) => void;
  rotulo: string;
}) {
  if (erro) {
    return (
      <Alerta
        tipo="erro"
        acao={
          <button type="button" className="botao botao--secundario botao--pequeno" onClick={aoTentarDeNovo}>
            Tentar de novo
          </button>
        }
      >
        {mensagemDeErro(erro)}
      </Alerta>
    );
  }
  if (carregando || !cursos) return <Carregando texto="Carregando cursos…" />;
  return <SeletorDeCursos cursos={cursos} selecionados={selecionados} aoMudar={aoMudar} rotulo={rotulo} />;
}

/** Os cursos de quem está na Coordenação, na linha da pessoa. */
function CursosDoMembro({ cursos }: { cursos: Curso[] }) {
  const ordenados = ordenarCursos(cursos);
  if (ordenados.length === 0) {
    return <p className="membro-cursos membro-cursos--vazio">Nenhum curso vinculado. Use o botão Cursos.</p>;
  }
  const visiveis = ordenados.slice(0, CURSOS_NA_LINHA);
  const restantes = ordenados.length - visiveis.length;
  return (
    <ul className="membro-cursos" aria-label="Cursos que coordena">
      {visiveis.map((curso) => (
        <li key={curso.id}>{nomeCompletoDoCurso(curso)}</li>
      ))}
      {restantes > 0 && (
        <li className="membro-cursos-mais" title={ordenados.slice(CURSOS_NA_LINHA).map(nomeCompletoDoCurso).join('\n')}>
          e mais {restantes}
        </li>
      )}
    </ul>
  );
}

/** Quantos cursos já têm coordenação e quais ainda não têm. */
function CoberturaDosCursos({
  total,
  comCoordenacao,
  semCoordenacao,
}: {
  total: number;
  comCoordenacao: number;
  semCoordenacao: Curso[];
}) {
  const grupos = agruparPorModalidade(semCoordenacao);
  return (
    <div className="cobertura-cursos">
      <p>
        <strong>
          {comCoordenacao} de {total} cursos
        </strong>{' '}
        têm alguém da Coordenação vinculado.
        {semCoordenacao.length > 0 &&
          ' Os chamados dos outros cursos chegam só aos administradores, na tela Outras equipes, até alguém ser vinculado.'}
      </p>
      {semCoordenacao.length > 0 && (
        <details>
          <summary>
            Ver {semCoordenacao.length === 1 ? 'o curso' : `os ${semCoordenacao.length} cursos`} sem coordenação
          </summary>
          <div className="cobertura-grupos">
            {grupos.map((grupo) => (
              <div key={grupo.modalidade}>
                <h3>{MODALIDADES[grupo.modalidade]}</h3>
                <ul>
                  {grupo.cursos.map((curso) => (
                    <li key={curso.id}>{nomeComGrau(curso)}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
