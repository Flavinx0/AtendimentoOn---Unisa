using AtendimentoOn.Api.Extensoes;
using AtendimentoOn.Application.Chamados;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AtendimentoOn.Api.Controllers;

[ApiController]
[Route("api/chamados")]
[Authorize]
public class ChamadosController(ChamadoServico chamados) : ControllerBase
{
    /// <summary>
    /// Lista os chamados. Aluno e funcionário veem os seus; atendente vê os da própria equipe;
    /// administrador vê todos.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<ChamadoDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<ChamadoDto>>> Listar(CancellationToken cancelamento)
        => Ok(await chamados.ListarAsync(User.ObterUsuarioId(), cancelamento));

    /// <summary>Detalhe do chamado, com as mensagens em ordem de envio.</summary>
    /// <response code="404">O chamado não existe ou pertence a outra pessoa.</response>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ChamadoDetalheDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ChamadoDetalheDto>> Obter(Guid id, CancellationToken cancelamento)
        => Ok(await chamados.ObterAsync(id, User.ObterUsuarioId(), cancelamento));

    /// <summary>Abre um chamado. O protocolo é gerado na hora.</summary>
    /// <response code="201">Chamado aberto.</response>
    /// <response code="400">Assunto, descrição ou categoria inválidos.</response>
    [HttpPost]
    [ProducesResponseType(typeof(ChamadoDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ChamadoDto>> Abrir(AbrirChamadoRequisicao requisicao, CancellationToken cancelamento)
    {
        var chamado = await chamados.AbrirAsync(requisicao, User.ObterUsuarioId(), cancelamento);
        return CreatedAtAction(nameof(Obter), new { id = chamado.Id }, chamado);
    }

    /// <summary>Envia uma mensagem no chamado. Só o solicitante e o atendente responsável podem escrever.</summary>
    /// <response code="201">Mensagem enviada.</response>
    /// <response code="403">Quem enviou não participa do chamado.</response>
    /// <response code="409">O chamado já foi encerrado.</response>
    [HttpPost("{id:guid}/mensagens")]
    [ProducesResponseType(typeof(MensagemDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<MensagemDto>> EnviarMensagem(Guid id, EnviarMensagemRequisicao requisicao, CancellationToken cancelamento)
    {
        var mensagem = await chamados.EnviarMensagemAsync(id, requisicao, User.ObterUsuarioId(), cancelamento);
        return StatusCode(StatusCodes.Status201Created, mensagem);
    }

    /// <summary>
    /// O atendente assume o chamado (Aberto → Em atendimento). Atendentes só assumem
    /// chamados da própria equipe; administradores, de qualquer equipe.
    /// </summary>
    /// <response code="204">Chamado assumido.</response>
    /// <response code="403">O chamado é de outra equipe.</response>
    /// <response code="409">O chamado já está com outro atendente ou foi encerrado.</response>
    [HttpPatch("{id:guid}/assumir")]
    [Authorize(Roles = "Atendente,Administrador")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Assumir(Guid id, CancellationToken cancelamento)
    {
        await chamados.AssumirAsync(id, User.ObterUsuarioId(), cancelamento);
        return NoContent();
    }

    /// <summary>Encerra o chamado. RN01: só quem abriu ou o atendente responsável.</summary>
    /// <response code="204">Chamado encerrado.</response>
    /// <response code="403">Quem pediu não pode encerrar este chamado.</response>
    [HttpPatch("{id:guid}/encerrar")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Encerrar(Guid id, CancellationToken cancelamento)
    {
        await chamados.EncerrarAsync(id, User.ObterUsuarioId(), cancelamento);
        return NoContent();
    }
}
