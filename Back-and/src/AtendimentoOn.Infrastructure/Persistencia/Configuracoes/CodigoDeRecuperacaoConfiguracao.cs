using AtendimentoOn.Domain.Usuarios;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AtendimentoOn.Infrastructure.Persistencia.Configuracoes;

public class CodigoDeRecuperacaoConfiguracao : IEntityTypeConfiguration<CodigoDeRecuperacao>
{
    public void Configure(EntityTypeBuilder<CodigoDeRecuperacao> builder)
    {
        builder.ToTable("CodigosDeRecuperacao");

        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).ValueGeneratedNever(); // o Guid é gerado no domínio

        builder.Property(c => c.CodigoHash).HasMaxLength(500).IsRequired();
        builder.Property(c => c.CriadoEm).IsRequired();
        builder.Property(c => c.ExpiraEm).IsRequired();
        builder.Property(c => c.TentativasErradas).IsRequired();

        // Conta apagada leva junto os códigos dela.
        builder.HasOne<Usuario>().WithMany().HasForeignKey(c => c.UsuarioId).OnDelete(DeleteBehavior.Cascade);

        // O sistema sempre procura o código mais recente da pessoa.
        builder.HasIndex(c => new { c.UsuarioId, c.CriadoEm });
    }
}
