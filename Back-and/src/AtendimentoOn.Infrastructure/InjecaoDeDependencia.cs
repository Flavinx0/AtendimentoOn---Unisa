using AtendimentoOn.Application.Abstracoes;
using AtendimentoOn.Domain.Categorias;
using AtendimentoOn.Domain.Chamados;
using AtendimentoOn.Domain.Comum;
using AtendimentoOn.Domain.Cursos;
using AtendimentoOn.Domain.Usuarios;
using AtendimentoOn.Infrastructure.Assistente;
using AtendimentoOn.Infrastructure.Email;
using AtendimentoOn.Infrastructure.Persistencia;
using AtendimentoOn.Infrastructure.Persistencia.Repositorios;
using AtendimentoOn.Infrastructure.Seguranca;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace AtendimentoOn.Infrastructure;

public static class InjecaoDeDependencia
{
    public static IServiceCollection AddInfraestrutura(this IServiceCollection services, IConfiguration configuration)
    {
        // Banco de dados (SQL Server)
        var conexao = configuration.GetConnectionString("AtendimentoOn")
            ?? throw new InvalidOperationException("Configure ConnectionStrings:AtendimentoOn no appsettings.json.");
        services.AddDbContext<AppDbContext>(opcoes => opcoes.UseSqlServer(conexao));
        services.AddScoped<IUnidadeDeTrabalho>(provedor => provedor.GetRequiredService<AppDbContext>());
        services.AddScoped<IUsuarioRepositorio, UsuarioRepositorio>();
        services.AddScoped<ICategoriaRepositorio, CategoriaRepositorio>();
        services.AddScoped<ICursoRepositorio, CursoRepositorio>();
        services.AddScoped<IChamadoRepositorio, ChamadoRepositorio>();
        services.AddScoped<ICodigoDeRecuperacaoRepositorio, CodigoDeRecuperacaoRepositorio>();

        // E-mail (código do "Esqueci minha senha"). Sem servidor configurado, aparece no console da API.
        services.Configure<EmailOpcoes>(configuration.GetSection(EmailOpcoes.Secao));
        services.AddSingleton<IEnviadorDeEmail, EnviadorDeEmail>();

        // Segurança: login com JWT e hash de senha
        services.AddAutenticacaoJwt(configuration);
        services.AddSingleton<ISenhaHasher, SenhaHasher>();
        services.AddSingleton<IGeradorToken, GeradorTokenJwt>();

        // Assistente virtual (Gemini)
        services.Configure<GeminiOpcoes>(configuration.GetSection(GeminiOpcoes.Secao));
        services.AddHttpClient<IAssistenteVirtual, GeminiAssistenteVirtual>((provedor, cliente) =>
        {
            var gemini = provedor.GetRequiredService<IOptions<GeminiOpcoes>>().Value;
            cliente.BaseAddress = new Uri(gemini.UrlBase);
            cliente.Timeout = TimeSpan.FromSeconds(30);
        });

        return services;
    }
}
