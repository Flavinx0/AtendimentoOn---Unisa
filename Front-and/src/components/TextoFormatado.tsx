import { Fragment } from 'react';

/**
 * Mostra quebras de linha, listas com "- " e trechos em **negrito**,
 * formatos comuns nas respostas do Gemini, sem injetar HTML.
 * O elemento pai precisa de `white-space: pre-wrap`.
 */
export function TextoFormatado({ texto }: { texto: string }) {
  const linhas = texto.replace(/\r\n/g, '\n').split('\n');
  return (
    <>
      {linhas.map((linha, i) => {
        const item = /^\s*[*-]\s+/.test(linha);
        const conteudo = item ? linha.replace(/^\s*[*-]\s+/, '') : linha;
        const partes = conteudo.split(/(\*\*[^*]+\*\*)/g);
        return (
          <Fragment key={i}>
            {item && '• '}
            {partes.map((parte, j) =>
              parte.length > 4 && parte.startsWith('**') && parte.endsWith('**') ? (
                <strong key={j}>{parte.slice(2, -2)}</strong>
              ) : (
                <Fragment key={j}>{parte}</Fragment>
              ),
            )}
            {i < linhas.length - 1 && '\n'}
          </Fragment>
        );
      })}
    </>
  );
}
