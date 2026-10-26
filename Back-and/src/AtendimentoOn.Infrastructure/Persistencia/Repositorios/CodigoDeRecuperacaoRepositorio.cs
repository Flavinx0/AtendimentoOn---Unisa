using AtendimentoOn.Domain.Usuarios;
using Microsoft.EntityFrameworkCore;

namespace AtendimentoOn.Infrastructure.Persistencia.Repositorios;

public class CodigoDeRecuperacaoRepositorio(AppDbContext contexto) : ICodigoDeRecuperacaoRepositorio
{
    // Com rastreamento: o código é marcado como usado (ou recebe uma tentativa errada) na mesma operação.
    public Task<CodigoDeRecuperacao?> ObterMaisRecenteAsync(Guid usuarioId, CancellationToken cancelamento = default) =>
        contexto.CodigosDeRecuperacao
            .Where(c => c.UsuarioId == usuarioId)
            .OrderByDescending(c => c.CriadoEm)
            .FirstOrDefaultAsync(cancelamento);

    public void Adicionar(CodigoDeRecuperacao codigo) => contexto.CodigosDeRecuperacao.Add(codigo);
}
