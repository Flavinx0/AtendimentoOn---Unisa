import { LogoUnisa } from './LogoUnisa';

/** Logotipo: "atendimento" + o selo ON com o LED aceso, e o símbolo da Unisa como parceira. */
export function Marca({ tamanho = 'normal', parceiro = true }: { tamanho?: 'normal' | 'grande'; parceiro?: boolean }) {
  return (
    <span className={`marca marca--${tamanho}`}>
      <span className="marca-palavra">atendimento</span>
      <span className="marca-on">
        <span className="marca-led" aria-hidden="true" />
        ON
      </span>
      {parceiro && (
        <>
          <span className="marca-divisor" aria-hidden="true" />
          <span className="marca-parceiro">
            <span className="visualmente-oculto">em parceria com a </span>
            <LogoUnisa />
          </span>
        </>
      )}
    </span>
  );
}
