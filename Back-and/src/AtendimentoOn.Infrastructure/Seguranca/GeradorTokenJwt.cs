using System.Security.Claims;
using AtendimentoOn.Application.Abstracoes;
using AtendimentoOn.Application.Autenticacao;
using AtendimentoOn.Domain.Usuarios;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace AtendimentoOn.Infrastructure.Seguranca;

public class GeradorTokenJwt(IOptions<JwtOpcoes> opcoes) : IGeradorToken
{
    public string Gerar(Usuario usuario)
    {
        var configuracao = opcoes.Value;

        // Claims com nomes curtos: o front lê "sub", "name", "email", "role" e "equipe".
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
            new(JwtRegisteredClaimNames.Name, usuario.Nome),
            new(JwtRegisteredClaimNames.Email, usuario.Email),
            new(ClaimsDoToken.Perfil, usuario.Perfil.ToString()),
        };
        if (usuario.Equipe is { } equipe) claims.Add(new Claim(ClaimsDoToken.Equipe, equipe.ToString()));

        // Enquanto a senha for a inicial do administrador, a API só aceita a troca de senha.
        if (usuario.PrecisaTrocarSenha) claims.Add(new Claim(ClaimsDaSessao.SenhaProvisoria, "true"));

        var descritor = new SecurityTokenDescriptor
        {
            Issuer = configuracao.Emissor,
            Audience = configuracao.Publico,
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddHours(configuracao.ExpiracaoHoras),
            SigningCredentials = new SigningCredentials(
                ChaveDeAssinatura.Criar(configuracao.Chave), SecurityAlgorithms.HmacSha256),
        };

        return new JsonWebTokenHandler().CreateToken(descritor);
    }
}
