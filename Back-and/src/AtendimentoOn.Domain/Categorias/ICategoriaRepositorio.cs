namespace AtendimentoOn.Domain.Categorias;

public interface ICategoriaRepositorio
{
    Task<IReadOnlyList<Categoria>> ListarAtivasAsync(CancellationToken cancelamento = default);
    Task<Categoria?> ObterAtivaPorIdAsync(int id, CancellationToken cancelamento = default);
}
