import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth/AuthContext';
import { Alerta } from '../components/Alerta';
import { LayoutAutenticacao } from '../components/LayoutAutenticacao';
import type { DadosCadastro } from '../types';
import { mensagemDeErro } from '../utils/erros';
import { ROTULO_PERFIL } from '../utils/status';

const PERFIS: DadosCadastro['perfil'][] = ['Aluno', 'Funcionario'];
const SENHA_MINIMA = 6;

export function CadastroPage() {
  const { entrar } = useAuth();
  const navigate = useNavigate();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [perfil, setPerfil] = useState<DadosCadastro['perfil']>('Aluno');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);

    if (senha.length < SENHA_MINIMA) {
      setErro(`A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`);
      return;
    }
    if (senha !== confirmacao) {
      setErro('As senhas não conferem. Digite a mesma senha nos dois campos.');
      return;
    }

    setEnviando(true);
    try {
      await api.cadastrar({ nome: nome.trim(), email: email.trim(), senha, perfil });
    } catch (e) {
      setErro(mensagemDeErro(e));
      setEnviando(false);
      return;
    }

    try {
      await entrar(email, senha); // RotaPublica leva para o início
    } catch {
      navigate('/login', {
        replace: true,
        state: { email: email.trim(), mensagem: 'Conta criada. Entre com seu e-mail e senha.' },
      });
    }
  }

  return (
    <LayoutAutenticacao titulo="Criar conta" subtitulo="Para alunos e funcionários da Unisa.">
      {erro && <Alerta tipo="erro">{erro}</Alerta>}

      <form className="formulario" onSubmit={aoEnviar}>
        <div className="campo">
          <label htmlFor="nome">Nome completo</label>
          <input
            id="nome"
            className="entrada"
            autoComplete="name"
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </div>

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

        <fieldset className="campo">
          <legend>Você é</legend>
          <div className="opcoes-chip">
            {PERFIS.map((opcao) => (
              <label key={opcao} className="chip">
                <input
                  type="radio"
                  name="perfil"
                  value={opcao}
                  checked={perfil === opcao}
                  onChange={() => setPerfil(opcao)}
                />
                <span>{ROTULO_PERFIL[opcao]}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="campo">
          <label htmlFor="senha">Senha</label>
          <input
            id="senha"
            type="password"
            className="entrada"
            autoComplete="new-password"
            required
            minLength={SENHA_MINIMA}
            aria-describedby="senha-ajuda"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          <span id="senha-ajuda" className="campo-ajuda">
            Pelo menos {SENHA_MINIMA} caracteres.
          </span>
        </div>

        <div className="campo">
          <label htmlFor="confirmacao">Confirme a senha</label>
          <input
            id="confirmacao"
            type="password"
            className="entrada"
            autoComplete="new-password"
            required
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
          />
        </div>

        <button type="submit" className="botao botao--primario botao--bloco" disabled={enviando}>
          {enviando ? 'Criando conta…' : 'Criar conta'}
        </button>
      </form>

      <p className="auth-rodape">
        Já tem conta? <Link to="/login">Entrar</Link>
      </p>
    </LayoutAutenticacao>
  );
}
