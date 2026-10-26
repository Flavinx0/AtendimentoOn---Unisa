import type { ReactNode } from 'react';
import { IconeAtencao, IconeCheck, IconeErro, IconeInfo } from './Icones';

type Tipo = 'erro' | 'sucesso' | 'aviso' | 'info';

const ICONES = { erro: IconeErro, sucesso: IconeCheck, aviso: IconeAtencao, info: IconeInfo };

export function Alerta({ tipo = 'info', children, acao }: { tipo?: Tipo; children: ReactNode; acao?: ReactNode }) {
  const Icone = ICONES[tipo];
  return (
    <div className={`alerta alerta--${tipo}`} role={tipo === 'erro' ? 'alert' : 'status'}>
      <span className="alerta-icone">
        <Icone tamanho={18} />
      </span>
      <div className="alerta-conteudo">
        <div>{children}</div>
        {acao && <div className="alerta-acao">{acao}</div>}
      </div>
    </div>
  );
}
