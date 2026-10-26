import type { ReactNode } from 'react';
import { Marca } from './Marca';

/** Login e cadastro no estilo do Portal do Aluno da Unisa: fundo azul e um cartão branco no centro. */
export function LayoutAutenticacao({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
}) {
  return (
    <div className="auth">
      <main className="auth-cartao">
        <div className="auth-marca">
          <Marca tamanho="grande" />
        </div>
        <header className="auth-cabecalho">
          <h1>{titulo}</h1>
          {subtitulo && <p>{subtitulo}</p>}
        </header>
        {children}
      </main>
      <p className="auth-legenda">
        Atendimento para alunos e funcionários da Unisa: assistente virtual e chamados com protocolo.
      </p>
    </div>
  );
}
