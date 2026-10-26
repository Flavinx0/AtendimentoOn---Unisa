export function Carregando({ texto = 'Carregando…' }: { texto?: string }) {
  return (
    <div className="carregando" role="status">
      <span className="giro" aria-hidden="true" />
      {texto}
    </div>
  );
}
