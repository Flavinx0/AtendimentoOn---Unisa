namespace AtendimentoOn.Application.Autenticacao;

/// <summary>Claims do token que a API confere em toda requisição.</summary>
public static class ClaimsDaSessao
{
    /// <summary>
    /// "true" quando a pessoa ainda está com a senha inicial criada pelo administrador.
    /// Com ela, a API só aceita a troca de senha (e o login).
    /// </summary>
    public const string SenhaProvisoria = "senha_provisoria";
}
