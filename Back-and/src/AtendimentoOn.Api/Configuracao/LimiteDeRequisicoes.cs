using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace AtendimentoOn.Api.Configuracao;

public static class LimiteDeRequisicoes
{
    /// <summary>Política do chat: até 20 perguntas por minuto por usuário, para proteger a cota da chave do Gemini.</summary>
    public const string Assistente = "assistente";

    /// <summary>
    /// "Esqueci minha senha": até 20 pedidos a cada 15 minutos por endereço IP, somando o envio do código e a
    /// redefinição. Junto com o limite de tentativas de cada código, dificulta adivinhar códigos.
    /// </summary>
    public const string RecuperacaoDeSenha = "recuperacao-de-senha";

    public static IServiceCollection AddLimitesDeRequisicoes(this IServiceCollection services)
    {
        services.AddRateLimiter(opcoes =>
        {
            opcoes.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            opcoes.OnRejected = async (contexto, cancelamento) =>
            {
                var politica = contexto.HttpContext.GetEndpoint()?.Metadata.GetMetadata<EnableRateLimitingAttribute>()?.PolicyName;
                var (titulo, detalhe) = politica == RecuperacaoDeSenha
                    ? ("Muitas tentativas", "Muitas tentativas de recuperar a senha. Aguarde 15 minutos e tente de novo.")
                    : ("Muitas perguntas", "Você fez muitas perguntas em pouco tempo. Aguarde um minuto e tente de novo.");

                await contexto.HttpContext.Response.WriteAsJsonAsync(new ProblemDetails
                {
                    Status = StatusCodes.Status429TooManyRequests,
                    Title = titulo,
                    Detail = detalhe,
                }, cancelamento);
            };

            opcoes.AddPolicy(Assistente, contexto => RateLimitPartition.GetFixedWindowLimiter(
                contexto.User.FindFirst("sub")?.Value ?? contexto.Connection.RemoteIpAddress?.ToString() ?? "anonimo",
                _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 20,
                    Window = TimeSpan.FromMinutes(1),
                    QueueLimit = 0,
                }));

            opcoes.AddPolicy(RecuperacaoDeSenha, contexto => RateLimitPartition.GetFixedWindowLimiter(
                contexto.Connection.RemoteIpAddress?.ToString() ?? "anonimo",
                _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 20,
                    Window = TimeSpan.FromMinutes(15),
                    QueueLimit = 0,
                }));
        });

        return services;
    }
}
