import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useUsuarioLogado } from '../auth/AuthContext';
import { config } from '../config';
import { restaurarDadosDemonstracao } from '../api/mock/mockApi';
import { EQUIPES } from '../utils/equipes';
import { ROTULO_PERFIL } from '../utils/status';
import { primeiroNome } from '../utils/texto';
import { Avatar } from './Avatar';
import { IconeCadeado, IconeRestaurar, IconeSair } from './Icones';

export function MenuUsuario() {
  const usuario = useUsuarioLogado();
  const { sair } = useAuth();
  const navigate = useNavigate();
  const [aberto, setAberto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const aoClicarFora = (evento: MouseEvent) => {
      if (raiz.current && !raiz.current.contains(evento.target as Node)) setAberto(false);
    };
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') setAberto(false);
    };
    document.addEventListener('mousedown', aoClicarFora);
    document.addEventListener('keydown', aoTeclar);
    return () => {
      document.removeEventListener('mousedown', aoClicarFora);
      document.removeEventListener('keydown', aoTeclar);
    };
  }, [aberto]);

  function aoSair() {
    sair();
    navigate('/login', { replace: true });
  }

  function aoRestaurar() {
    restaurarDadosDemonstracao();
    window.location.reload();
  }

  return (
    <div className="menu-usuario" ref={raiz}>
      <button
        type="button"
        className="menu-usuario-botao"
        aria-expanded={aberto}
        aria-controls="menu-usuario"
        onClick={() => setAberto((valor) => !valor)}
      >
        <Avatar nome={usuario.nome} />
        <span className="menu-usuario-nome">{primeiroNome(usuario.nome)}</span>
        <span className="visualmente-oculto">Abrir menu da conta</span>
      </button>

      {aberto && (
        <div className="menu-suspenso" id="menu-usuario">
          <div className="menu-identidade">
            <strong>{usuario.nome}</strong>
            <span>{usuario.email}</span>
            <span className="menu-perfil">
              {ROTULO_PERFIL[usuario.perfil]}
              {usuario.equipe && ` ${EQUIPES[usuario.equipe].artigo} ${EQUIPES[usuario.equipe].nome}`}
            </span>
          </div>
          {config.usarMock && (
            <div className="menu-demo">
              <p>Modo demonstração: os dados ficam só neste navegador.</p>
              <button type="button" className="menu-item" onClick={aoRestaurar}>
                <IconeRestaurar tamanho={18} />
                Restaurar dados de exemplo
              </button>
            </div>
          )}
          <button
            type="button"
            className="menu-item"
            onClick={() => {
              setAberto(false);
              navigate('/trocar-senha');
            }}
          >
            <IconeCadeado tamanho={18} />
            Trocar senha
          </button>
          <button type="button" className="menu-item" onClick={aoSair}>
            <IconeSair tamanho={18} />
            Sair
          </button>
        </div>
      )}
    </div>
  );
}
