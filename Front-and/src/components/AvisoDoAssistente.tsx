import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUsuarioLogado } from '../auth/AuthContext';
import { avisoDoAssistentePendente, concluirAvisoDoAssistente } from '../auth/avisoDoAssistente';
import { IconeAssistente } from './Icones';

/**
 * A cada login de aluno ou funcionário, sugere tirar a dúvida com o assistente virtual antes de abrir
 * um chamado. Muitas dúvidas se resolvem na hora, e o assistente avisa quando o caso precisa da equipe.
 */
export function AvisoDoAssistente() {
  const usuario = useUsuarioLogado();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const solicitante = usuario.perfil === 'Aluno' || usuario.perfil === 'Funcionario';
  const [aberto, setAberto] = useState(() => solicitante && avisoDoAssistentePendente());
  const ref = useRef<HTMLDialogElement>(null);

  // Quem já está no assistente não precisa do aviso.
  useEffect(() => {
    if (aberto && pathname === '/assistente') {
      concluirAvisoDoAssistente();
      setAberto(false);
    }
  }, [aberto, pathname]);

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (aberto && !dialogo.open) dialogo.showModal();
    if (!aberto && dialogo.open) dialogo.close();
  }, [aberto]);

  function fechar() {
    concluirAvisoDoAssistente();
    setAberto(false);
  }

  function irParaOAssistente() {
    fechar();
    navigate('/assistente');
  }

  if (!solicitante) return null;

  return (
    <dialog
      ref={ref}
      className="dialogo dialogo--aviso"
      aria-labelledby="aviso-assistente-titulo"
      aria-describedby="aviso-assistente-texto"
      onCancel={(evento) => {
        evento.preventDefault();
        fechar();
      }}
    >
      <div className="dialogo-corpo">
        <span className="dialogo-icone" aria-hidden="true">
          <IconeAssistente tamanho={26} />
        </span>
        <h2 id="aviso-assistente-titulo">Antes de abrir um chamado, pergunte ao assistente</h2>
        <p id="aviso-assistente-texto">
          O assistente virtual responde na hora as dúvidas mais comuns, como boleto, senha do portal, declarações e
          empréstimos da biblioteca. Se o seu caso precisar de alguém da equipe, ele avisa e ajuda a abrir o chamado.
        </p>
        <div className="dialogo-acoes">
          <button type="button" className="botao botao--fantasma" onClick={fechar}>
            Agora não
          </button>
          <button type="button" className="botao botao--primario" autoFocus onClick={irParaOAssistente}>
            Perguntar ao assistente
          </button>
        </div>
      </div>
    </dialog>
  );
}
