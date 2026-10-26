using AtendimentoOn.Application.Comum;
using AtendimentoOn.Domain.Comum;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace AtendimentoOn.Api.Erros;

/// <summary>
/// Converte as exceções em respostas no formato ProblemDetails.
/// O front mostra o campo "detail" ao usuário, por isso as mensagens das exceções são escritas para ele.
/// </summary>
public sealed class TratadorDeErros(IProblemDetailsService problemDetails, ILogger<TratadorDeErros> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        var (status, titulo) = exception switch
        {
            DadosInvalidosException => (StatusCodes.Status400BadRequest, "Dados inválidos"),
            CredenciaisInvalidasException => (StatusCodes.Status401Unauthorized, "Não autenticado"),
            AcessoNegadoException => (StatusCodes.Status403Forbidden, "Acesso negado"),
            NaoEncontradoException => (StatusCodes.Status404NotFound, "Não encontrado"),
            RegraDeNegocioException => (StatusCodes.Status409Conflict, "Ação não permitida agora"),
            ServicoIndisponivelException => (StatusCodes.Status503ServiceUnavailable, "Serviço indisponível"),
            _ => (StatusCodes.Status500InternalServerError, "Erro interno"),
        };

        if (status == StatusCodes.Status500InternalServerError)
        {
            logger.LogError(exception, "Erro não tratado em {Metodo} {Caminho}",
                httpContext.Request.Method, httpContext.Request.Path);
        }

        httpContext.Response.StatusCode = status;
        return await problemDetails.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            Exception = exception,
            ProblemDetails = new ProblemDetails
            {
                Status = status,
                Title = titulo,
                Detail = status == StatusCodes.Status500InternalServerError
                    ? "Ocorreu um erro inesperado no servidor."
                    : exception.Message,
            },
        });
    }
}
