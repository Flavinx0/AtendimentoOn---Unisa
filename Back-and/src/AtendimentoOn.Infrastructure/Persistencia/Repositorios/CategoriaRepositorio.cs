using AtendimentoOn.Domain.Categorias;
using Microsoft.EntityFrameworkCore;

namespace AtendimentoOn.Infrastructure.Persistencia.Repositorios;

public class CategoriaRepositorio(AppDbContext contexto) : ICategoriaRepositorio
{
    public async Task<IReadOnlyList<Categoria>> ListarAtivasAsync(CancellationToken cancelamento = default) =>
        await contexto.Categorias
            .AsNoTracking()
            .Where(c => c.Ativa)
            .OrderBy(c => c.Id)
            .ToListAsync(cancelamento);

    public Task<Categoria?> ObterAtivaPorIdAsync(int id, CancellationToken cancelamento = default) =>
        contexto.Categorias.FirstOrDefaultAsync(c => c.Id == id && c.Ativa, cancelamento);
}
