import { useState } from 'react';

/*
 * Símbolo da Unisa ao lado da marca do Atendimento ON.
 * Use o arquivo oficial da universidade, salvo em public/ com um destes nomes.
 * O primeiro que existir é usado; sem nenhum deles, aparece só o nome "Unisa".
 */
const ARQUIVOS = ['/logo-unisa.svg', '/logo-unisa.png'];

export function LogoUnisa() {
  const [tentativa, setTentativa] = useState(0);

  if (tentativa >= ARQUIVOS.length) {
    return <span className="parceiro-nome">Unisa</span>;
  }

  return (
    <img
      className="parceiro-logo"
      src={ARQUIVOS[tentativa]}
      alt="Unisa"
      onError={() => setTentativa((atual) => atual + 1)}
    />
  );
}
