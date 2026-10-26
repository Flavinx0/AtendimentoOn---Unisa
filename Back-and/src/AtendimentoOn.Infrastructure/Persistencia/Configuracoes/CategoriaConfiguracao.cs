using AtendimentoOn.Domain.Categorias;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AtendimentoOn.Infrastructure.Persistencia.Configuracoes;

public class CategoriaConfiguracao : IEntityTypeConfiguration<Categoria>
{
    public void Configure(EntityTypeBuilder<Categoria> builder)
    {
        builder.ToTable("Categorias");

        builder.HasKey(c => c.Id);
        builder.Property(c => c.Nome).HasMaxLength(Categoria.TamanhoMaximoNome).IsRequired();
        builder.Property(c => c.Ativa).IsRequired();
        builder.Property(c => c.Equipe).HasConversion<string>().HasMaxLength(30).IsRequired();

        builder.HasIndex(c => c.Nome).IsUnique();

        builder.HasData(DadosIniciais.Categorias);
    }
}
