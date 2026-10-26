using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace AtendimentoOn.Infrastructure.Seguranca;

internal static class ConfiguracaoJwt
{
    public static IServiceCollection AddAutenticacaoJwt(this IServiceCollection services, IConfiguration configuration)
    {
        // A chave é conferida quando a API sobe, com uma mensagem clara se estiver faltando.
        services.AddOptions<JwtOpcoes>()
            .Bind(configuration.GetSection(JwtOpcoes.Secao))
            .Validate(o => o.Chave.Length >= 32, "Configure Jwt:Chave com pelo menos 32 caracteres (veja o README).")
            .ValidateOnStart();

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();

        // Configurado só quando a primeira requisição chega. Assim ferramentas como o
        // "dotnet ef" conseguem montar a API mesmo sem a chave configurada.
        services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
            .Configure<IOptions<JwtOpcoes>>((jwt, opcoes) =>
            {
                var configuracao = opcoes.Value;

                // Mantém os nomes curtos das claims ("sub", "role"), iguais aos do token gerado.
                jwt.MapInboundClaims = false;
                jwt.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = configuracao.Emissor,
                    ValidateAudience = true,
                    ValidAudience = configuracao.Publico,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = ChaveDeAssinatura.Criar(configuracao.Chave),
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromMinutes(1),
                    NameClaimType = JwtRegisteredClaimNames.Name,
                    RoleClaimType = ClaimsDoToken.Perfil, // faz [Authorize(Roles = "Atendente")] funcionar
                };
            });

        services.AddAuthorization();
        return services;
    }
}
