namespace AtendimentoOn.Domain.Cursos;

public interface ICursoRepositorio
{
    /// <summary>Cursos ativos, em ordem alfabética.</summary>
    Task<IReadOnlyList<Curso>> ListarAtivosAsync(CancellationToken cancelamento = default);

    Task<Curso?> ObterAtivoPorIdAsync(int id, CancellationToken cancelamento = default);

    /// <summary>Cursos ativos com esses ids, prontos para vincular a quem coordena.</summary>
    Task<IReadOnlyList<Curso>> ObterAtivosPorIdsAsync(IReadOnlyCollection<int> ids, CancellationToken cancelamento = default);
}
