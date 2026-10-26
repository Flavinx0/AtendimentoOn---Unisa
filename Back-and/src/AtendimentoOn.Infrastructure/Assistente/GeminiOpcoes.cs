namespace AtendimentoOn.Infrastructure.Assistente;

/// <summary>Seção "Gemini" do appsettings.</summary>
public class GeminiOpcoes
{
    public const string Secao = "Gemini";

    /// <summary>Chave criada no Google AI Studio. Guarde com user-secrets, nunca no Git.</summary>
    public string ChaveApi { get; set; } = string.Empty;

    /// <summary>"gemini-flash-latest" aponta sempre para o modelo Flash mais recente.</summary>
    public string Modelo { get; set; } = "gemini-flash-latest";

    public string UrlBase { get; set; } = "https://generativelanguage.googleapis.com/";
}
