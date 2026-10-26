using AtendimentoOn.Api.Extensoes;
using AtendimentoOn.Application.Atendentes;
using AtendimentoOn.Domain.Usuarios;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AtendimentoOn.Api.Controllers;

/// <summary>Gestão da equipe de atendimento. Só administradores (Suporte de TI).</summary>
[ApiController]
[Route("api/equipe/atendentes")]
[Authorize(Roles = nameof(Perfil.Administrador))]
public class AtendentesController(AtendenteServico atendentes) : ControllerBase
{
    /// <summary>Lista os atendentes e administradores, com a equipe e a situação de cada um.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<AtendenteDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<AtendenteDto>>> Listar(CancellationToken cancelamento)
        => Ok(await atendentes.ListarAsync(User.ObterUsuarioId(), cancelamento));

    /// <summary>Cria a conta de um atendente numa equipe.</summary>
    /// <response code="201">Atendente criado.</response>
    /// <response code="400">Dados inválidos, como administrador fora do Suporte de TI.</response>
    /// <response code="409">Já existe uma conta com este e-mail.</response>
    [HttpPost]
    [ProducesResponseType(typeof(AtendenteDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AtendenteDto>> Cadastrar(NovoAtendenteRequisicao requisicao, CancellationToken cancelamento)
    {
        var atendente = await atendentes.CadastrarAsync(User.ObterUsuarioId(), requisicao, cancelamento);
        return StatusCode(StatusCodes.Status201Created, atendente);
    }

    /// <summary>Muda a equipe, o acesso de administrador ou a situação (ativa ou desativada) de um atendente.</summary>
    /// <response code="200">Atendente atualizado.</response>
    /// <response code="409">Tentativa de desativar a própria conta ou tirar o próprio acesso de administrador.</response>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(AtendenteDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AtendenteDto>> Atualizar(Guid id, AtualizarAtendenteRequisicao requisicao, CancellationToken cancelamento)
        => Ok(await atendentes.AtualizarAsync(User.ObterUsuarioId(), id, requisicao, cancelamento));
}
