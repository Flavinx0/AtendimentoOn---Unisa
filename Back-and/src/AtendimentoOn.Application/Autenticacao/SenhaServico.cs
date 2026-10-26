using System.Security.Cryptography;
using AtendimentoOn.Application.Abstracoes;
using AtendimentoOn.Application.Comum;
using AtendimentoOn.Application.Usuarios;
using AtendimentoOn.Domain.Comum;
using AtendimentoOn.Domain.Usuarios;

namespace AtendimentoOn.Application.Autenticacao;

/// <summary>Troca de senha (inclusive a da senha inicial) e recuperação com código por e-mail.</summary>
public class SenhaServico(
    IUsuarioRepositorio usuarios,
    ICodigoDeRecuperacaoRepositorio codigos,
    ISenhaHasher senhaHasher,
    IGeradorToken geradorToken,
    IEnviadorDeEmail enviadorDeEmail,
    IUnidadeDeTrabalho unidadeDeTrabalho)
{
    /// <summary>Intervalo mínimo entre dois códigos para a mesma conta, para ninguém lotar a caixa de entrada de outra pessoa.</summary>
    public static readonly TimeSpan IntervaloEntreCodigos = TimeSpan.FromMinutes(1);

    // A mesma mensagem para código errado, vencido, já usado ou e-mail sem conta: não revela quais e-mails têm conta.
    private const string CodigoRecusado = "Código incorreto ou vencido. Confira o e-mail ou peça um código novo.";

    /// <summary>
    /// Troca a senha de quem está logado. No primeiro acesso de um atendente, é aqui que a senha inicial
    /// do administrador vira uma senha da própria pessoa. Devolve um token novo, já sem a marca de senha provisória.
    /// </summary>
    public async Task<LoginResposta> TrocarAsync(
        Guid usuarioId, TrocarSenhaRequisicao requisicao, CancellationToken cancelamento = default)
    {
        var usuario = await usuarios.ObterPorIdAsync(usuarioId, cancelamento);
        if (usuario is null || !usuario.Ativo)
            throw new CredenciaisInvalidasException("Sua sessão não é mais válida. Entre novamente.");

        // 400, e não 401: senha atual errada não encerra a sessão.
        if (!senhaHasher.Verificar(usuario, requisicao.SenhaAtual ?? string.Empty))
            throw new DadosInvalidosException("A senha atual não confere.");

        var novaSenha = RegrasDeSenha.Validar(requisicao.NovaSenha);
        if (senhaHasher.Verificar(usuario, novaSenha))
            throw new DadosInvalidosException("Escolha uma senha diferente da atual.");

        usuario.DefinirSenhaEscolhida(senhaHasher.GerarHash(usuario, novaSenha));
        await unidadeDeTrabalho.SalvarAsync(cancelamento);

        return new LoginResposta(geradorToken.Gerar(usuario), UsuarioDto.De(usuario));
    }

    /// <summary>
    /// "Esqueci minha senha": envia um código de 6 dígitos para o e-mail da conta. Para não revelar quais
    /// e-mails têm conta, termina do mesmo jeito quando a conta não existe ou está desativada.
    /// </summary>
    public async Task SolicitarCodigoAsync(EsqueciSenhaRequisicao requisicao, CancellationToken cancelamento = default)
    {
        var email = Usuario.NormalizarEmail(requisicao.Email);
        if (email.Length == 0) throw new DadosInvalidosException("Informe o e-mail.");

        var usuario = await usuarios.ObterPorEmailAsync(email, cancelamento);
        if (usuario is null || !usuario.Ativo) return;

        var agora = DateTime.UtcNow;
        var anterior = await codigos.ObterMaisRecenteAsync(usuario.Id, cancelamento);
        if (anterior is not null && agora - anterior.CriadoEm < IntervaloEntreCodigos) return;

        var codigo = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
        codigos.Adicionar(new CodigoDeRecuperacao(usuario.Id, senhaHasher.GerarHash(usuario, codigo), agora));
        await unidadeDeTrabalho.SalvarAsync(cancelamento);

        await enviadorDeEmail.EnviarAsync(MensagensDeEmail.CodigoParaNovaSenha(usuario, codigo), cancelamento);
    }

    /// <summary>Cria a senha nova com o código recebido por e-mail.</summary>
    public async Task RedefinirAsync(RedefinirSenhaRequisicao requisicao, CancellationToken cancelamento = default)
    {
        // Senha fora das regras não gasta tentativa do código.
        var novaSenha = RegrasDeSenha.Validar(requisicao.NovaSenha);
        var digitado = (requisicao.Codigo ?? string.Empty).Trim();

        var email = Usuario.NormalizarEmail(requisicao.Email);
        var usuario = email.Length == 0 ? null : await usuarios.ObterPorEmailAsync(email, cancelamento);
        if (usuario is null || !usuario.Ativo) throw new DadosInvalidosException(CodigoRecusado);

        var codigo = await codigos.ObterMaisRecenteAsync(usuario.Id, cancelamento);
        var agora = DateTime.UtcNow;
        if (codigo is null || !codigo.PodeSerUsado(agora)) throw new DadosInvalidosException(CodigoRecusado);

        if (digitado.Length != 6 || !senhaHasher.ConfereHash(usuario, codigo.CodigoHash, digitado))
        {
            // Depois de algumas tentativas erradas, o código deixa de valer.
            codigo.RegistrarTentativaErrada();
            await unidadeDeTrabalho.SalvarAsync(cancelamento);
            throw new DadosInvalidosException(CodigoRecusado);
        }

        codigo.MarcarComoUsado(agora);
        usuario.DefinirSenhaEscolhida(senhaHasher.GerarHash(usuario, novaSenha));
        await unidadeDeTrabalho.SalvarAsync(cancelamento);
    }
}
