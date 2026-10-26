using System.Net;
using AtendimentoOn.Application.Abstracoes;
using AtendimentoOn.Domain.Usuarios;

namespace AtendimentoOn.Application.Autenticacao;

/// <summary>Textos dos e-mails enviados pelo sistema.</summary>
internal static class MensagensDeEmail
{
    public static MensagemDeEmail CodigoParaNovaSenha(Usuario usuario, string codigo)
    {
        var primeiroNome = usuario.Nome.Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault() ?? usuario.Nome;
        var validade = $"{CodigoDeRecuperacao.MinutosDeValidade} minutos";

        var texto = $"""
            Olá, {primeiroNome}.

            Seu código para criar uma nova senha no Atendimento ON é: {codigo}

            Ele vale por {validade} e só pode ser usado uma vez.
            Se você não pediu para trocar a senha, ignore este e-mail: a sua senha continua a mesma.

            Atendimento ON · Unisa
            """;

        var nome = WebUtility.HtmlEncode(primeiroNome);
        var html = $"""
            <div style="font-family:Arial,Helvetica,sans-serif;color:#1f2a37;max-width:480px">
              <p>Olá, {nome}.</p>
              <p>Seu código para criar uma nova senha no <strong>Atendimento ON</strong> é:</p>
              <p style="font-size:28px;font-weight:bold;letter-spacing:6px;color:#0c3782;margin:16px 0">{codigo}</p>
              <p>Ele vale por {validade} e só pode ser usado uma vez.</p>
              <p style="color:#667085;font-size:14px">Se você não pediu para trocar a senha, ignore este e-mail: a sua senha continua a mesma.</p>
              <p style="color:#667085;font-size:13px">Atendimento ON · Unisa</p>
            </div>
            """;

        return new MensagemDeEmail(usuario.Email, usuario.Nome,
            $"{codigo} é o seu código do Atendimento ON", texto, html);
    }
}
