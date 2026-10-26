using AtendimentoOn.Application.Categorias;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AtendimentoOn.Api.Controllers;

[ApiController]
[Route("api/categorias")]
[Authorize]
public class CategoriasController(CategoriaServico categorias) : ControllerBase
{
    /// <summary>Lista as categorias ativas, usadas ao abrir um chamado.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<CategoriaDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<CategoriaDto>>> Listar(CancellationToken cancelamento)
        => Ok(await categorias.ListarAsync(cancelamento));
}
