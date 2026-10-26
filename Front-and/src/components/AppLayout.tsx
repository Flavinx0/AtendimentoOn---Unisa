import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useUsuarioLogado } from '../auth/AuthContext';
import { nomeDaFila } from '../utils/equipes';
import { AvisoDoAssistente } from './AvisoDoAssistente';
import { IconeAssistente, IconeCamadas, IconeChamados, IconeInicio, IconePessoas } from './Icones';
import { Marca } from './Marca';
import { MenuUsuario } from './MenuUsuario';

export function AppLayout() {
  const usuario = useUsuarioLogado();
  const { pathname } = useLocation();
  const administrador = usuario.perfil === 'Administrador';
  const atendente = usuario.perfil === 'Atendente';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Cada perfil tem o seu menu: solicitantes, atendentes de uma equipe e administradores.
  const itens = [
    { para: '/', rotulo: 'Início', curto: 'Início', Icone: IconeInicio, fim: true },
    ...(administrador
      ? [
          // A fila do Suporte de TI fica separada das outras áreas, que ele só acompanha.
          {
            para: '/chamados',
            rotulo: usuario.equipe ? nomeDaFila(usuario.equipe) : 'Fila de atendimento',
            curto: 'Fila',
            Icone: IconeChamados,
            fim: false,
          },
          { para: '/outras-equipes', rotulo: 'Outras equipes', curto: 'Outras', Icone: IconeCamadas, fim: false },
          { para: '/equipe', rotulo: 'Equipe', curto: 'Equipe', Icone: IconePessoas, fim: false },
        ]
      : atendente
        ? [
            {
              para: '/chamados',
              rotulo: usuario.equipe ? nomeDaFila(usuario.equipe) : 'Fila de atendimento',
              curto: 'Fila',
              Icone: IconeChamados,
              fim: false,
            },
          ]
        : [
            { para: '/chamados', rotulo: 'Meus chamados', curto: 'Chamados', Icone: IconeChamados, fim: false },
            { para: '/assistente', rotulo: 'Assistente virtual', curto: 'Assistente', Icone: IconeAssistente, fim: false },
          ]),
  ];

  return (
    <div className="app">
      <a href="#conteudo" className="pular-link">
        Pular para o conteúdo
      </a>

      <header className="topo">
        <div className="topo-interno">
          <Link to="/" className="topo-marca" aria-label="Atendimento ON, em parceria com a Unisa. Ir para o início">
            <Marca />
          </Link>
          <nav className="topo-nav" aria-label="Principal">
            {itens.map((item) => (
              <NavLink key={item.para} to={item.para} end={item.fim}>
                {item.rotulo}
              </NavLink>
            ))}
          </nav>
          <div className="topo-acoes">
            <MenuUsuario />
          </div>
        </div>
      </header>

      <main id="conteudo" className="conteudo" tabIndex={-1}>
        <Outlet />
        <AvisoDoAssistente />
      </main>

      <nav className="abas-mobile" aria-label="Principal">
        {itens.map(({ para, curto, Icone, fim }) => (
          <NavLink key={para} to={para} end={fim}>
            <Icone tamanho={22} />
            <span>{curto}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
