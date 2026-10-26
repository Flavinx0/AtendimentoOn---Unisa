import type { ReactNode } from 'react';

interface PropsIcone {
  tamanho?: number;
}

function Icone({ tamanho = 20, children }: PropsIcone & { children: ReactNode }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export const IconeInicio = (p: PropsIcone) => (
  <Icone {...p}>
    <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" />
  </Icone>
);

/** Uma senha de atendimento, com o picote. */
export const IconeChamados = (p: PropsIcone) => (
  <Icone {...p}>
    <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1.5a2.5 2.5 0 0 0 0 5V16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1.5a2.5 2.5 0 0 0 0-5z" />
    <path d="M15 6.8v10.4" strokeDasharray="1.6 2.2" />
  </Icone>
);

export const IconeAssistente = (p: PropsIcone) => (
  <Icone {...p}>
    <path d="M20.5 11.5a8 8 0 0 1-11.7 7.1L4 20l1.3-4.4a8 8 0 1 1 15.2-4.1z" />
    <path d="M8.6 11.6h.01M12.5 11.6h.01M16.4 11.6h.01" strokeWidth={2.6} />
  </Icone>
);

export const IconeMais = (p: PropsIcone) => (
  <Icone {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icone>
);

export const IconeSair = (p: PropsIcone) => (
  <Icone {...p}>
    <path d="M9 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3" />
    <path d="m16 16 4-4-4-4" />
    <path d="M20 12H9" />
  </Icone>
);

export const IconeEnviar = (p: PropsIcone) => (
  <Icone {...p}>
    <path d="m21.5 2.5-6.8 19-3.9-8.3-8.3-3.9z" />
    <path d="M21.5 2.5 10.8 13.2" />
  </Icone>
);

export const IconeVoltar = (p: PropsIcone) => (
  <Icone {...p}>
    <path d="M19 12H5" />
    <path d="m11 18-6-6 6-6" />
  </Icone>
);

export const IconeBusca = (p: PropsIcone) => (
  <Icone {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.3-4.3" />
  </Icone>
);

export const IconeCheck = (p: PropsIcone) => (
  <Icone {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Icone>
);

export const IconeInfo = (p: PropsIcone) => (
  <Icone {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 7.8h.01" />
  </Icone>
);

export const IconeAtencao = (p: PropsIcone) => (
  <Icone {...p}>
    <path d="M10.3 4.2 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z" />
    <path d="M12 9.5v4M12 16.8h.01" />
  </Icone>
);

export const IconeErro = (p: PropsIcone) => (
  <Icone {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m9.2 9.2 5.6 5.6M14.8 9.2l-5.6 5.6" />
  </Icone>
);

export const IconeRestaurar = (p: PropsIcone) => (
  <Icone {...p}>
    <path d="M4 12a8 8 0 1 0 2.4-5.7" />
    <path d="M4 4.5V9h4.5" />
  </Icone>
);

/** Campainha de balcão: "chamar o próximo". */
export const IconeChamar = (p: PropsIcone) => (
  <Icone {...p}>
    <path d="M4 17h16" />
    <path d="M5.5 17a6.5 6.5 0 0 1 13 0" />
    <path d="M12 10.5V8M10 8h4" />
  </Icone>
);

/* Equipes de atendimento */
export const IconeLivro = (p: PropsIcone) => (
  <Icone {...p}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v14H6.5A2.5 2.5 0 0 0 4 19.5z" />
    <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
  </Icone>
);

export const IconeMonitor = (p: PropsIcone) => (
  <Icone {...p}>
    <rect x="3" y="4" width="18" height="12" rx="2" />
    <path d="M8 20h8M12 16v4" />
  </Icone>
);

/** Prancheta com documento: a Secretaria. */
export const IconePrancheta = (p: PropsIcone) => (
  <Icone {...p}>
    <rect x="5" y="4.5" width="14" height="16.5" rx="2" />
    <path d="M9 4.5V3.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
    <path d="M8.5 10h7M8.5 13.5h7M8.5 17h4" />
  </Icone>
);

/** Pessoas: a tela de gestão da equipe. */
export const IconePessoas = (p: PropsIcone) => (
  <Icone {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 19.5a6 6 0 0 1 12 0" />
    <circle cx="17" cy="9" r="2.6" />
    <path d="M15.6 14.1A5 5 0 0 1 21 19.5" />
  </Icone>
);

/** Cadeado: trocar a senha. */
export const IconeCadeado = (p: PropsIcone) => (
  <Icone {...p}>
    <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
  </Icone>
);

/** Capelo de formatura: a Coordenação de curso. */
export const IconeCapelo = (p: PropsIcone) => (
  <Icone {...p}>
    <path d="m2.5 9.5 9.5-5 9.5 5-9.5 5z" />
    <path d="M6.5 11.6V16c0 1.4 2.5 3 5.5 3s5.5-1.6 5.5-3v-4.4" />
    <path d="M21.5 9.5v5" />
  </Icone>
);

/** Camadas: as outras equipes que o administrador acompanha. */
export const IconeCamadas = (p: PropsIcone) => (
  <Icone {...p}>
    <path d="m12 3 9 5-9 5-9-5z" />
    <path d="m3 12.5 9 5 9-5" />
    <path d="m3 17 9 5 9-5" />
  </Icone>
);
