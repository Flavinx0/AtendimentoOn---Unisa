import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useUsuarioLogado } from '../auth/AuthContext';
import { Alerta } from '../components/Alerta';
import { Carregando } from '../components/Carregando';
import { EstadoVazio } from '../components/EstadoVazio';
import { IconeChamar } from '../components/Icones';
import { ItemChamado } from '../components/ItemChamado';
import { FaixaEquipe } from '../components/SeloEquipe';
import { SenhaProtocolo } from '../components/SenhaProtocolo';
import { StatusBadge } from '../components/StatusBadge';
import { useAsync } from '../hooks/useAsync';
import type { Chamado } from '../types';
import { ordenarAntigos, ordenarRecentes } from '../utils/chamados';
import { tempoRelativo } from '../utils/datas';
import { ehAtendimento } from '../utils/equipes';
import { mensagemDeErro } from '../utils/erros';
import { primeiroNome } from '../utils/texto';

const SUGESTOES_ASSISTENTE = [
  'Como emito a 2ª via do boleto?',
  'Esqueci a senha do portal',
  'Preciso de uma declaração de matrícula',
];

export function InicioPage() {
  const usuario = useUsuarioLogado();
  // O administrador também é atendente do Suporte de TI: o início dele é a fila do TI.
  // As outras equipes ficam numa tela separada ("Outras equipes").
  return ehAtendimento(usuario.perfil) ? <InicioAtendente /> : <InicioSolicitante />;
}

function BotaoTentarDeNovo({ aoClicar }: { aoClicar: () => void }) {
  return (
    <button type="button" className="botao botao--secundario botao--pequeno" onClick={aoClicar}>
      Tentar de novo
    </button>
  );
}

/* ------------------------------ Aluno e funcionário ------------------------------ */

