using System.Reflection;
using Microsoft.OpenApi;

namespace AtendimentoOn.Api.Configuracao;

public static class SwaggerConfiguracao
{
    private const string Esquema = "Bearer";

    public static IServiceCollection AddSwaggerDocumentado(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(opcoes =>
        {
            opcoes.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "Atendimento ON API",
                Version = "v1",
                Description = "API do sistema de atendimento da Unisa: usuários, chamados, categorias e assistente virtual (Gemini).",
            });

            // Botão "Authorize" do Swagger: cole o token devolvido por POST /api/auth/login.
            opcoes.AddSecurityDefinition(Esquema, new OpenApiSecurityScheme
            {
                Name = "Authorization",
                In = ParameterLocation.Header,
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                Description = "Faça login em POST /api/auth/login e cole aqui só o token, sem a palavra Bearer.",
            });
            opcoes.AddSecurityRequirement(documento => new OpenApiSecurityRequirement
            {
                [new OpenApiSecuritySchemeReference(Esquema, documento)] = [],
            });

            // Usa os comentários /// dos controllers como descrição dos endpoints.
            var arquivoXml = Path.Combine(AppContext.BaseDirectory, $"{Assembly.GetExecutingAssembly().GetName().Name}.xml");
            if (File.Exists(arquivoXml)) opcoes.IncludeXmlComments(arquivoXml);
        });

        return services;
    }
}
