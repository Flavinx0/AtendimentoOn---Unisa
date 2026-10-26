using AtendimentoOn.Domain.Cursos;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AtendimentoOn.Infrastructure.Persistencia.Configuracoes;

public class CursoConfiguracao : IEntityTypeConfiguration<Curso>
{
    public void Configure(EntityTypeBuilder<Curso> builder)
    {
        builder.ToTable("Cursos");

        builder.HasKey(c => c.Id);
        builder.Property(c => c.Nome).HasMaxLength(Curso.TamanhoMaximoNome).IsRequired();
        builder.Property(c => c.Grau).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(c => c.Modalidade).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(c => c.Ativo).IsRequired();
        builder.Ignore(c => c.NomeCompleto);

        // O mesmo nome pode aparecer em graus ou modalidades diferentes, mas não repetido nos três.
        builder.HasIndex(c => new { c.Nome, c.Grau, c.Modalidade }).IsUnique();

        builder.HasData(DadosIniciais.Cursos);
    }
}