function InicioSolicitante() {
  const usuario = useUsuarioLogado();
  const navigate = useNavigate();
  const [pergunta, setPergunta] = useState('');
  const { dados, erro, carregando, recarregar } = useAsync(() => api.listarChamados(), []);

  const recentes = useMemo(() => ordenarRecentes(dados ?? []), [dados]);
  const emDestaque =
    recentes.find((c) => c.status === 'AguardandoUsuario') ?? recentes.find((c) => c.status !== 'Encerrado');

  function perguntar(texto: string) {
    const limpo = texto.trim();
    if (limpo) navigate('/assistente', { state: { pergunta: limpo } });
  }

  function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    perguntar(pergunta);
  }

  return (
    <div className="pagina">
      <header className="pagina-cabecalho">
        <div>
          <h1>Olá, {primeiroNome(usuario.nome)}.</h1>
          <p>Tire uma dúvida com o assistente ou acompanhe seus chamados.</p>
        </div>
      </header>

      <div className="inicio-grade">
        <section className="bloco pergunta-rapida" aria-labelledby="titulo-pergunta">
          <h2 id="titulo-pergunta">Como podemos ajudar?</h2>
          <p className="texto-suave">
            O assistente virtual responde na hora. Se ele não resolver, você abre um chamado com a conversa já
            resumida.
          </p>
          <form className="pergunta-form" onSubmit={aoEnviar}>
            <label htmlFor="pergunta" className="visualmente-oculto">
              Sua dúvida
            </label>
            <input
              id="pergunta"
              className="entrada"
              placeholder="Ex.: o boleto de outubro não aparece no portal"
              value={pergunta}
              onChange={(e) => setPergunta(e.target.value)}
            />
            <button type="submit" className="botao botao--primario" disabled={!pergunta.trim()}>
              Perguntar
            </button>
          </form>
          <div className="sugestoes">
            {SUGESTOES_ASSISTENTE.map((sugestao) => (
              <button key={sugestao} type="button" className="sugestao" onClick={() => perguntar(sugestao)}>
                {sugestao}
              </button>
            ))}
          </div>
          <p className="texto-suave texto-pequeno">
            Prefere falar direto com a equipe? <Link to="/chamados/novo">Abrir chamado</Link>
          </p>
        </section>

        {!erro && (
          <section className="destaque" aria-label="Chamado em destaque">
            {carregando ? (
              <Carregando />
            ) : emDestaque ? (
              <DestaqueChamado chamado={emDestaque} usuarioId={usuario.id} />
            ) : (
              <EstadoVazio titulo="Nenhum chamado em andamento">
                Quando você abrir um chamado, o protocolo e as respostas da equipe aparecem aqui.
              </EstadoVazio>
            )}
          </section>
        )}
      </div>

      <section className="secao" aria-labelledby="titulo-recentes">
        <div className="secao-cabecalho">
          <h2 id="titulo-recentes">Seus chamados</h2>
          {recentes.length > 5 && (
            <Link to="/chamados" className="link-discreto">
              Ver todos
            </Link>
          )}
        </div>
        {erro ? (
          <Alerta tipo="erro" acao={<BotaoTentarDeNovo aoClicar={() => void recarregar()} />}>
            {mensagemDeErro(erro)}
          </Alerta>
        ) : carregando ? (
          <Carregando texto="Carregando chamados…" />
        ) : recentes.length === 0 ? (
          <EstadoVazio
            titulo="Você ainda não abriu chamados"
            acao={
              <Link to="/chamados/novo" className="botao botao--secundario botao--pequeno">
                Abrir chamado
              </Link>
            }
          />
        ) : (
          <ul className="lista-chamados">
            {recentes.slice(0, 5).map((chamado) => (
              <ItemChamado key={chamado.id} chamado={chamado} usuarioId={usuario.id} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function DestaqueChamado({ chamado, usuarioId }: { chamado: Chamado; usuarioId: string }) {
  const aguardandoVoce = chamado.status === 'AguardandoUsuario' && chamado.solicitanteId === usuarioId;
  return (
    <div className="destaque-conteudo">
      <h2 className="destaque-titulo">{aguardandoVoce ? 'A equipe respondeu você' : 'Em andamento'}</h2>
      <SenhaProtocolo protocolo={chamado.protocolo}>
        <span className="senha-titulo">{chamado.titulo}</span>
        <span className="senha-linha">
          <StatusBadge status={chamado.status} ehSolicitante={chamado.solicitanteId === usuarioId} />
          <span>{chamado.cursoNome ?? chamado.categoriaNome}</span>
        </span>
      </SenhaProtocolo>
      <Link
        to={`/chamados/${encodeURIComponent(chamado.id)}`}
        className={aguardandoVoce ? 'botao botao--primario' : 'botao botao--secundario'}
      >
        {aguardandoVoce ? 'Responder' : 'Ver chamado'}
      </Link>
    </div>
  );
}

/* ------------------------------------ Atendente ------------------------------------ */

function InicioAtendente() {
  const usuario = useUsuarioLogado();
  const navigate = useNavigate();
  const { dados, erro, carregando, recarregar } = useAsync(() => api.listarChamados(), []);
  const [chamando, setChamando] = useState(false);
  const [erroChamar, setErroChamar] = useState<string | null>(null);

  const fila = useMemo(
    () =>
      ordenarAntigos(
        (dados ?? []).filter((c) => c.equipe === usuario.equipe && !c.atendenteId && c.status !== 'Encerrado'),
      ),
    [dados, usuario.equipe],
  );
  const comVoce = useMemo(
    () =>
      ordenarRecentes(
        (dados ?? []).filter(
          (c) => c.equipe === usuario.equipe && c.atendenteId === usuario.id && c.status !== 'Encerrado',
        ),
      ),
    [dados, usuario.id, usuario.equipe],
  );
  const proximo = fila[0];

  async function chamarProximo() {
    if (!proximo) return;
    setChamando(true);
    setErroChamar(null);
    try {
      await api.assumirChamado(proximo.id);
      navigate(`/chamados/${encodeURIComponent(proximo.id)}`);
    } catch (e) {
      setErroChamar(mensagemDeErro(e));
      setChamando(false);
      void recarregar(true);
    }
  }

  const resumoFila = carregando
    ? 'Carregando a fila…'
    : fila.length === 0
      ? 'Nenhum chamado esperando por um atendente.'
      : fila.length === 1
        ? '1 chamado esperando por um atendente.'
        : `${fila.length} chamados esperando por um atendente.`;

  return (
    <div className="pagina">
      <header className="pagina-cabecalho">
        <div>
          <h1>Olá, {primeiroNome(usuario.nome)}.</h1>
          <p>{resumoFila}</p>
        </div>
      </header>

      {usuario.equipe && <FaixaEquipe equipe={usuario.equipe} cursos={usuario.cursos} />}

      {erro ? (
        <Alerta tipo="erro" acao={<BotaoTentarDeNovo aoClicar={() => void recarregar()} />}>
          {mensagemDeErro(erro)}
        </Alerta>
      ) : (
        <div className="inicio-grade">
          <section className="bloco chamada" aria-labelledby="titulo-proximo">
            <div className="secao-cabecalho">
              <h2 id="titulo-proximo">Próximo da fila</h2>
              {fila.length > 1 && (
                <Link to="/chamados?aba=fila" className="link-discreto">
                  Ver fila completa
                </Link>
              )}
            </div>
            {carregando ? (
              <Carregando />
            ) : proximo ? (
              <>
                <SenhaProtocolo protocolo={proximo.protocolo} sobre="superficie">
                  <span className="senha-titulo">{proximo.titulo}</span>
                  <span className="senha-linha">
                    <span>{proximo.cursoNome ?? proximo.categoriaNome}</span>
                    <span>{proximo.solicitanteNome}</span>
                    <span>Aberto {tempoRelativo(proximo.criadoEm)}</span>
                  </span>
                </SenhaProtocolo>
                {erroChamar && <Alerta tipo="erro">{erroChamar}</Alerta>}
                <div className="chamada-acoes">
                  <button type="button" className="botao botao--chamar" onClick={chamarProximo} disabled={chamando}>
                    <IconeChamar tamanho={18} />
                    {chamando ? 'Chamando…' : 'Chamar próximo'}
                  </button>
                  <Link to={`/chamados/${encodeURIComponent(proximo.id)}`} className="botao botao--fantasma">
                    Ver detalhes
                  </Link>
                </div>
                <p className="texto-suave texto-pequeno">
                  Chamar o próximo coloca o chamado sob sua responsabilidade e abre a conversa.
                </p>
              </>
            ) : (
              <EstadoVazio titulo="Fila vazia">Novos chamados aparecem aqui assim que forem abertos.</EstadoVazio>
            )}
          </section>

          <section className="secao" aria-labelledby="titulo-com-voce">
            <div className="secao-cabecalho">
              <h2 id="titulo-com-voce">Com você</h2>
              {comVoce.length > 5 && (
                <Link to="/chamados?aba=meus" className="link-discreto">
                  Ver todos
                </Link>
              )}
            </div>
            {carregando ? (
              <Carregando />
            ) : comVoce.length === 0 ? (
              <EstadoVazio titulo="Nenhum atendimento em andamento">
                Os chamados que você assumir aparecem aqui.
              </EstadoVazio>
            ) : (
              <ul className="lista-chamados lista-chamados--compacta">
                {comVoce.slice(0, 5).map((chamado) => (
                  <ItemChamado key={chamado.id} chamado={chamado} usuarioId={usuario.id} mostrarSolicitante />
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
