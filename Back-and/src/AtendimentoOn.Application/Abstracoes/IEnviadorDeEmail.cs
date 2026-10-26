namespace AtendimentoOn.Application.Abstracoes;

/// <param name="Para">E-mail de quem recebe.</param>
/// <param name="NomeDoDestinatario">Nome de quem recebe, para o cabeçalho do e-mail.</param>
/// <param name="Assunto">Assunto do e-mail.</param>
/// <param name="Texto">Versão em texto simples.</param>
/// <param name="Html">Versão formatada, que a maioria dos programas de e-mail mostra.</param>
public record MensagemDeEmail(string Para, string NomeDoDestinatario, string Assunto, string Texto, string Html);

/// <summary>Envia e-mails. Sem servidor configurado, a infraestrutura mostra o e-mail no console da API.</summary>
public interface IEnviadorDeEmail
{
    Task EnviarAsync(MensagemDeEmail mensagem, CancellationToken cancelamento = default);
}
