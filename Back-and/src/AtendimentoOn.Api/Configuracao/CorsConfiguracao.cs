namespace AtendimentoOn.Api.Configuracao;

public static class CorsConfiguracao
{
    public const string Politica = "front";

    /// <summary>
    /// Em desenvolvimento o Vite já repassa as chamadas do front, então o CORS só importa
    /// quando o front for publicado em outro endereço (lista em "Cors:Origens").
    /// </summary>
    public static IServiceCollection AddCorsDoFront(this IServiceCollection services, IConfiguration configuration)
    {
        var origens = configuration.GetSection("Cors:Origens").Get<string[]>() ?? new[] { "http://localhost:5173" };
        services.AddCors(opcoes => opcoes.AddPolicy(Politica, politica => politica
            .WithOrigins(origens)
            .AllowAnyHeader()
            .AllowAnyMethod()));
        return services;
    }
}
