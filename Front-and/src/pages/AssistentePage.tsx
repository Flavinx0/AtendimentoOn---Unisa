import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useUsuarioLogado } from '../auth/AuthContext';
import { IconeEnviar } from '../components/Icones';
import { TextoFormatado } from '../components/TextoFormatado';
import { config } from '../config';
import type { MensagemAssistente } from '../types';
import { mensagemDeErro } from '../utils/erros';
import { gerarId } from '../utils/id';
import { primeiroNome, truncar } from '../utils/texto';

interface ItemConversa {
  id: string;
  papel: 'usuario' | 'assistente';
  conteudo: string;
  escalar?: boolean;
  erro?: boolean;
}

const SUGESTOES = [
  'Como emito a 2ª via do boleto?',
  'Esqueci a senha do portal',
  'Preciso de uma declaração de matrícula',
  'Quero falar com um atendente',
];

const LIMITE_HISTORICO = 20;

const chaveConversa = (usuarioId: string) => `atendimento-on:conversa:${usuarioId}`;

function carregarConversa(usuarioId: string): ItemConversa[] {
  try {
    const salvo = sessionStorage.getItem(chaveConversa(usuarioId));
    return salvo ? (JSON.parse(salvo) as ItemConversa[]) : [];
  } catch {
    return [];
  }
}

function AvatarAssistente() {
  return (
    <span className="avatar-assistente" aria-hidden="true">
      <span className="marca-led" />
    </span>
  );
}

