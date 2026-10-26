using AtendimentoOn.Application.Cursos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AtendimentoOn.Api.Controllers;

[ApiController]
[Route("api/cursos")]
[Authorize]
public class CursosController(CursoServico cursos) : ControllerBase
{
    /// <summary>Lista os cursos de graduação, usados para falar com a coordenação e para vincular coordenadores.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<CursoDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<CursoDto>>> Listar(CancellationToken cancelamento)
        => Ok(await cursos.ListarAsync(cancelamento));
}
