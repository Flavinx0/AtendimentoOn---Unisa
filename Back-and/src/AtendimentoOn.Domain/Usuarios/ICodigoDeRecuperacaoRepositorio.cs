namespace AtendimentoOn.Domain.Usuarios;

public interface ICodigoDeRecuperacaoRepositorio
{
    /// <summary>O código mais recente da pessoa. Só ele vale: pedir um código novo invalida os anteriores.</summary>
    Task<CodigoDeRecuperacao?> ObterMaisRecenteAsync(Guid usuarioId, CancellationToken cancelamento = default);

    void Adicionar(CodigoDeRecuperacao codigo);
}
