namespace AtendimentoOn.Infrastructure.Email;

/// <summary>
/// Servidor de e-mail (SMTP), na seção "Email" da configuração. Sem Host, nenhum e-mail sai de verdade:
/// a API escreve o e-mail no console, o que basta para testar em desenvolvimento.
/// </summary>
public class EmailOpcoes
{
    public const string Secao = "Email";

    /// <summary>Ex.: "localhost" (Mailpit) ou "smtp.gmail.com". Vazio: só mostra no console.</summary>
    public string Host { get; set; } = string.Empty;

    public int Porta { get; set; } = 587;

    /// <summary>true para servidores com TLS (Gmail, Outlook). false para o Mailpit.</summary>
    public bool UsarSsl { get; set; } = true;

    public string Usuario { get; set; } = string.Empty;
    public string Senha { get; set; } = string.Empty;

    /// <summary>Endereço que aparece como remetente. No Gmail, use o próprio e-mail da conta.</summary>
    public string Remetente { get; set; } = "nao-responda@atendimento-on.local";

    public string NomeDoRemetente { get; set; } = "Atendimento ON";
}
