using AtendimentoOn.Domain.Categorias;
using AtendimentoOn.Domain.Comum;
using AtendimentoOn.Domain.Cursos;
using AtendimentoOn.Domain.Equipes;
using AtendimentoOn.Domain.Usuarios;

namespace AtendimentoOn.Domain.Chamados;

/// <summary>
/// Raiz do agregado de atendimento. Toda mudança de status passa por um método desta classe,
/// onde ficam as regras: qual equipe atende, quem assume, quem responde e quem encerra (RN01).
/// </summary>
public class Chamado
{
    public const int TamanhoMaximoTitulo = 120;
    public const int TamanhoMaximoDescricao = 4000;

    private readonly List<MensagemChamado> _mensagens = [];

    public Guid Id { get; private set; }

    /// <summary>Número sequencial gerado pelo banco. Forma o protocolo.</summary>
    public int Numero { get; private set; }

    public string Titulo { get; private set; } = string.Empty;
    public string Descricao { get; private set; } = string.Empty;
    public StatusChamado Status { get; private set; }

    /// <summary>Equipe que atende o chamado. Definida na abertura, pela categoria.</summary>
    public Equipe Equipe { get; private set; }

    public int CategoriaId { get; private set; }
    public Categoria Categoria { get; private set; } = null!;

    /// <summary>Curso do aluno. Só os chamados para a Coordenação têm curso: ele decide quem atende.</summary>
    public int? CursoId { get; private set; }
    public Curso? Curso { get; private set; }

    public Guid SolicitanteId { get; private set; }
    public Usuario Solicitante { get; private set; } = null!;

    public Guid? AtendenteId { get; private set; }
    public Usuario? Atendente { get; private set; }

    public DateTime CriadoEm { get; private set; }
    public DateTime? EncerradoEm { get; private set; }

    public IReadOnlyCollection<MensagemChamado> Mensagens => _mensagens.AsReadOnly();

    /// <summary>Ex.: ON-2026-0042. Calculado com o ano de abertura e o número.</summary>
    public string Protocolo => $"ON-{CriadoEm:yyyy}-{Numero:D4}";

    // Usado pelo Entity Framework ao ler do banco.
    private Chamado() { }

    public Chamado(string titulo, string descricao, Categoria categoria, Usuario solicitante, Curso? curso = null)
    {
        ArgumentNullException.ThrowIfNull(categoria);
        ArgumentNullException.ThrowIfNull(solicitante);
        if (!categoria.Ativa) throw new DadosInvalidosException("Escolha uma categoria válida.");

        Id = Guid.NewGuid();
        Titulo = Validacao.TextoObrigatorio(titulo, TamanhoMaximoTitulo,
            "Informe o assunto do chamado.", $"O assunto pode ter até {TamanhoMaximoTitulo} caracteres.");
        Descricao = Validacao.TextoObrigatorio(descricao, TamanhoMaximoDescricao,
            "Descreva o que você precisa.", $"A descrição pode ter até {TamanhoMaximoDescricao} caracteres.");
        Categoria = categoria;
        CategoriaId = categoria.Id;
        Equipe = categoria.Equipe;

        // A Coordenação é dividida por curso: sem o curso, o chamado não teria para onde ir.
        if (Equipe == Equipes.Equipe.Coordenacao)
        {
            if (curso is null || !curso.Ativo)
                throw new DadosInvalidosException("Escolha o seu curso para falar com a coordenação certa.");
            Curso = curso;
            CursoId = curso.Id;
        }

        Solicitante = solicitante;
        SolicitanteId = solicitante.Id;
        Status = StatusChamado.Aberto;
        CriadoEm = DateTime.UtcNow;
    }

    /// <summary>
    /// Quem abriu sempre vê o chamado. Atendentes veem os da própria equipe (na Coordenação, só os
    /// dos cursos que coordenam), e administradores veem os de todas as equipes.
    /// </summary>
    public bool PodeSerVistoPor(Usuario usuario) => usuario.Id == SolicitanteId || PodeSerAtendidoPor(usuario);

    /// <summary>
    /// Administradores e atendentes da equipe do chamado podem assumir e responder.
    /// Na Coordenação, o atendente também precisa coordenar o curso do chamado.
    /// </summary>
    public bool PodeSerAtendidoPor(Usuario usuario) =>
        usuario.EhAdministrador
        || (usuario.EhAtendente
            && usuario.Equipe == Equipe
            && (Equipe != Equipes.Equipe.Coordenacao || usuario.CoordenaCurso(CursoId)));

    /// <summary>O atendente passa a ser o responsável. Aberto → EmAtendimento.</summary>
    public void Assumir(Usuario atendente)
    {
        ArgumentNullException.ThrowIfNull(atendente);
        if (!atendente.EhAtendente)
            throw new AcessoNegadoException("Só atendentes podem assumir chamados.");
        if (!PodeSerAtendidoPor(atendente))
        {
            throw new AcessoNegadoException(atendente.Equipe == Equipe
                ? "Este chamado é de um curso que você não coordena."
                : $"Este chamado é da equipe {Equipe.Nome()}.");
        }
        GarantirQueEstaAberto();
        if (AtendenteId is not null && AtendenteId != atendente.Id)
            throw new RegraDeNegocioException($"Este chamado já está com {Atendente?.Nome ?? "outro atendente"}.");

        Atendente = atendente;
        AtendenteId = atendente.Id;
        if (Status == StatusChamado.Aberto) Status = StatusChamado.EmAtendimento;
    }

    /// <summary>
    /// Só o solicitante e o atendente responsável escrevem.
    /// Resposta do atendente → AguardandoUsuario. Retorno do solicitante → EmAtendimento.
    /// </summary>
    public MensagemChamado AdicionarMensagem(Usuario autor, string conteudo)
    {
        ArgumentNullException.ThrowIfNull(autor);
        GarantirQueEstaAberto();

        var ehResponsavel = AtendenteId == autor.Id;
        var ehSolicitante = SolicitanteId == autor.Id;
        if (!ehResponsavel && !ehSolicitante)
        {
            throw new AcessoNegadoException(autor.EhAtendente
                ? "Assuma o chamado antes de responder."
                : "Só quem abriu o chamado e o atendente responsável podem enviar mensagens.");
        }

        var origem = ehResponsavel ? OrigemMensagem.Atendente : OrigemMensagem.Usuario;
        var mensagem = new MensagemChamado(Id, autor, origem, conteudo);
        _mensagens.Add(mensagem);

        if (ehResponsavel) Status = StatusChamado.AguardandoUsuario;
        else if (Status == StatusChamado.AguardandoUsuario) Status = StatusChamado.EmAtendimento;

        return mensagem;
    }

    /// <summary>RN01: só quem abriu o chamado ou o atendente responsável pode encerrá-lo.</summary>
    public void Encerrar(Usuario usuario)
    {
        ArgumentNullException.ThrowIfNull(usuario);
        if (usuario.Id != SolicitanteId && usuario.Id != AtendenteId)
            throw new AcessoNegadoException("Só quem abriu o chamado ou o atendente responsável pode encerrá-lo.");
        if (Status == StatusChamado.Encerrado) return;

        Status = StatusChamado.Encerrado;
        EncerradoEm = DateTime.UtcNow;
    }

    private void GarantirQueEstaAberto()
    {
        if (Status == StatusChamado.Encerrado)
            throw new RegraDeNegocioException("Este chamado já foi encerrado. Se precisar, abra um novo chamado.");
    }
}
