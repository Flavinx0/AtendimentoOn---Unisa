using AtendimentoOn.Domain.Chamados;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AtendimentoOn.Infrastructure.Persistencia.Configuracoes;

public class ChamadoConfiguracao : IEntityTypeConfiguration<Chamado>
{
    public void Configure(EntityTypeBuilder<Chamado> builder)
    {
        builder.ToTable("Chamados");

        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).ValueGeneratedNever(); // o Guid é gerado no domínio

        // Número sequencial do protocolo (ON-2026-0042), gerado pelo SQL Server.
        builder.Property(c => c.Numero).UseIdentityColumn();
        builder.HasIndex(c => c.Numero).IsUnique();
        builder.Ignore(c => c.Protocolo);

        builder.Property(c => c.Titulo).HasMaxLength(Chamado.TamanhoMaximoTitulo).IsRequired();
        builder.Property(c => c.Descricao).HasMaxLength(Chamado.TamanhoMaximoDescricao).IsRequired();
        builder.Property(c => c.Status).HasConversion<string>().HasMaxLength(30).IsRequired();
        builder.Property(c => c.Equipe).HasConversion<string>().HasMaxLength(30).IsRequired();
        builder.Property(c => c.CriadoEm).IsRequired();

        // Controle de concorrência: impede, por exemplo, que dois atendentes assumam o mesmo chamado juntos.
        builder.Property<byte[]>("Versao").IsRowVersion();

        builder.HasOne(c => c.Categoria).WithMany().HasForeignKey(c => c.CategoriaId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(c => c.Curso).WithMany().HasForeignKey(c => c.CursoId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(c => c.Solicitante).WithMany().HasForeignKey(c => c.SolicitanteId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(c => c.Atendente).WithMany().HasForeignKey(c => c.AtendenteId).OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(c => c.Mensagens).WithOne().HasForeignKey(m => m.ChamadoId).OnDelete(DeleteBehavior.Cascade);
        builder.Navigation(c => c.Mensagens).UsePropertyAccessMode(PropertyAccessMode.Field);

        builder.HasIndex(c => c.SolicitanteId);
        builder.HasIndex(c => c.AtendenteId);
        builder.HasIndex(c => c.Status);
        builder.HasIndex(c => c.Equipe);
    }
}
