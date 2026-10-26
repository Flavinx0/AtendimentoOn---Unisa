using AtendimentoOn.Application.Abstracoes;
using AtendimentoOn.Application.Comum;
using AtendimentoOn.Domain.Comum;
using AtendimentoOn.Domain.Cursos;
using AtendimentoOn.Domain.Equipes;
using AtendimentoOn.Domain.Usuarios;

namespace AtendimentoOn.Application.Atendentes;

/// <summary>
/// Gestão da equipe de atendimento. Só administradores (Suporte de TI) usam:
/// ninguém consegue se cadastrar sozinho como atendente.
/// </summary>
public class AtendenteServico(
    IUsuarioRepositorio usuarios,
    ICursoRepositorio cursos,
    ISenhaHasher senhaHasher,
    IUnidadeDeTrabalho unidadeDeTrabalho)
{
    public async Task<IReadOnlyList<AtendenteDto>> ListarAsync(Guid administradorId, CancellationToken cancelamento = default)
    {
        await ObterAdministradorAsync(administradorId, cancelamento);
        var lista = await usuarios.ListarAtendimentoAsync(cancelamento);
        return lista.Select(AtendenteDto.De).ToList();
    }

    public async Task<AtendenteDto> CadastrarAsync(
        Guid administradorId, NovoAtendenteRequisicao requisicao, CancellationToken cancelamento = default)
    {
        await ObterAdministradorAsync(administradorId, cancelamento);

        var atendente = Usuario.CriarAtendente(requisicao.Nome, requisicao.Email, requisicao.Equipe, requisicao.Administrador);
        var senha = RegrasDeSenha.Validar(requisicao.Senha);
        atendente.DefinirCursos(await CarregarCursosAsync(requisicao.Equipe, requisicao.Cursos, cancelamento));

        if (await usuarios.EmailEmUsoAsync(atendente.Email, cancelamento))
            throw new RegraDeNegocioException("Já existe uma conta com este e-mail.");

        // A senha inicial é do administrador: no primeiro acesso, a pessoa troca por uma dela.
        atendente.DefinirSenhaProvisoria(senhaHasher.GerarHash(atendente, senha));
        usuarios.Adicionar(atendente);
        await unidadeDeTrabalho.SalvarAsync(cancelamento);

        return AtendenteDto.De(atendente);
    }

    public async Task<AtendenteDto> AtualizarAsync(
        Guid administradorId, Guid atendenteId, AtualizarAtendenteRequisicao requisicao, CancellationToken cancelamento = default)
    {
        var administrador = await ObterAdministradorAsync(administradorId, cancelamento);
        var atendente = await usuarios.ObterPorIdAsync(atendenteId, cancelamento);
        if (atendente is null || !atendente.EhAtendente)
            throw new NaoEncontradoException("Atendente não encontrado.");

        // Evita que o sistema fique sem ninguém para gerenciar a equipe.
        if (atendente.Id == administrador.Id && (!requisicao.Ativo || !requisicao.Administrador))
            throw new RegraDeNegocioException("Você não pode desativar a própria conta nem tirar o próprio acesso de administrador.");

        atendente.AlterarAtendimento(requisicao.Equipe, requisicao.Administrador);
        atendente.DefinirCursos(await CarregarCursosAsync(requisicao.Equipe, requisicao.Cursos, cancelamento));
        if (requisicao.Ativo) atendente.Reativar();
        else atendente.Desativar();

        await unidadeDeTrabalho.SalvarAsync(cancelamento);
        return AtendenteDto.De(atendente);
    }

    /// <summary>
    /// Na Coordenação, cada pessoa atende os cursos a que está vinculada. Nas outras equipes não há cursos.
    /// </summary>
    private async Task<IReadOnlyList<Curso>> CarregarCursosAsync(
        Equipe equipe, IReadOnlyList<int>? ids, CancellationToken cancelamento)
    {
        if (equipe != Equipe.Coordenacao) return [];

        var distintos = (ids ?? []).Distinct().ToList();
        if (distintos.Count == 0)
            throw new DadosInvalidosException("Escolha pelo menos um curso para quem atende na Coordenação.");

        var encontrados = await cursos.ObterAtivosPorIdsAsync(distintos, cancelamento);
        if (encontrados.Count != distintos.Count)
            throw new DadosInvalidosException("Algum dos cursos escolhidos não está mais disponível. Atualize a página e tente de novo.");

        return encontrados;
    }

    private async Task<Usuario> ObterAdministradorAsync(Guid administradorId, CancellationToken cancelamento)
    {
        var usuario = await usuarios.ObterPorIdAsync(administradorId, cancelamento);
        if (usuario is null || !usuario.Ativo)
            throw new CredenciaisInvalidasException("Sua sessão não é mais válida. Entre novamente.");
        if (!usuario.EhAdministrador)
            throw new AcessoNegadoException("Só administradores do Suporte de TI gerenciam a equipe de atendimento.");
        return usuario;
    }
}
