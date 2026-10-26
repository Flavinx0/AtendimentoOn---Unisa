using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace AtendimentoOn.Infrastructure.Seguranca;

internal static class ChaveDeAssinatura
{
    public static SymmetricSecurityKey Criar(string chave) => new(Encoding.UTF8.GetBytes(chave));
}
