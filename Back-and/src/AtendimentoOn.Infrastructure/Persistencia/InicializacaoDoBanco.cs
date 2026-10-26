using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace AtendimentoOn.Infrastructure.Persistencia;

public static class InicializacaoDoBanco
{
    /// <summary>
    /// Cria o banco, se ele ainda não existir, e aplica as migrations pendentes.
    /// Assim, quem baixar o projeto só precisa rodar a API para ter o banco pronto.
    /// </summary>
    public static async Task AplicarMigracoesAsync(this IServiceProvider servicos)
    {
        await using var escopo = servicos.CreateAsyncScope();
        var contexto = escopo.ServiceProvider.GetRequiredService<AppDbContext>();
        await contexto.Database.MigrateAsync();
    }
}
