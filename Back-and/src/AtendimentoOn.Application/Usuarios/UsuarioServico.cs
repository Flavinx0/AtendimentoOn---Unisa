using AtendimentoOn.Application.Abstracoes;
using AtendimentoOn.Application.Comum;
using AtendimentoOn.Domain.Comum;
using AtendimentoOn.Domain.Usuarios;

namespace AtendimentoOn.Application.Usuarios;

public class UsuarioServico(
    IUsuarioRepositorio usuarios,
    ISenhaHasher senhaHasher,
    IUnidadeDeTrabalho unidadeDeTrabalho)
{
    /// <summary>Cadastro público de aluno ou funcionário. Atendentes são criados pelo Suporte de TI.</summary>
    public async Task<UsuarioDto> CadastrarAsync(CadastroRequisicao requisicao, CancellationToken cancelamento = default)
    {
        var usuario = Usuario.CriarSolicitante(requisicao.Nome, requisicao.Email, requisicao.Perfil);
        var senha = RegrasDeSenha.Validar(requisicao.Senha);

        // RN02: e-mail único. O banco também tem um índice único, para dois cadastros ao mesmo tempo.
        if (await usuarios.EmailEmUsoAsync(usuario.Email, cancelamento))
            throw new RegraDeNegocioException("Já existe uma conta com este e-mail. Entre com ele ou use outro endereço.");

        usuario.DefinirSenhaEscolhida(senhaHasher.GerarHash(usuario, senha));
        usuarios.Adicionar(usuario);
        await unidadeDeTrabalho.SalvarAsync(cancelamento);

        return UsuarioDto.De(usuario);
    }

    public async Task<UsuarioDto> ObterAsync(Guid usuarioId, CancellationToken cancelamento = default)
    {
        var usuario = await usuarios.ObterPorIdAsync(usuarioId, cancelamento);
        if (usuario is null || !usuario.Ativo)
            throw new CredenciaisInvalidasException("Sua sessão não é mais válida. Entre novamente.");
        return UsuarioDto.De(usuario);
    }
}
