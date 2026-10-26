import { Link } from 'react-router-dom';
import type { Chamado } from '../types';
import { formatarDataHora, tempoRelativo } from '../utils/datas';
import { EQUIPES } from '../utils/equipes';
import { StatusBadge } from './StatusBadge';

interface Props {
  chamado: Chamado;
  usuarioId: string;
  mostrarSolicitante?: boolean;
  mostrarEquipe?: boolean;
}

export function ItemChamado({ chamado, usuarioId, mostrarSolicitante = false, mostrarEquipe = false }: Props) {
  const ehSolicitante = chamado.solicitanteId === usuarioId;
  const responsavel = chamado.atendenteId
    ? chamado.atendenteId === usuarioId
      ? 'Com você'
      : `Com ${chamado.atendenteNome ?? 'atendente'}`
    : 'Sem atendente';

  return (
    <li>
      <Link to={`/chamados/${encodeURIComponent(chamado.id)}`} className="item-chamado">
        <span className="item-chamado-protocolo">{chamado.protocolo}</span>
        <span className="item-chamado-principal">
          <span className="item-chamado-titulo">{chamado.titulo}</span>
          <span className="item-chamado-meta">
            <span>{chamado.cursoNome ?? chamado.categoriaNome}</span>
            {mostrarEquipe && <span>{EQUIPES[chamado.equipe].nome}</span>}
            {mostrarSolicitante && <span>Aberto por {chamado.solicitanteNome}</span>}
            <span>{responsavel}</span>
          </span>
        </span>
        <span className="item-chamado-status">
          <StatusBadge status={chamado.status} ehSolicitante={ehSolicitante} />
        </span>
        <time
          className="item-chamado-tempo"
          dateTime={chamado.criadoEm}
          title={`Aberto em ${formatarDataHora(chamado.criadoEm)}`}
        >
          {tempoRelativo(chamado.criadoEm)}
        </time>
      </Link>
    </li>
  );
}
