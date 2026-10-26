import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Alerta } from '../components/Alerta';
import { Carregando } from '../components/Carregando';
import { IconeVoltar } from '../components/Icones';
import { SeletorDeCurso } from '../components/SeletorDeCurso';
import { useAsync } from '../hooks/useAsync';
import { nomeCompletoDoCurso } from '../utils/cursos';
import { EQUIPES } from '../utils/equipes';
import { mensagemDeErro } from '../utils/erros';

interface Preenchimento {
  titulo?: string;
  descricao?: string;
  origem?: 'assistente';
}

const LIMITE_TITULO = 120;
const LIMITE_DESCRICAO = 4000;

export function NovoChamadoPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [preenchido] = useState(() => (location.state ?? {}) as Preenchimento);
  const categorias = useAsync(() => api.listarCategorias(), []);
  const cursos = useAsync(() => api.listarCursos(), []);

  const [titulo, setTitulo] = useState(() => (preenchido.titulo ?? '').slice(0, LIMITE_TITULO));
  const [descricao, setDescricao] = useState(() => (preenchido.descricao ?? '').slice(0, LIMITE_DESCRICAO));
  const [categoriaId, setCategoriaId] = useState('');
  const [cursoId, setCursoId] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!categoriaId) {
      setErro('Escolha a categoria que mais combina com o seu pedido.');
      return;
    }
    if (paraCoordenacao && !cursoId) {
      setErro('Escolha o seu curso para o chamado chegar à coordenação certa.');
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      const criado = await api.abrirChamado({
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        categoriaId,
        cursoId: paraCoordenacao ? cursoId : undefined,
      });
      if (criado.id) {
        navigate(`/chamados/${encodeURIComponent(criado.id)}`, { replace: true, state: { criado: true } });
      } else {
        navigate('/chamados', { replace: true });
      }
    } catch (e) {
      setErro(mensagemDeErro(e));
      setEnviando(false);
    }
  }

  const veioDoAssistente = preenchido.origem === 'assistente';
  const categoriaEscolhida = (categorias.dados ?? []).find((c) => c.id === categoriaId);
  const equipeQueRecebe = categoriaEscolhida?.equipe ?? null;
  const paraCoordenacao = equipeQueRecebe === 'Coordenacao';
  const cursoEscolhido = (cursos.dados ?? []).find((c) => c.id === cursoId);

  return (
    <div className="pagina">
      <Link to="/chamados" className="voltar">
        <IconeVoltar tamanho={18} />
        Meus chamados
      </Link>

      <header className="pagina-cabecalho">
        <div>
          <h1>Abrir chamado</h1>
          <p>Conte o que você precisa. A equipe de atendimento responde por aqui, e você acompanha pelo protocolo.</p>
        </div>
      </header>

      <div className={veioDoAssistente ? 'novo-grade novo-grade--unica' : 'novo-grade'}>
        <form className="bloco formulario" onSubmit={aoEnviar}>
          {veioDoAssistente && (
            <Alerta tipo="info">Trouxemos a sua conversa com o assistente. Revise o texto antes de enviar.</Alerta>
          )}
          {erro && <Alerta tipo="erro">{erro}</Alerta>}

          <div className="campo">
            <label htmlFor="titulo">Assunto</label>
            <input
              id="titulo"
              className="entrada"
              required
              maxLength={LIMITE_TITULO}
              placeholder="Ex.: Boleto de outubro com valor diferente"
              aria-describedby="titulo-ajuda"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
            <span id="titulo-ajuda" className="campo-rodape">
              <span>Resuma o pedido em uma frase.</span>
              <span>
                {titulo.length}/{LIMITE_TITULO}
              </span>
            </span>
          </div>

          <fieldset className="campo">
            <legend>Categoria</legend>
            {categorias.carregando ? (
              <Carregando texto="Carregando categorias…" />
            ) : categorias.erro ? (
              <Alerta
                tipo="erro"
                acao={
                  <button
                    type="button"
                    className="botao botao--secundario botao--pequeno"
                    onClick={() => void categorias.recarregar()}
                  >
                    Tentar de novo
                  </button>
                }
              >
                {mensagemDeErro(categorias.erro)}
              </Alerta>
            ) : (
              <div className="opcoes-chip">
                {(categorias.dados ?? []).map((c) => (
                  <label key={c.id} className="chip">
                    <input
                      type="radio"
                      name="categoria"
                      value={c.id}
                      checked={categoriaId === c.id}
                      onChange={() => setCategoriaId(c.id)}
                    />
                    <span>{c.nome}</span>
                  </label>
                ))}
              </div>
            )}
            {equipeQueRecebe && !paraCoordenacao && (
              <span className="campo-ajuda" aria-live="polite">
                Este chamado vai para a equipe <strong>{EQUIPES[equipeQueRecebe].nome}</strong>.
              </span>
            )}
          </fieldset>

          {paraCoordenacao && (
            <div className="campo">
              <label htmlFor="curso">Seu curso</label>
              {cursos.carregando ? (
                <Carregando texto="Carregando cursos…" />
              ) : cursos.erro ? (
                <Alerta
                  tipo="erro"
                  acao={
                    <button type="button" className="botao botao--secundario botao--pequeno" onClick={() => void cursos.recarregar()}>
                      Tentar de novo
                    </button>
                  }
                >
                  {mensagemDeErro(cursos.erro)}
                </Alerta>
              ) : (
                <SeletorDeCurso
                  id="curso"
                  cursos={cursos.dados ?? []}
                  valor={cursoId}
                  aoMudar={setCursoId}
                  descricaoId="curso-ajuda"
                />
              )}
              <span id="curso-ajuda" className="campo-ajuda" aria-live="polite">
                {cursoEscolhido ? (
                  <>
                    Este chamado vai para a coordenação de <strong>{nomeCompletoDoCurso(cursoEscolhido)}</strong>.
                  </>
                ) : (
                  'O chamado vai direto para quem coordena o curso. Os cursos estão separados por modalidade.'
                )}
              </span>
            </div>
          )}

          <div className="campo">
            <label htmlFor="descricao">Descrição</label>
            <textarea
              id="descricao"
              className="entrada"
              required
              rows={veioDoAssistente ? 12 : 8}
              maxLength={LIMITE_DESCRICAO}
              placeholder="O que aconteceu, desde quando e o que você já tentou."
              aria-describedby="descricao-ajuda"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
            <span id="descricao-ajuda" className="campo-rodape">
              <span>Detalhes ajudam a equipe a resolver mais rápido.</span>
              <span>
                {descricao.length}/{LIMITE_DESCRICAO}
              </span>
            </span>
          </div>

          <div className="form-acoes">
            <button type="submit" className="botao botao--primario" disabled={enviando}>
              {enviando ? 'Abrindo chamado…' : 'Abrir chamado'}
            </button>
            <Link to="/chamados" className="botao botao--fantasma">
              Cancelar
            </Link>
          </div>
        </form>

        {!veioDoAssistente && (
          <aside className="painel-lateral">
            <h2>Antes de abrir</h2>
            <p className="texto-suave">
              Dúvidas comuns, como boleto, senha do portal e declarações, o assistente virtual responde na hora.
            </p>
            <Link to="/assistente" className="botao botao--secundario">
              Perguntar ao assistente
            </Link>
          </aside>
        )}
      </div>
    </div>
  );
}
