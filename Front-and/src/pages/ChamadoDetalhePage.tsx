import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent as EventoTeclado, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api, ApiError } from '../api';
import { useUsuarioLogado } from '../auth/AuthContext';
import { Alerta } from '../components/Alerta';
import { Avatar } from '../components/Avatar';
import { Carregando } from '../components/Carregando';
import { DialogoConfirmacao } from '../components/DialogoConfirmacao';
import { EstadoVazio } from '../components/EstadoVazio';
import { IconeCheck, IconeEnviar, IconeVoltar } from '../components/Icones';
import { SenhaProtocolo } from '../components/SenhaProtocolo';
import { StatusBadge } from '../components/StatusBadge';
import { TextoFormatado } from '../components/TextoFormatado';
import { useAsync } from '../hooks/useAsync';
import type { ChamadoDetalhe } from '../types';
import { reduzirMovimento } from '../utils/chamados';
import { formatarDataHora, formatarMomento, tempoRelativo } from '../utils/datas';
import { EQUIPES, ehAtendimento, nomeDaFila, podeAtender } from '../utils/equipes';
import { mensagemDeErro } from '../utils/erros';

const INTERVALO_ATUALIZACAO = 15_000;

export function ChamadoDetalhePage() {
  const { id = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const usuario = useUsuarioLogado();
  const [recemCriado] = useState(() => Boolean((location.state as { criado?: boolean } | null)?.criado));
  const { dados, erro, carregando, recarregar } = useAsync(() => api.obterChamado(id), [id]);
  const encerrado = dados?.status === 'Encerrado';

  // Limpa o aviso de "chamado aberto" do histórico, para não reaparecer ao recarregar a página.
  useEffect(() => {
    if (recemCriado) navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Busca novas mensagens enquanto a página estiver aberta.
  useEffect(() => {
    if (encerrado) return;
    const intervalo = window.setInterval(() => {
      if (document.visibilityState === 'visible') void recarregar(true);
    }, INTERVALO_ATUALIZACAO);
    return () => window.clearInterval(intervalo);
  }, [recarregar, encerrado]);

  // Chamados de outras áreas, abertos pelo administrador, voltam para "Outras equipes".
  const deOutraEquipe = usuario.perfil === 'Administrador' && dados && dados.equipe !== usuario.equipe;
  const voltar = deOutraEquipe ? (
    <Link to={`/outras-equipes?equipe=${dados.equipe}`} className="voltar">
      <IconeVoltar tamanho={18} />
      Outras equipes
    </Link>
  ) : (
    <Link to="/chamados" className="voltar">
      <IconeVoltar tamanho={18} />
      {ehAtendimento(usuario.perfil)
        ? usuario.equipe
          ? nomeDaFila(usuario.equipe)
          : 'Fila de atendimento'
        : 'Meus chamados'}
    </Link>
  );

  if (carregando) {
    return (
      <div className="pagina">
        {voltar}
        <Carregando texto="Carregando chamado…" />
      </div>
    );
  }

  if (erro || !dados) {
    const naoEncontrado = erro instanceof ApiError && (erro.status === 404 || erro.status === 403);
    return (
      <div className="pagina">
        {voltar}
        {naoEncontrado ? (
          <EstadoVazio
            titulo="Chamado não encontrado"
            acao={
              <Link to="/chamados" className="botao botao--secundario botao--pequeno">
                Ver chamados
              </Link>
            }
          >
            Confira o endereço ou procure o chamado pelo protocolo na lista.
          </EstadoVazio>
        ) : (
          <Alerta
            tipo="erro"
            acao={
              <button type="button" className="botao botao--secundario botao--pequeno" onClick={() => void recarregar()}>
                Tentar de novo
              </button>
            }
          >
            {mensagemDeErro(erro)}
          </Alerta>
        )}
      </div>
    );
  }

  return (
    <DetalheChamado chamado={dados} recemCriado={recemCriado} voltar={voltar} aoAtualizar={() => recarregar(true)} />
  );
}

interface PropsDetalhe {
  chamado: ChamadoDetalhe;
  recemCriado: boolean;
  voltar: ReactNode;
  aoAtualizar: () => Promise<void>;
}

function DetalheChamado({ chamado, recemCriado, voltar, aoAtualizar }: PropsDetalhe) {
  const usuario = useUsuarioLogado();
  const [resposta, setResposta] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [processando, setProcessando] = useState<'assumir' | 'encerrar' | null>(null);
  const [erroAcao, setErroAcao] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const formulario = useRef<HTMLFormElement>(null);
  const ultimaMensagem = useRef<HTMLLIElement>(null);

  const ehSolicitante = chamado.solicitanteId === usuario.id;
  const ehResponsavel = chamado.atendenteId !== null && chamado.atendenteId === usuario.id;
  const ehAtendente = ehAtendimento(usuario.perfil);
  const daMinhaEquipe = podeAtender(usuario, chamado);
  const encerrado = chamado.status === 'Encerrado';
  const podeResponder = !encerrado && (ehSolicitante || ehResponsavel);
  const podeAssumir = !encerrado && daMinhaEquipe && !chamado.atendenteId;
  const podeEncerrar = !encerrado && (ehSolicitante || ehResponsavel); // RN01

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const conteudo = resposta.trim();
    if (!conteudo || enviando) return;
    setEnviando(true);
    setErroAcao(null);
    try {
      await api.enviarMensagem(chamado.id, conteudo);
      setResposta('');
      await aoAtualizar();
      requestAnimationFrame(() =>
        ultimaMensagem.current?.scrollIntoView({ behavior: reduzirMovimento() ? 'auto' : 'smooth', block: 'center' }),
      );
    } catch (e) {
      setErroAcao(mensagemDeErro(e));
    } finally {
      setEnviando(false);
    }
  }

  function aoTeclar(evento: EventoTeclado<HTMLTextAreaElement>) {
    if (evento.key === 'Enter' && (evento.ctrlKey || evento.metaKey)) {
      evento.preventDefault();
      formulario.current?.requestSubmit();
    }
  }

  async function executar(acao: 'assumir' | 'encerrar') {
    setProcessando(acao);
    setErroAcao(null);
    try {
      if (acao === 'assumir') await api.assumirChamado(chamado.id);
      else await api.encerrarChamado(chamado.id);
      await aoAtualizar();
    } catch (e) {
      setErroAcao(mensagemDeErro(e));
    } finally {
      setConfirmando(false);
      setProcessando(null);
    }
  }

  const etapaAtual = encerrado ? 3 : chamado.status === 'Aberto' ? 0 : 1;
  const etapas = [
    { titulo: 'Aberto', descricao: formatarDataHora(chamado.criadoEm) },
    {
      titulo: 'Em atendimento',
      descricao:
        chamado.status === 'AguardandoUsuario'
          ? ehSolicitante
            ? 'A equipe aguarda o seu retorno'
            : 'Aguardando o retorno do solicitante'
          : chamado.atendenteNome
            ? `Com ${ehResponsavel ? 'você' : chamado.atendenteNome}`
            : 'Esperando um atendente',
    },
    {
      titulo: 'Encerrado',
      descricao: chamado.encerradoEm ? formatarDataHora(chamado.encerradoEm) : 'Quando o pedido for resolvido',
    },
  ];

  return (
    <div className="pagina">
      {voltar}

      <header className="detalhe-cabecalho">
        <SenhaProtocolo protocolo={chamado.protocolo} tamanho="grande" imprimir={recemCriado}>
          <h1 className="senha-titulo senha-titulo--grande">{chamado.titulo}</h1>
          <span className="senha-linha">
            <StatusBadge status={chamado.status} ehSolicitante={ehSolicitante} />
            <span>{chamado.categoriaNome}</span>
            {chamado.cursoNome && <span>{chamado.cursoNome}</span>}
            <span title={formatarDataHora(chamado.criadoEm)}>Criado {tempoRelativo(chamado.criadoEm)}</span>
          </span>
        </SenhaProtocolo>

        {(podeAssumir || podeEncerrar) && (
          <div className="detalhe-acoes">
            {podeAssumir && (
              <button
                type="button"
                className="botao botao--chamar"
                onClick={() => void executar('assumir')}
                disabled={processando !== null}
              >
                {processando === 'assumir' ? 'Assumindo…' : 'Assumir chamado'}
              </button>
            )}
            {podeEncerrar && (
              <button
                type="button"
                className="botao botao--secundario"
                onClick={() => setConfirmando(true)}
                disabled={processando !== null}
              >
                Encerrar chamado
              </button>
            )}
          </div>
        )}
      </header>

      {recemCriado && (
        <Alerta tipo="sucesso">
          Chamado aberto. Guarde o protocolo {chamado.protocolo}: as respostas da equipe aparecem nesta página.
        </Alerta>
      )}
      {ehSolicitante && chamado.status === 'AguardandoUsuario' && (
        <Alerta tipo="aviso">A equipe respondeu e aguarda o seu retorno.</Alerta>
      )}
      {erroAcao && <Alerta tipo="erro">{erroAcao}</Alerta>}

      <div className="detalhe-grade">
        <section className="conversa" aria-labelledby="titulo-conversa">
          <div className="conversa-cabecalho">
            <h2 id="titulo-conversa">Conversa</h2>
          </div>

          <ol className="conversa-lista">
            <li className="mensagem mensagem--descricao">
              <Avatar nome={chamado.solicitanteNome} />
              <div className="mensagem-corpo">
                <div className="mensagem-cabecalho">
                  <span className="mensagem-autor">{ehSolicitante ? 'Você' : chamado.solicitanteNome}</span>
                  <span className="mensagem-papel">Descrição do chamado</span>
                  <time className="mensagem-hora" dateTime={chamado.criadoEm} title={formatarDataHora(chamado.criadoEm)}>
                    {formatarMomento(chamado.criadoEm)}
                  </time>
                </div>
                <p className="mensagem-texto">{chamado.descricao}</p>
              </div>
            </li>

            {chamado.mensagens.map((mensagem, indice) => {
              const minha = mensagem.autorId === usuario.id;
              const doAtendente = mensagem.origem === 'Atendente';
              const doBot = mensagem.origem === 'Bot';
              const autor = minha ? 'Você' : (mensagem.autorNome ?? (doBot ? 'Assistente virtual' : 'Usuário'));
              return (
                <li
                  key={mensagem.id}
                  ref={indice === chamado.mensagens.length - 1 ? ultimaMensagem : undefined}
                  className={doAtendente ? 'mensagem mensagem--atendente' : 'mensagem'}
                >
                  <Avatar nome={mensagem.autorNome ?? autor} destaque={doAtendente} />
                  <div className="mensagem-corpo">
                    <div className="mensagem-cabecalho">
                      <span className="mensagem-autor">{autor}</span>
                      {doAtendente && <span className="mensagem-papel">Atendente</span>}
                      {doBot && <span className="mensagem-papel">Resposta automática</span>}
                      <time className="mensagem-hora" dateTime={mensagem.enviadaEm} title={formatarDataHora(mensagem.enviadaEm)}>
                        {formatarMomento(mensagem.enviadaEm)}
                      </time>
                    </div>
                    <p className="mensagem-texto">
                      <TextoFormatado texto={mensagem.conteudo} />
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>

          {podeResponder ? (
            <form ref={formulario} className="composer" onSubmit={enviar}>
              <label htmlFor="resposta" className="composer-rotulo">
                {ehResponsavel ? 'Responder ao solicitante' : 'Sua resposta'}
              </label>
              <textarea
                id="resposta"
                className="entrada"
                rows={3}
                maxLength={4000}
                placeholder="Escreva sua mensagem"
                value={resposta}
                onChange={(e) => setResposta(e.target.value)}
                onKeyDown={aoTeclar}
              />
              <div className="composer-acoes">
                <span className="composer-dica">Ctrl + Enter também envia</span>
                <button type="submit" className="botao botao--primario" disabled={enviando || !resposta.trim()}>
                  <IconeEnviar tamanho={16} />
                  {enviando ? 'Enviando…' : 'Enviar resposta'}
                </button>
              </div>
            </form>
          ) : (
            <div className="conversa-aviso">
              {encerrado ? (
                <>
                  Chamado encerrado {chamado.encerradoEm ? `em ${formatarDataHora(chamado.encerradoEm)}` : ''}.
                  {ehSolicitante && (
                    <>
                      {' '}
                      Precisa de mais ajuda? <Link to="/chamados/novo">Abrir outro chamado</Link>
                    </>
                  )}
                </>
              ) : ehAtendente && !chamado.atendenteId && daMinhaEquipe ? (
                'Assuma o chamado para responder ao solicitante.'
              ) : ehAtendente ? (
                `Este chamado está com ${chamado.atendenteNome}. Só o atendente responsável pode responder.`
              ) : (
                'Você pode acompanhar este chamado, mas não pode responder.'
              )}
            </div>
          )}
        </section>

        <aside className="detalhe-lateral">
          <section className="painel-lateral" aria-labelledby="titulo-andamento">
            <h2 id="titulo-andamento">Andamento</h2>
            <ol className="andamento">
              {etapas.map((etapa, indice) => {
                const situacao = indice < etapaAtual ? 'feita' : indice === etapaAtual ? 'atual' : 'pendente';
                return (
                  <li
                    key={etapa.titulo}
                    className={`etapa etapa--${situacao}`}
                    aria-current={situacao === 'atual' ? 'step' : undefined}
                  >
                    <span className="etapa-marcador" aria-hidden="true">
                      {situacao === 'feita' ? <IconeCheck tamanho={14} /> : indice + 1}
                    </span>
                    <span className="etapa-texto">
                      <span className="etapa-titulo">{etapa.titulo}</span>
                      <span className="etapa-descricao">{etapa.descricao}</span>
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>

          <section className="painel-lateral" aria-labelledby="titulo-detalhes">
            <h2 id="titulo-detalhes">Detalhes</h2>
            <dl className="detalhes">
              <div>
                <dt>Protocolo</dt>
                <dd className="numeros">{chamado.protocolo}</dd>
              </div>
              <div>
                <dt>Categoria</dt>
                <dd>{chamado.categoriaNome}</dd>
              </div>
              {chamado.cursoNome && (
                <div>
                  <dt>Curso</dt>
                  <dd>{chamado.cursoNome}</dd>
                </div>
              )}
              <div>
                <dt>Equipe</dt>
                <dd>{EQUIPES[chamado.equipe].nome}</dd>
              </div>
              <div>
                <dt>Solicitante</dt>
                <dd>
                  {chamado.solicitanteNome}
                  {ehSolicitante && ' (você)'}
                </dd>
              </div>
              <div>
                <dt>Atendente</dt>
                <dd>
                  {chamado.atendenteNome
                    ? `${chamado.atendenteNome}${ehResponsavel ? ' (você)' : ''}`
                    : 'Ainda sem atendente'}
                </dd>
              </div>
              <div>
                <dt>Aberto em</dt>
                <dd>{formatarDataHora(chamado.criadoEm)}</dd>
              </div>
              {chamado.encerradoEm && (
                <div>
                  <dt>Encerrado em</dt>
                  <dd>{formatarDataHora(chamado.encerradoEm)}</dd>
                </div>
              )}
            </dl>
          </section>
        </aside>
      </div>

      <DialogoConfirmacao
        aberto={confirmando}
        titulo="Encerrar este chamado?"
        descricao="Depois de encerrado, ninguém pode enviar novas mensagens. Se o problema voltar, será preciso abrir outro chamado."
        rotuloConfirmar="Encerrar chamado"
        processando={processando === 'encerrar'}
        aoConfirmar={() => void executar('encerrar')}
        aoCancelar={() => setConfirmando(false)}
      />
    </div>
  );
}
