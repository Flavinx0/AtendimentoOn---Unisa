using AtendimentoOn.Application.Atendentes;
using AtendimentoOn.Application.Autenticacao;
using AtendimentoOn.Application.Categorias;
using AtendimentoOn.Application.Chamados;
using AtendimentoOn.Application.Chatbot;
using AtendimentoOn.Application.Cursos;
using AtendimentoOn.Application.Usuarios;
using Microsoft.Extensions.DependencyInjection;

namespace AtendimentoOn.Application;

public static class InjecaoDeDependencia
{
    public static IServiceCollection AddAplicacao(this IServiceCollection services)
    {
        services.AddScoped<AuthServico>();
        services.AddScoped<SenhaServico>();
        services.AddScoped<UsuarioServico>();
        services.AddScoped<CategoriaServico>();
        services.AddScoped<CursoServico>();
        services.AddScoped<ChamadoServico>();
        services.AddScoped<ChatbotServico>();
        services.AddScoped<AtendenteServico>();
        return services;
    }
}
