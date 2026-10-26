import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CONTAS_DEMONSTRACAO } from '../api/mock/mockApi';
import { useAuth } from '../auth/AuthContext';
import { Alerta } from '../components/Alerta';
import { LayoutAutenticacao } from '../components/LayoutAutenticacao';
import { config } from '../config';
import { mensagemDeErro } from '../utils/erros';

interface EstadoNavegacao {
  email?: string;
  mensagem?: string;
}

export function LoginPage() {
  const { entrar, sessaoExpirou } = useAuth();
  const location = useLocation();
  const estado = (location.state ?? {}) as EstadoNavegacao;

  const [email, setEmail] = useState(estado.email ?? '');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await entrar(email, senha);
      // RotaPublica leva para o início (ou para a página que pediu o login).
    } catch (e) {
      setErro(mensagemDeErro(e));
      setEnviando(false);
    }
  }

  return (
    <LayoutAutenticacao titulo="Entrar" subtitulo="Use o e-mail e a senha da sua conta no Atendimento ON.">
      {sessaoExpirou && <Alerta tipo="aviso">Sua sessão expirou. Entre de novo para continuar.</Alerta>}
      {estado.mensagem && <Alerta tipo="sucesso">{estado.mensagem}</Alerta>}
      {erro && <Alerta tipo="erro">{erro}</Alerta>}

      <form className="formulario" onSubmit={aoEnviar}>
        <div className="campo">
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            className="entrada"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="campo">
          <label htmlFor="senha">Senha</label>
          <input
            id="senha"
            type="password"
            className="entrada"
            autoComplete="current-password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          <Link to="/esqueci-senha" state={{ email: email.trim() }} className="link-auxiliar">
            Esqueci minha senha
          </Link>
        </div>
        <button type="submit" className="botao botao--primario botao--bloco" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <p className="auth-rodape">
        Ainda não tem conta? <Link to="/cadastro">Criar conta</Link>
      </p>

      {config.usarMock && (
        <div className="demo">
          <p>Modo demonstração. Escolha uma conta de exemplo para preencher o login (senha 123456):</p>
          <div className="demo-contas">
            {CONTAS_DEMONSTRACAO.map((conta) => (
              <button
                key={conta.email}
                type="button"
                className="botao botao--secundario botao--pequeno"
                onClick={() => {
                  setEmail(conta.email);
                  setSenha(conta.senha);
                }}
              >
                {conta.rotulo}
              </button>
            ))}
          </div>
        </div>
      )}
    </LayoutAutenticacao>
  );
}
