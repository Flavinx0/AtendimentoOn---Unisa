import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Alerta } from '../components/Alerta';
import { LayoutAutenticacao } from '../components/LayoutAutenticacao';
import { mensagemDeErro } from '../utils/erros';

const TAMANHO_MINIMO = 6;
const ESPERA_PARA_REENVIAR = 60; // segundos, o mesmo intervalo que a API exige entre dois códigos

/** "Esqueci minha senha": o código de 6 números chega por e-mail e permite criar uma senha nova. */
export function EsqueciSenhaPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [etapa, setEtapa] = useState<'email' | 'codigo'>('email');
  const [email, setEmail] = useState(() => ((location.state ?? {}) as { email?: string }).email ?? '');
  const [codigo, setCodigo] = useState('');
  const [nova, setNova] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [codigoDeDemonstracao, setCodigoDeDemonstracao] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [espera, setEspera] = useState(0);

  useEffect(() => {
    if (espera <= 0) return;
    const temporizador = setTimeout(() => setEspera((s) => s - 1), 1000);
    return () => clearTimeout(temporizador);
  }, [espera]);

  async function pedirCodigo(reenvio: boolean) {
    setErro(null);
    setAviso(null);
    setEnviando(true);
    try {
      const resposta = await api.pedirCodigoDeRecuperacao(email.trim());
      setCodigoDeDemonstracao(resposta.codigoDeDemonstracao ?? null);
      setEtapa('codigo');
      setEspera(ESPERA_PARA_REENVIAR);
      if (reenvio) setAviso('Pedimos outro código. Use sempre o último e-mail que chegar.');
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setEnviando(false);
    }
  }

  async function aoEnviarEmail(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    await pedirCodigo(false);
  }

  async function aoCriarSenha(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);
    setAviso(null);
    if (!/^\d{6}$/.test(codigo)) {
      setErro('O código tem 6 números. Confira o e-mail.');
      return;
    }
    if (nova.length < TAMANHO_MINIMO) {
      setErro(`A nova senha precisa ter pelo menos ${TAMANHO_MINIMO} caracteres.`);
      return;
    }
    if (nova !== confirmacao) {
      setErro('A confirmação está diferente da nova senha.');
      return;
    }
    setEnviando(true);
    try {
      await api.redefinirSenha(email.trim(), codigo, nova);
      navigate('/login', {
        replace: true,
        state: { email: email.trim(), mensagem: 'Senha criada. Entre com a senha nova.' },
      });
    } catch (e) {
      setErro(mensagemDeErro(e));
      setEnviando(false);
    }
  }

  function usarOutroEmail() {
    setEtapa('email');
    setCodigo('');
    setErro(null);
    setAviso(null);
    setCodigoDeDemonstracao(null);
  }

  const minutos = Math.floor(espera / 60);
  const segundos = String(espera % 60).padStart(2, '0');

  return (
    <LayoutAutenticacao
      titulo="Esqueci minha senha"
      subtitulo={
        etapa === 'email'
          ? 'Informe o e-mail da sua conta. Vamos enviar um código para você criar uma senha nova.'
          : undefined
      }
    >
      {erro && <Alerta tipo="erro">{erro}</Alerta>}
      {aviso && <Alerta tipo="sucesso">{aviso}</Alerta>}

      {etapa === 'email' ? (
        <form className="formulario" onSubmit={aoEnviarEmail}>
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
          <button type="submit" className="botao botao--primario botao--bloco" disabled={enviando}>
            {enviando ? 'Enviando…' : 'Enviar código'}
          </button>
        </form>
      ) : (
        <form className="formulario" onSubmit={aoCriarSenha}>
          <p className="texto-suave">
            Se houver uma conta com <strong>{email.trim()}</strong>, enviamos um código de 6 números. Ele vale por 15
            minutos. Se não chegar, confira a caixa de spam.
          </p>
          {codigoDeDemonstracao && (
            <Alerta tipo="info">
              Modo demonstração: nenhum e-mail é enviado. O código é <strong>{codigoDeDemonstracao}</strong>.
            </Alerta>
          )}
          <div className="campo">
            <label htmlFor="codigo">Código</label>
            <input
              id="codigo"
              className="entrada entrada--codigo"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              maxLength={6}
              placeholder="000000"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
          </div>
          <div className="campo">
            <label htmlFor="senha-nova">Nova senha</label>
            <input
              id="senha-nova"
              type="password"
              className="entrada"
              autoComplete="new-password"
              required
              minLength={TAMANHO_MINIMO}
              aria-describedby="senha-nova-ajuda"
              value={nova}
              onChange={(e) => setNova(e.target.value)}
            />
            <span id="senha-nova-ajuda" className="campo-ajuda">
              Pelo menos {TAMANHO_MINIMO} caracteres.
            </span>
          </div>
          <div className="campo">
            <label htmlFor="senha-confirmacao">Confirmar nova senha</label>
            <input
              id="senha-confirmacao"
              type="password"
              className="entrada"
              autoComplete="new-password"
              required
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
            />
          </div>
          <button type="submit" className="botao botao--primario botao--bloco" disabled={enviando}>
            {enviando ? 'Salvando…' : 'Criar senha nova'}
          </button>
          <div className="acoes-secundarias">
            <button
              type="button"
              className="botao-link"
              disabled={espera > 0 || enviando}
              onClick={() => void pedirCodigo(true)}
            >
              {espera > 0 ? `Reenviar código em ${minutos}:${segundos}` : 'Reenviar código'}
            </button>
            <button type="button" className="botao-link" onClick={usarOutroEmail}>
              Usar outro e-mail
            </button>
          </div>
        </form>
      )}

      <p className="auth-rodape">
        Lembrou a senha? <Link to="/login">Voltar para o login</Link>
      </p>
    </LayoutAutenticacao>
  );
}
