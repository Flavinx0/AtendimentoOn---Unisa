using AtendimentoOn.Api.Configuracao;
using AtendimentoOn.Api.Extensoes;
using AtendimentoOn.Application.Usuarios;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AtendimentoOn.Api.Controllers;

[ApiController]
[Route("api/usuarios")]
public class UsuariosController(UsuarioServico usuarios) : ControllerBase
{
    /// <summary>Cria a conta de um aluno ou funcionário. O e-mail precisa ser único (RN02).</summary>
    /// <response code="201">Conta criada.</response>
    /// <response code="400">Dados inválidos, como senha curta ou e-mail mal escrito.</response>
    /// <response code="403">Tentativa de criar conta de atendente pelo cadastro público.</response>
    /// <response code="409">Já existe uma conta com este e-mail.</response>
    [HttpPost]
    [AllowAnonymous]
    [ProducesResponseType(typeof(UsuarioDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<UsuarioDto>> Cadastrar(CadastroRequisicao requisicao, CancellationToken cancelamento)
    {
        var usuario = await usuarios.CadastrarAsync(requisicao, cancelamento);
        return StatusCode(StatusCodes.Status201Created, usuario);
    }

    /// <summary>Dados do usuário logado. Útil para conferir o token no Swagger.</summary>
    [HttpGet("eu")]
    [Authorize]
    [PermiteSenhaProvisoria]
    [ProducesResponseType(typeof(UsuarioDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<UsuarioDto>> Eu(CancellationToken cancelamento)
        => Ok(await usuarios.ObterAsync(User.ObterUsuarioId(), cancelamento));
}
