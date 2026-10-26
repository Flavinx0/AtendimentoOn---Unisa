using AtendimentoOn.Domain.Categorias;
using AtendimentoOn.Domain.Chamados;
using AtendimentoOn.Domain.Comum;
using AtendimentoOn.Domain.Cursos;
using AtendimentoOn.Domain.Usuarios;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace AtendimentoOn.Infrastructure.Persistencia;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options), IUnidadeDeTrabalho
{
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Categoria> Categorias => Set<Categoria>();
    public DbSet<Curso> Cursos => Set<Curso>();
    public DbSet<Chamado> Chamados => Set<Chamado>();
    public DbSet<MensagemChamado> MensagensChamado => Set<MensagemChamado>();
    public DbSet<CodigoDeRecuperacao> CodigosDeRecuperacao => Set<CodigoDeRecuperacao>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Lê as classes da pasta Configuracoes (uma por tabela).
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }

    public async Task SalvarAsync(CancellationToken cancelamento = default)
    {
        try
        {
            await SaveChangesAsync(cancelamento);
        }
        catch (DbUpdateConcurrencyException)
        {
            // Duas pessoas mexeram no mesmo chamado ao mesmo tempo (coluna Versao).
            throw new RegraDeNegocioException(
                "O chamado foi alterado por outra pessoa enquanto você agia. Atualize a página e tente de novo.");
        }
        catch (DbUpdateException erro) when (erro.InnerException is SqlException { Number: 2601 or 2627 })
        {
            // Violação de índice único, por exemplo dois cadastros com o mesmo e-mail ao mesmo tempo (RN02).
            throw new RegraDeNegocioException("Já existe um registro com esses dados.");
        }
    }
}
