import { Link } from 'react-router-dom';

export function NaoEncontradoPage() {
  return (
    <div className="pagina nao-encontrado">
      <h1>Página não encontrada</h1>
      <p className="texto-suave">O endereço pode estar errado ou a página não existe mais.</p>
      <Link to="/" className="botao botao--secundario">
        Voltar para o início
      </Link>
    </div>
  );
}
