using AtendimentoOn.Api.Configuracao;
using AtendimentoOn.Api.Extensoes;
using AtendimentoOn.Application.Autenticacao;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace AtendimentoOn.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AuthServico auth, SenhaServico senhas) : ControllerBase
{
    /// <summary>Faz login com e-mail e senha e devolve o token JWT.</summary>
    /// <response code="200">Login feito. Envie o token no cabeçalho Authorization: Bearer. Se usuario.precisaTrocarSenha vier true, a pessoa precisa trocar a senha antes de usar o resto.</response>
    /// <response code="401">E-mail ou senha incorretos.</response>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(LoginResposta), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<LoginResposta>> Entrar(LoginRequisicao requisicao, CancellationToken cancelamento)
        => Ok(await auth.EntrarAsync(requisicao, cancelamento));

    /// <summary>Troca a senha de quem está logado. É também a troca obrigatória da senha inicial do administrador.</summary>
    /// <response code="200">Senha trocada. Use o token novo devolvido aqui.</response>
    /// <response code="400">Senha atual errada, nova senha curta ou igual à atual.</response>
    [HttpPost("trocar-senha")]
    [Authorize]
    [PermiteSenhaProvisoria]
    [ProducesResponseType(typeof(LoginResposta), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<LoginResposta>> TrocarSenha(TrocarSenhaRequisicao requisicao, CancellationToken cancelamento)
        => Ok(await senhas.TrocarAsync(User.ObterUsuarioId(), requisicao, cancelamento));

    /// <summary>"Esqueci minha senha": envia um código de 6 dígitos para o e-mail, se houver conta com ele.</summary>
    /// <response code="204">Pedido recebido. A resposta é a mesma exista a conta ou não.</response>
    /// <response code="429">Muitos pedidos do mesmo endereço em pouco tempo.</response>
    [HttpPost("esqueci-senha")]
    [AllowAnonymous]
    [EnableRateLimiting(LimiteDeRequisicoes.RecuperacaoDeSenha)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> EsqueciSenha(EsqueciSenhaRequisicao requisicao, CancellationToken cancelamento)
    {
        await senhas.SolicitarCodigoAsync(requisicao, cancelamento);
        return NoContent();
    }

    /// <summary>Cria a senha nova com o código recebido por e-mail.</summary>
    /// <response code="204">Senha criada. Entre com ela.</response>
    /// <response code="400">Código incorreto ou vencido, ou nova senha fora das regras.</response>
    [HttpPost("redefinir-senha")]
    [AllowAnonymous]
    [EnableRateLimiting(LimiteDeRequisicoes.RecuperacaoDeSenha)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RedefinirSenha(RedefinirSenhaRequisicao requisicao, CancellationToken cancelamento)
    {
        await senhas.RedefinirAsync(requisicao, cancelamento);
        return NoContent();
    }
}
