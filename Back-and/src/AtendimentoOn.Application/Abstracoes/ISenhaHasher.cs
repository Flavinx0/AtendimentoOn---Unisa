using AtendimentoOn.Domain.Usuarios;

namespace AtendimentoOn.Application.Abstracoes;

/// <summary>Gera e confere hashes de senhas e de códigos de recuperação. O valor em si nunca é gravado.</summary>
public interface ISenhaHasher
{
    string GerarHash(Usuario usuario, string senha);

    /// <summary>Confere a senha com a senha atual da pessoa.</summary>
    bool Verificar(Usuario usuario, string senha);

    /// <summary>Confere um valor com um hash qualquer, como o de um código de recuperação.</summary>
    bool ConfereHash(Usuario usuario, string hash, string valor);
}
