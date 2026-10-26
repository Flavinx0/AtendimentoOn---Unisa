import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth, useUsuarioLogado } from '../auth/AuthContext';
import { Alerta } from '../components/Alerta';
import { LayoutAutenticacao } from '../components/LayoutAutenticacao';
import { mensagemDeErro } from '../utils/erros';
import { primeiroNome } from '../utils/texto';

const TAMANHO_MINIMO = 6;

/**
 * Troca de senha. No primeiro acesso de um atendente é obrigatória: a senha inicial foi criada pelo
 * administrador, e até a pessoa escolher a dela o resto do sistema fica fechado.
 */
export function TrocarSenhaPage() {
  const usuario = useUsuarioLogado();
  const { atualizarSessao, sair } = useAuth();
  const navigate = useNavigate();
  const [obrigatoria] = useState(usuario.precisaTrocarSenha);

  const [atual, setAtual] = useState('');
  const [nova, setNova] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [trocada, setTrocada] = useState(false);

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);
    if (nova.length < TAMANHO_MINIMO) {
      setErro(`A nova senha precisa ter pelo menos ${TAMANHO_MINIMO} caracteres.`);
      return;
    }
    if (nova !== confirmacao) {
      setErro('A confirmação está diferente da nova senha.');
      return;
    }
    if (nova === atual) {
      setErro('Escolha uma senha diferente da atual.');
      return;
    }
    setEnviando(true);
    try {
      atualizarSessao(await api.trocarSenha(atual, nova));
      if (obrigatoria) {
        navigate('/', { replace: true });
        return;
      }
      setTrocada(true);
      setAtual('');
      setNova('');
      setConfirmacao('');
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setEnviando(false);
    }
  }

  function aoSair() {
    sair();
    navigate('/login', { replace: true });
  }

  return (
    <LayoutAutenticacao
      titulo={obrigatoria ? 'Crie a sua senha' : 'Trocar senha'}
      subtitulo={
        obrigatoria
          ? `Olá, ${primeiroNome(usuario.nome)}. Você entrou com a senha inicial que o administrador criou. Antes de continuar, escolha uma senha só sua.`
          : 'Confirme a senha atual e escolha a nova.'
      }
    >
      {erro && <Alerta tipo="erro">{erro}</Alerta>}
      {trocada && <Alerta tipo="sucesso">Senha trocada. No próximo login, use a senha nova.</Alerta>}

      <form className="formulario" onSubmit={aoEnviar}>
        <div className="campo">
          <label htmlFor="senha-atual">{obrigatoria ? 'Senha inicial' : 'Senha atual'}</label>
          <input
            id="senha-atual"
            type="password"
            className="entrada"
            autoComplete="current-password"
            required
            aria-describedby={obrigatoria ? 'senha-atual-ajuda' : undefined}
            value={atual}
            onChange={(e) => setAtual(e.target.value)}
          />
          {obrigatoria && (
            <span id="senha-atual-ajuda" className="campo-ajuda">
              A que o administrador passou para você.
            </span>
          )}
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
          {enviando ? 'Salvando…' : 'Salvar senha'}
        </button>
      </form>

      <p className="auth-rodape">
        {obrigatoria ? (
          <button type="button" className="botao-link" onClick={aoSair}>
            Sair e entrar depois
          </button>
        ) : (
          <Link to="/">Voltar ao início</Link>
        )}
      </p>
    </LayoutAutenticacao>
  );
}
