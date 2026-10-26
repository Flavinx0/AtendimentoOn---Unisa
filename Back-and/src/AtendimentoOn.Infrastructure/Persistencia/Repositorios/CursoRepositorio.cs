using AtendimentoOn.Domain.Cursos;
using Microsoft.EntityFrameworkCore;

namespace AtendimentoOn.Infrastructure.Persistencia.Repositorios;

public class CursoRepositorio(AppDbContext contexto) : ICursoRepositorio
{
    public async Task<IReadOnlyList<Curso>> ListarAtivosAsync(CancellationToken cancelamento = default) =>
        await contexto.Cursos
            .AsNoTracking()
            .Where(c => c.Ativo)
            .OrderBy(c => c.Nome)
            .ThenBy(c => c.Grau)
            .ThenBy(c => c.Modalidade)
            .ToListAsync(cancelamento);

    // Com rastreamento: o curso é ligado ao chamado ou a quem coordena na mesma operação.
    public Task<Curso?> ObterAtivoPorIdAsync(int id, CancellationToken cancelamento = default) =>
        contexto.Cursos.FirstOrDefaultAsync(c => c.Id == id && c.Ativo, cancelamento);

    public async Task<IReadOnlyList<Curso>> ObterAtivosPorIdsAsync(
        IReadOnlyCollection<int> ids, CancellationToken cancelamento = default)
    {
        var procurados = ids.ToArray();
        return await contexto.Cursos
            .Where(c => c.Ativo && procurados.Contains(c.Id))
            .ToListAsync(cancelamento);
    }
}
