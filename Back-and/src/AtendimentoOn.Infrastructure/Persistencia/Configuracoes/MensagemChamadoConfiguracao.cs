using AtendimentoOn.Domain.Chamados;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AtendimentoOn.Infrastructure.Persistencia.Configuracoes;

public class MensagemChamadoConfiguracao : IEntityTypeConfiguration<MensagemChamado>
{
    public void Configure(EntityTypeBuilder<MensagemChamado> builder)
    {
        builder.ToTable("MensagensChamado");

        builder.HasKey(m => m.Id);
        // O Guid é gerado no domínio. Sem isto, o EF trataria a mensagem nova como existente e faria UPDATE.
        builder.Property(m => m.Id).ValueGeneratedNever();

        builder.Property(m => m.Conteudo).HasMaxLength(MensagemChamado.TamanhoMaximoConteudo).IsRequired();
        builder.Property(m => m.Origem).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(m => m.EnviadaEm).IsRequired();

        builder.HasOne(m => m.Autor).WithMany().HasForeignKey(m => m.AutorId).OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(m => new { m.ChamadoId, m.EnviadaEm });
    }
}
