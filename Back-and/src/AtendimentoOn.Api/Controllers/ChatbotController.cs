using AtendimentoOn.Api.Configuracao;
using AtendimentoOn.Application.Chatbot;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace AtendimentoOn.Api.Controllers;

[ApiController]
[Route("api/chatbot")]
[Authorize]
public class ChatbotController(ChatbotServico chatbot) : ControllerBase
{
    /// <summary>
    /// Envia uma pergunta ao assistente virtual (Gemini). Quando "escalar" volta true,
    /// o caso precisa de um atendente e o front oferece abrir um chamado.
    /// </summary>
    /// <response code="429">Muitas perguntas em pouco tempo (limite de 20 por minuto).</response>
    /// <response code="503">O Gemini não respondeu ou a chave não foi configurada.</response>
    [HttpPost("mensagens")]
    [EnableRateLimiting(LimiteDeRequisicoes.Assistente)]
    [ProducesResponseType(typeof(RespostaAssistenteDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status429TooManyRequests)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<RespostaAssistenteDto>> Perguntar(PerguntaAssistenteRequisicao requisicao, CancellationToken cancelamento)
        => Ok(await chatbot.PerguntarAsync(requisicao, cancelamento));
}
