using AtendimentoOn.Application.Abstracoes;
using AtendimentoOn.Domain.Usuarios;
using Microsoft.AspNetCore.Identity;

namespace AtendimentoOn.Infrastructure.Seguranca;

/// <summary>PBKDF2 com salt aleatório, o mesmo algoritmo do ASP.NET Core Identity.</summary>
public class SenhaHasher : ISenhaHasher
{
    private readonly PasswordHasher<Usuario> _hasher = new();

    public string GerarHash(Usuario usuario, string senha) => _hasher.HashPassword(usuario, senha);

    public bool Verificar(Usuario usuario, string senha) => ConfereHash(usuario, usuario.SenhaHash, senha);

    public bool ConfereHash(Usuario usuario, string hash, string valor)
    {
        if (string.IsNullOrEmpty(hash)) return false;
        try
        {
            return _hasher.VerifyHashedPassword(usuario, hash, valor) != PasswordVerificationResult.Failed;
        }
        catch (FormatException)
        {
            // Hash gravado num formato que não é o do PasswordHasher (por exemplo, inserido à mão no banco).
            return false;
        }
    }
}
