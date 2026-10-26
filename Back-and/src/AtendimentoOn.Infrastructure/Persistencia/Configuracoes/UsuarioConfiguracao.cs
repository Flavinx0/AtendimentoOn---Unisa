using AtendimentoOn.Domain.Usuarios;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AtendimentoOn.Infrastructure.Persistencia.Configuracoes;

public class UsuarioConfiguracao : IEntityTypeConfiguration<Usuario>
{
    public void Configure(EntityTypeBuilder<Usuario> builder)
    {
        builder.ToTable("Usuarios");

        builder.HasKey(u => u.Id);
        builder.Property(u => u.Id).ValueGeneratedNever(); // o Guid é gerado no domínio

        builder.Property(u => u.Nome).HasMaxLength(Usuario.TamanhoMaximoNome).IsRequired();
        builder.Property(u => u.Email).HasMaxLength(Usuario.TamanhoMaximoEmail).IsRequired();
        builder.Property(u => u.SenhaHash).HasMaxLength(500).IsRequired();
        builder.Property(u => u.Perfil).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(u => u.PrecisaTrocarSenha).IsRequired();
        builder.Property(u => u.Equipe).HasConversion<string>().HasMaxLength(30); // só atendentes têm
        builder.Property(u => u.CriadoEm).IsRequired();
        builder.Property(u => u.DesativadoEm);

        builder.HasIndex(u => u.Email).IsUnique(); // RN02

        // Cursos que cada pessoa da Coordenação coordena (tabela de ligação, muitos para muitos).
        builder.HasMany(u => u.Cursos)
            .WithMany()
            .UsingEntity(ligacao => ligacao.ToTable("CoordenadoresCursos"));
        builder.Navigation(u => u.Cursos).UsePropertyAccessMode(PropertyAccessMode.Field);

        builder.HasData(DadosIniciais.Usuarios);
    }
}
