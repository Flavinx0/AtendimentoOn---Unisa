using AtendimentoOn.Application.Comum;
using AtendimentoOn.Domain.Categorias;
using AtendimentoOn.Domain.Chamados;
using AtendimentoOn.Domain.Comum;
using AtendimentoOn.Domain.Cursos;
using AtendimentoOn.Domain.Equipes;
using AtendimentoOn.Domain.Usuarios;

namespace AtendimentoOn.Application.Chamados;

public class ChamadoServico(
    IChamadoRepositorio chamados,
    ICategoriaRepositorio categorias,
    ICursoRepositorio cursos,
    IUsuarioRepositorio usuarios,
    IUnidadeDeTrabalho unidadeDeTrabalho)
{
    /// <summary>
    /// Administrador vê todos os chamados. Atendente vê os da própria equipe e os que abriu;
    /// na Coordenação, só os dos cursos que coordena. Aluno e funcionário veem só os seus.
    /// </summary>
    public async Task<IReadOnlyList<ChamadoDto>> ListarAsync(Guid usuarioId, CancellationToken cancelamento = default)
    {
        var usuario = await ObterUsuarioAsync(usuarioId, cancelamento);

        IReadOnlyList<Chamado> lista;
        if (usuario.EhAdministrador)
        {
            lista = await chamados.ListarAsync(null, null, null, cancelamento);
        }
        else if (usuario.EhAtendente)
        {
            var cursosCoordenados = usuario.Equipe == Equipe.Coordenacao
                ? usuario.Cursos.Select(c => c.Id).ToList()
                : null;
            lista = await chamados.ListarAsync(usuario.Id, usuario.Equipe, cursosCoordenados, cancelamento);
        }
        else
        {
            lista = await chamados.ListarAsync(usuario.Id, null, null, cancelamento);
        }

        return lista.Select(MapeamentoChamado.ParaDto).ToList();
    }

    public async Task<ChamadoDetalheDto> ObterAsync(Guid chamadoId, Guid usuarioId, CancellationToken cancelamento = default)
    {
        var usuario = await ObterUsuarioAsync(usuarioId, cancelamento);
        var chamado = await ObterVisivelAsync(chamadoId, usuario, cancelamento);
        return MapeamentoChamado.ParaDetalheDto(chamado);
    }

    public async Task<ChamadoDto> AbrirAsync(AbrirChamadoRequisicao requisicao, Guid usuarioId, CancellationToken cancelamento = default)
    {
        var usuario = await ObterUsuarioAsync(usuarioId, cancelamento);
        var categoria = await categorias.ObterAtivaPorIdAsync(requisicao.CategoriaId, cancelamento)
            ?? throw new DadosInvalidosException("Escolha uma categoria válida.");

        // Para a Coordenação, o curso escolhido decide quem atende.
        Curso? curso = null;
        if (categoria.Equipe == Equipe.Coordenacao)
        {
            curso = requisicao.CursoId is int cursoId ? await cursos.ObterAtivoPorIdAsync(cursoId, cancelamento) : null;
            if (curso is null) throw new DadosInvalidosException("Escolha o seu curso para falar com a coordenação certa.");
        }

        var chamado = new Chamado(requisicao.Titulo, requisicao.Descricao, categoria, usuario, curso);
        chamados.Adicionar(chamado);
        await unidadeDeTrabalho.SalvarAsync(cancelamento); // aqui o banco gera o número do protocolo

        return MapeamentoChamado.ParaDto(chamado);
    }

    public async Task<MensagemDto> EnviarMensagemAsync(
        Guid chamadoId, EnviarMensagemRequisicao requisicao, Guid usuarioId, CancellationToken cancelamento = default)
    {
        var usuario = await ObterUsuarioAsync(usuarioId, cancelamento);
        var chamado = await ObterVisivelAsync(chamadoId, usuario, cancelamento);

        var mensagem = chamado.AdicionarMensagem(usuario, requisicao.Conteudo);
        await unidadeDeTrabalho.SalvarAsync(cancelamento);

        return MapeamentoChamado.ParaMensagemDto(mensagem);
    }

    public async Task AssumirAsync(Guid chamadoId, Guid usuarioId, CancellationToken cancelamento = default)
    {
        var usuario = await ObterUsuarioAsync(usuarioId, cancelamento);
        var chamado = await ObterVisivelAsync(chamadoId, usuario, cancelamento);

        chamado.Assumir(usuario);
        await unidadeDeTrabalho.SalvarAsync(cancelamento);
    }

    public async Task EncerrarAsync(Guid chamadoId, Guid usuarioId, CancellationToken cancelamento = default)
    {
        var usuario = await ObterUsuarioAsync(usuarioId, cancelamento);
        var chamado = await ObterVisivelAsync(chamadoId, usuario, cancelamento);

        chamado.Encerrar(usuario); // RN01
        await unidadeDeTrabalho.SalvarAsync(cancelamento);
    }

    private async Task<Usuario> ObterUsuarioAsync(Guid usuarioId, CancellationToken cancelamento)
    {
        // Conta desativada perde o acesso na hora, mesmo com um token ainda válido.
        var usuario = await usuarios.ObterPorIdAsync(usuarioId, cancelamento);
        if (usuario is null || !usuario.Ativo)
            throw new CredenciaisInvalidasException("Sua sessão não é mais válida. Entre novamente.");
        return usuario;
    }

    private async Task<Chamado> ObterVisivelAsync(Guid chamadoId, Usuario usuario, CancellationToken cancelamento)
    {
        var chamado = await chamados.ObterComMensagensAsync(chamadoId, cancelamento);

        // Quem não pode ver o chamado recebe "não encontrado", para não revelar que ele existe.
        if (chamado is null || !chamado.PodeSerVistoPor(usuario))
            throw new NaoEncontradoException("Chamado não encontrado.");

        return chamado;
    }
}
