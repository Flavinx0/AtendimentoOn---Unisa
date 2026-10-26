import { useEffect, useRef } from 'react';

interface Props {
  aberto: boolean;
  titulo: string;
  descricao: string;
  rotuloConfirmar: string;
  processando?: boolean;
  aoConfirmar: () => void;
  aoCancelar: () => void;
}

/** Usa o <dialog> nativo: foco preso, Esc fecha e o fundo fica inerte. */
export function DialogoConfirmacao({
  aberto,
  titulo,
  descricao,
  rotuloConfirmar,
  processando = false,
  aoConfirmar,
  aoCancelar,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (aberto && !dialogo.open) dialogo.showModal();
    if (!aberto && dialogo.open) dialogo.close();
  }, [aberto]);

  return (
    <dialog
      ref={ref}
      className="dialogo"
      aria-labelledby="dialogo-titulo"
      onCancel={(evento) => {
        evento.preventDefault();
        if (!processando) aoCancelar();
      }}
      onClick={(evento) => {
        if (evento.target === evento.currentTarget && !processando) aoCancelar();
      }}
    >
      <div className="dialogo-corpo">
        <h2 id="dialogo-titulo">{titulo}</h2>
        <p>{descricao}</p>
        <div className="dialogo-acoes">
          <button type="button" className="botao botao--fantasma" onClick={aoCancelar} disabled={processando}>
            Cancelar
          </button>
          <button type="button" className="botao botao--perigo" onClick={aoConfirmar} disabled={processando}>
            {processando ? 'Aguarde…' : rotuloConfirmar}
          </button>
        </div>
      </div>
    </dialog>
  );
}
