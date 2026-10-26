import type { ReactNode } from 'react';
import { dividirProtocolo } from '../utils/status';

interface Props {
  protocolo: string;
  children?: ReactNode;
  tamanho?: 'normal' | 'grande';
  /** Anima a senha "saindo da impressora" (usado logo após abrir o chamado). */
  imprimir?: boolean;
  /** Cor que aparece pelos recortes do picote. */
  sobre?: 'fundo' | 'superficie';
  className?: string;
}

/** O protocolo do chamado desenhado como a senha impressa de um balcão de atendimento. */
export function SenhaProtocolo({
  protocolo,
  children,
  tamanho = 'normal',
  imprimir = false,
  sobre = 'fundo',
  className,
}: Props) {
  const { prefixo, numero } = dividirProtocolo(protocolo);
  const classes = ['senha', `senha--${tamanho}`, `senha--sobre-${sobre}`, imprimir && 'senha--imprimindo', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <div className="senha-canhoto">
        <span className="visualmente-oculto">Protocolo {protocolo}</span>
        <span className="senha-rotulo" aria-hidden="true">
          Protocolo
        </span>
        {prefixo && (
          <span className="senha-prefixo" aria-hidden="true">
            {prefixo}
          </span>
        )}
        <span className={numero.length > 6 ? 'senha-numero senha-numero--longo' : 'senha-numero'} aria-hidden="true">
          {numero}
        </span>
      </div>
      <div className="senha-corpo">{children}</div>
    </div>
  );
}
