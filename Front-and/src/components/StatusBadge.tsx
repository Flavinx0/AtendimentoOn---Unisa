import type { StatusChamado } from '../types';
import { STATUS, rotuloStatus } from '../utils/status';

export function StatusBadge({ status, ehSolicitante = false }: { status: StatusChamado; ehSolicitante?: boolean }) {
  return (
    <span className={`status status--${STATUS[status].classe}`}>
      <span className="status-ponto" aria-hidden="true" />
      {rotuloStatus(status, ehSolicitante)}
    </span>
  );
}
