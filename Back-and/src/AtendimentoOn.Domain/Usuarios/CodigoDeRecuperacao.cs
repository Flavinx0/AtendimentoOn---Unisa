namespace AtendimentoOn.Domain.Usuarios;

/// <summary>
/// Código de 6 dígitos enviado por e-mail no "Esqueci minha senha". Só o hash do código é gravado.
/// Vale por pouco tempo, aceita poucas tentativas erradas e só pode ser usado uma vez.
/// </summary>
public class CodigoDeRecuperacao
{
    public const int MinutosDeValidade = 15;
    public const int MaximoDeTentativas = 5;

    public Guid Id { get; private set; }
    public Guid UsuarioId { get; private set; }
    public string CodigoHash { get; private set; } = string.Empty;
    public DateTime CriadoEm { get; private set; }
    public DateTime ExpiraEm { get; private set; }
    public int TentativasErradas { get; private set; }
    public DateTime? UsadoEm { get; private set; }

    // Usado pelo Entity Framework ao ler do banco.
    private CodigoDeRecuperacao() { }

    public CodigoDeRecuperacao(Guid usuarioId, string codigoHash, DateTime agora)
    {
        if (string.IsNullOrWhiteSpace(codigoHash))
            throw new ArgumentException("O hash do código não pode ser vazio.", nameof(codigoHash));

        Id = Guid.NewGuid();
        UsuarioId = usuarioId;
        CodigoHash = codigoHash;
        CriadoEm = agora;
        ExpiraEm = agora.AddMinutes(MinutosDeValidade);
    }

    public bool PodeSerUsado(DateTime agora) =>
        UsadoEm is null && agora < ExpiraEm && TentativasErradas < MaximoDeTentativas;

    public void RegistrarTentativaErrada() => TentativasErradas++;

    public void MarcarComoUsado(DateTime agora) => UsadoEm ??= agora;
}
