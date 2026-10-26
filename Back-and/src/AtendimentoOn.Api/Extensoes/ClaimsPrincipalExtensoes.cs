using System.Security.Claims;
using AtendimentoOn.Application.Comum;

namespace AtendimentoOn.Api.Extensoes;

public static class ClaimsPrincipalExtensoes
{
    /// <summary>Id do usuário logado, lido da claim "sub" do token.</summary>
    public static Guid ObterUsuarioId(this ClaimsPrincipal usuario)
    {
        var valor = usuario.FindFirst("sub")?.Value;
        return Guid.TryParse(valor, out var id)
            ? id
            : throw new CredenciaisInvalidasException("Sessão inválida. Entre novamente.");
    }
}