export function AssistentePage() {
  const usuario = useUsuarioLogado();
  const navigate = useNavigate();
  const location = useLocation();
  const [mensagens, setMensagens] = useState<ItemConversa[]>(() => carregarConversa(usuario.id));
  const [entrada, setEntrada] = useState('');
  const [pensando, setPensando] = useState(false);
  const listaRef = useRef<HTMLDivElement>(null);
  const entradaRef = useRef<HTMLTextAreaElement>(null);
  const perguntaInicialEnviada = useRef(false);

  // Mantém a conversa ao trocar de página (some ao fechar a aba ou sair da conta).
  useEffect(() => {
    try {
      sessionStorage.setItem(chaveConversa(usuario.id), JSON.stringify(mensagens));
    } catch {
      // ignora
    }
  }, [mensagens, usuario.id]);

  useEffect(() => {
    const lista = listaRef.current;
    if (lista) lista.scrollTop = lista.scrollHeight;
  }, [mensagens, pensando]);

  async function enviar(textoDigitado: string) {
    const texto = textoDigitado.trim();
    if (!texto || pensando) return;

    const historico: MensagemAssistente[] = mensagens
      .filter((m) => !m.erro)
      .slice(-LIMITE_HISTORICO)
      .map(({ papel, conteudo }) => ({ papel, conteudo }));

    setMensagens((atual) => [...atual, { id: gerarId(), papel: 'usuario', conteudo: texto }]);
    setEntrada('');
    setPensando(true);

    try {
      const resposta = await api.perguntarAoAssistente(texto, historico);
      setMensagens((atual) => [
        ...atual,
        { id: gerarId(), papel: 'assistente', conteudo: resposta.resposta, escalar: resposta.escalar },
      ]);
    } catch (e) {
      setMensagens((atual) => [
        ...atual,
        { id: gerarId(), papel: 'assistente', conteudo: mensagemDeErro(e), erro: true },
      ]);
    } finally {
      setPensando(false);
      if (window.matchMedia?.('(pointer: fine)').matches) entradaRef.current?.focus();
    }
  }

  // Pergunta digitada na tela inicial chega pelo state da navegação.
  useEffect(() => {
    const pergunta = (location.state as { pergunta?: string } | null)?.pergunta;
    if (!pergunta || perguntaInicialEnviada.current) return;
    perguntaInicialEnviada.current = true;
    navigate(location.pathname, { replace: true, state: null });
    void enviar(pergunta);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function abrirChamado() {
    const validas = mensagens.filter((m) => !m.erro);
    const primeiraPergunta = validas.find((m) => m.papel === 'usuario');
    const conversa = validas
      .map((m) => `${m.papel === 'usuario' ? 'Eu' : 'Assistente'}: ${m.conteudo.replace(/\*\*/g, '')}`)
      .join('\n\n');
    navigate('/chamados/novo', {
      state: validas.length
        ? {
            origem: 'assistente',
            titulo: primeiraPergunta ? truncar(primeiraPergunta.conteudo, 100) : '',
            descricao: `Conversa com o assistente virtual:\n\n${conversa}`,
          }
        : null,
    });
  }

  function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    void enviar(entrada);
  }

  const vazia = mensagens.length === 0;

  return (
    <section className="chat" aria-labelledby="titulo-assistente">
      <header className="chat-cabecalho">
        <div className="chat-identidade">
          <AvatarAssistente />
          <div>
            <h1 id="titulo-assistente">Assistente virtual</h1>
            <p>
              {config.usarMock
                ? 'Modo demonstração: respostas simuladas, sem chamar o Gemini.'
                : 'Respostas automáticas geradas pelo Gemini.'}
            </p>
          </div>
        </div>
        <div className="chat-acoes">
          {!vazia && (
            <button
              type="button"
              className="botao botao--fantasma botao--pequeno"
              onClick={() => setMensagens([])}
              disabled={pensando}
            >
              Nova conversa
            </button>
          )}
          <button type="button" className="botao botao--secundario botao--pequeno" onClick={abrirChamado}>
            Abrir chamado
          </button>
        </div>
      </header>

      <div className="chat-mensagens" ref={listaRef} role="log" aria-live="polite" aria-busy={pensando}>
        {vazia ? (
          <div className="chat-boas-vindas">
            <h2>Olá, {primeiroNome(usuario.nome)}. Qual é a sua dúvida?</h2>
            <p className="texto-suave">
              Respondo perguntas frequentes sobre os serviços da Unisa. Quando o assunto precisar de uma pessoa,
              ajudo você a abrir um chamado com a conversa já resumida.
            </p>
            <div className="sugestoes">
              {SUGESTOES.map((sugestao) => (
                <button key={sugestao} type="button" className="sugestao" onClick={() => void enviar(sugestao)}>
                  {sugestao}
                </button>
              ))}
            </div>
          </div>
        ) : (
          mensagens.map((m) =>
            m.papel === 'usuario' ? (
              <div key={m.id} className="balao balao--usuario">
                {m.conteudo}
              </div>
            ) : (
              <div key={m.id} className="resposta">
                <div className="linha-assistente">
                  <AvatarAssistente />
                  <div className={m.erro ? 'balao balao--assistente balao--erro' : 'balao balao--assistente'}>
                    <TextoFormatado texto={m.conteudo} />
                  </div>
                </div>
                {m.escalar && (
                  <div className="escalar">
                    <p>Esse assunto precisa de alguém da equipe. Abra um chamado e a conversa vai junto.</p>
                    <button type="button" className="botao botao--primario botao--pequeno" onClick={abrirChamado}>
                      Abrir chamado com esta conversa
                    </button>
                  </div>
                )}
              </div>
            ),
          )
        )}

        {pensando && (
          <div className="linha-assistente">
            <AvatarAssistente />
            <div className="balao balao--assistente digitando">
              <span aria-hidden="true" />
              <span aria-hidden="true" />
              <span aria-hidden="true" />
              <span className="visualmente-oculto">O assistente está escrevendo</span>
            </div>
          </div>
        )}
      </div>

      <form className="chat-composer" onSubmit={aoEnviar}>
        <label htmlFor="mensagem-assistente" className="visualmente-oculto">
          Mensagem para o assistente
        </label>
        <textarea
          id="mensagem-assistente"
          ref={entradaRef}
          className="entrada"
          rows={Math.min(5, Math.max(1, entrada.split('\n').length))}
          maxLength={2000}
          placeholder="Escreva sua dúvida"
          value={entrada}
          onChange={(e) => setEntrada(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              void enviar(entrada);
            }
          }}
        />
        <button
          type="submit"
          className="botao botao--primario botao--icone"
          disabled={pensando || !entrada.trim()}
          aria-label="Enviar mensagem"
        >
          <IconeEnviar tamanho={18} />
        </button>
      </form>
    </section>
  );
}
