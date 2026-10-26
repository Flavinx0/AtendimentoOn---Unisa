using AtendimentoOn.Application.Autenticacao;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AtendimentoOn.Api.Configuracao;

/// <summary>Rotas que quem ainda está com a senha inicial do administrador pode usar (além das públicas).</summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public sealed class PermiteSenhaProvisoriaAttribute : Attribute;

public static class SenhaProvisoria
{
    /// <summary>
    /// Bloqueia o sistema para quem entrou com a senha inicial criada pelo administrador: até trocar a senha,
    /// a pessoa só usa as rotas marcadas com [PermiteSenhaProvisoria]. Vem logo depois de UseAuthentication.
    /// </summary>
    public static IApplicationBuilder UseBloqueioDeSenhaProvisoria(this IApplicationBuilder app) =>
        app.Use(async (contexto, proximo) =>
        {
            var comSenhaProvisoria = contexto.User.HasClaim(ClaimsDaSessao.SenhaProvisoria, "true");
            var metadados = contexto.GetEndpoint()?.Metadata;
            var liberada = metadados?.GetMetadata<PermiteSenhaProvisoriaAttribute>() is not null
                || metadados?.GetMetadata<IAllowAnonymous>() is not null;

            if (comSenhaProvisoria && !liberada)
            {
                contexto.Response.StatusCode = StatusCodes.Status403Forbidden;
                await contexto.Response.WriteAsJsonAsync(new ProblemDetails
                {
                    Status = StatusCodes.Status403Forbidden,
                    Title = "Troque a senha inicial",
                    Detail = "Antes de continuar, troque a senha inicial que o administrador criou por uma senha sua.",
                });
                return;
            }

            await proximo(contexto);
        });
}
