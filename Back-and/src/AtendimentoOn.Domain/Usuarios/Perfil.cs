namespace AtendimentoOn.Domain.Usuarios;

public enum Perfil
{
    Aluno = 0,
    Funcionario = 1,

    /// <summary>Atende os chamados da própria equipe.</summary>
    Atendente = 2,

    /// <summary>Atendente do Suporte de TI que também cadastra e gerencia os atendentes.</summary>
    Administrador = 3,
}
