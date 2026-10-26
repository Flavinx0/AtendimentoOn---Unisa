using System.Net;
using System.Net.Mail;
using System.Text;
using AtendimentoOn.Application.Abstracoes;
using AtendimentoOn.Application.Comum;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AtendimentoOn.Infrastructure.Email;

/// <summary>Envia pelo SMTP configurado em "Email". Sem servidor configurado, mostra o e-mail no console da API.</summary>
public class EnviadorDeEmail(IOptions<EmailOpcoes> opcoes, ILogger<EnviadorDeEmail> logger) : IEnviadorDeEmail
{
    public async Task EnviarAsync(MensagemDeEmail mensagem, CancellationToken cancelamento = default)
    {
        var configuracao = opcoes.Value;

        if (string.IsNullOrWhiteSpace(configuracao.Host))
        {
            logger.LogWarning(
                "E-mail não enviado: configure Email:Host para enviar de verdade. Para: {Para}. Assunto: {Assunto}.\n{Texto}",
                mensagem.Para, mensagem.Assunto, mensagem.Texto);
            return;
        }

        using var email = new MailMessage
        {
            From = new MailAddress(configuracao.Remetente, configuracao.NomeDoRemetente),
            Subject = mensagem.Assunto,
            SubjectEncoding = Encoding.UTF8,
            Body = mensagem.Texto,
            BodyEncoding = Encoding.UTF8,
            IsBodyHtml = false,
        };
        email.To.Add(new MailAddress(mensagem.Para, mensagem.NomeDoDestinatario));
        // Texto simples e HTML no mesmo e-mail: cada programa mostra a versão que entende.
        email.AlternateViews.Add(AlternateView.CreateAlternateViewFromString(mensagem.Html, Encoding.UTF8, "text/html"));

        using var smtp = new SmtpClient(configuracao.Host, configuracao.Porta)
        {
            EnableSsl = configuracao.UsarSsl,
            DeliveryMethod = SmtpDeliveryMethod.Network,
        };
        if (!string.IsNullOrEmpty(configuracao.Usuario))
            smtp.Credentials = new NetworkCredential(configuracao.Usuario, configuracao.Senha);

        try
        {
            await smtp.SendMailAsync(email, cancelamento);
        }
        catch (Exception erro) when (erro is SmtpException or InvalidOperationException or IOException)
        {
            logger.LogError(erro, "Falha ao enviar e-mail para {Para} pelo servidor {Host}", mensagem.Para, configuracao.Host);
            throw new ServicoIndisponivelException("Não foi possível enviar o e-mail agora. Tente de novo em alguns minutos.", erro);
        }
    }
}
