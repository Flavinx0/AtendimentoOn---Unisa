namespace AtendimentoOn.Infrastructure.Seguranca;

/// <summary>Seção "Jwt" do appsettings.</summary>
public class JwtOpcoes
{
    public const string Secao = "Jwt";

    public string Emissor { get; set; } = "AtendimentoOn";
    public string Publico { get; set; } = "AtendimentoOn.Web";

    /// <summary>Segredo que assina os tokens. Pelo menos 32 caracteres; em produção, fora do Git.</summary>
    public string Chave { get; set; } = string.Empty;

    public int ExpiracaoHoras { get; set; } = 8;
}
