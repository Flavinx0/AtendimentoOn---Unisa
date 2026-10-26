using AtendimentoOn.Domain.Categorias;
using AtendimentoOn.Domain.Equipes;

namespace AtendimentoOn.Application.Categorias;

/// <param name="Id">Identificador da categoria.</param>
/// <param name="Nome">Nome mostrado ao abrir o chamado.</param>
/// <param name="Equipe">Equipe que recebe os chamados desta categoria.</param>
public record CategoriaDto(int Id, string Nome, Equipe Equipe);

public class CategoriaServico(ICategoriaRepositorio categorias)
{
    public async Task<IReadOnlyList<CategoriaDto>> ListarAsync(CancellationToken cancelamento = default)
    {
        var lista = await categorias.ListarAtivasAsync(cancelamento);
        return lista.Select(c => new CategoriaDto(c.Id, c.Nome, c.Equipe)).ToList();
    }
}
