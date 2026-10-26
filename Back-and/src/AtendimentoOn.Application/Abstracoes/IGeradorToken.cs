using AtendimentoOn.Domain.Usuarios;

namespace AtendimentoOn.Application.Abstracoes;

/// <summary>Gera o token JWT entregue no login.</summary>
public interface IGeradorToken
{
    string Gerar(Usuario usuario);
}
