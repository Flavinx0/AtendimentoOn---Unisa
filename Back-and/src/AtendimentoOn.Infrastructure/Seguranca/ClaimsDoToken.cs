namespace AtendimentoOn.Infrastructure.Seguranca;

/// <summary>Nomes das claims próprias do sistema no token.</summary>
internal static class ClaimsDoToken
{
    /// <summary>"Aluno", "Funcionario", "Atendente" ou "Administrador".</summary>
    public const string Perfil = "role";

    /// <summary>Equipe de atendimento, só para atendentes e administradores.</summary>
    public const string Equipe = "equipe";
}
