namespace AtendimentoOn.Domain.Usuarios;

public interface IUsuarioRepositorio
{
    Task<Usuario?> ObterPorIdAsync(Guid id, CancellationToken cancelamento = default);
    Task<Usuario?> ObterPorEmailAsync(string email, CancellationToken cancelamento = default);
    Task<bool> EmailEmUsoAsync(string email, CancellationToken cancelamento = default);

    /// <summary>Atendentes e administradores, ativos ou não.</summary>
    Task<IReadOnlyList<Usuario>> ListarAtendimentoAsync(CancellationToken cancelamento = default);

    void Adicionar(Usuario usuario);
}
