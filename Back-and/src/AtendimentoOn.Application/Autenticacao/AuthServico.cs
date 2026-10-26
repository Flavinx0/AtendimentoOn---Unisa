using AtendimentoOn.Application.Abstracoes;
using AtendimentoOn.Application.Comum;
using AtendimentoOn.Application.Usuarios;
using AtendimentoOn.Domain.Comum;
using AtendimentoOn.Domain.Usuarios;

namespace AtendimentoOn.Application.Autenticacao;

public class AuthServico(IUsuarioRepositorio usuarios, ISenhaHasher senhaHasher, IGeradorToken geradorToken)
{
    public async Task<LoginResposta> EntrarAsync(LoginRequisicao requisicao, CancellationToken cancelamento = default)
    {
        var email = Usuario.NormalizarEmail(requisicao.Email);
        var usuario = email.Length == 0 ? null : await usuarios.ObterPorEmailAsync(email, cancelamento);

        // A mesma mensagem para e-mail inexistente e senha errada, para não revelar quais e-mails têm conta.
        if (usuario is null || !senhaHasher.Verificar(usuario, requisicao.Senha ?? string.Empty))
            throw new CredenciaisInvalidasException("E-mail ou senha incorretos.");

        if (!usuario.Ativo)
            throw new AcessoNegadoException("Esta conta foi desativada. Fale com o Suporte de TI.");

        return new LoginResposta(geradorToken.Gerar(usuario), UsuarioDto.De(usuario));
    }
}
