using System.Net.Mail;
using AtendimentoOn.Domain.Comum;
using AtendimentoOn.Domain.Cursos;
using AtendimentoOn.Domain.Equipes;

namespace AtendimentoOn.Domain.Usuarios;

public class Usuario
{
    public const int TamanhoMaximoNome = 150;
    public const int TamanhoMaximoEmail = 200;

    private readonly List<Curso> _cursos = [];

    public Guid Id { get; private set; }
    public string Nome { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string SenhaHash { get; private set; } = string.Empty;
    public Perfil Perfil { get; private set; }

    /// <summary>
    /// A senha foi escolhida por outra pessoa: o administrador, ao criar a conta. Até a pessoa
    /// trocar por uma senha dela, o sistema só deixa trocar a senha.
    /// </summary>
    public bool PrecisaTrocarSenha { get; private set; }

    /// <summary>Equipe de atendimento. Só atendentes e administradores têm uma.</summary>
    public Equipe? Equipe { get; private set; }

    /// <summary>Cursos que a pessoa coordena. Só atendentes da Coordenação têm.</summary>
    public IReadOnlyCollection<Curso> Cursos => _cursos.AsReadOnly();

    public DateTime CriadoEm { get; private set; }

    /// <summary>Preenchido quando um administrador desativa a conta. Conta desativada não entra no sistema.</summary>
    public DateTime? DesativadoEm { get; private set; }

    public bool Ativo => DesativadoEm is null;
    public bool EhAdministrador => Perfil == Perfil.Administrador;

    /// <summary>Atende chamados: atendentes e administradores.</summary>
    public bool EhAtendente => Perfil is Perfil.Atendente or Perfil.Administrador;

    // Usado pelo Entity Framework ao ler do banco.
    private Usuario() { }

    private Usuario(string nome, string email, Perfil perfil, Equipe? equipe)
    {
        Id = Guid.NewGuid();
        Nome = Validacao.TextoObrigatorio(nome, TamanhoMaximoNome,
            "Informe o nome.", $"O nome pode ter até {TamanhoMaximoNome} caracteres.");
        Email = ValidarEmail(email);
        Perfil = perfil;
        Equipe = equipe;
        CriadoEm = DateTime.UtcNow;
    }

    /// <summary>Aluno ou funcionário, criado pelo cadastro público.</summary>
    public static Usuario CriarSolicitante(string nome, string email, Perfil perfil)
    {
        if (!Enum.IsDefined(perfil)) throw new DadosInvalidosException("Escolha um perfil válido.");
        if (perfil is not (Perfil.Aluno or Perfil.Funcionario))
            throw new AcessoNegadoException("Contas de atendimento são criadas pelo Suporte de TI.");
        return new Usuario(nome, email, perfil, null);
    }

    /// <summary>Atendente de uma equipe. Só um administrador cria essa conta.</summary>
    public static Usuario CriarAtendente(string nome, string email, Equipe equipe, bool administrador)
    {
        ValidarEquipe(equipe, administrador);
        return new Usuario(nome, email, administrador ? Perfil.Administrador : Perfil.Atendente, equipe);
    }

    /// <summary>Senha escolhida pela própria pessoa: no cadastro, na troca de senha ou no "Esqueci minha senha".</summary>
    public void DefinirSenhaEscolhida(string senhaHash)
    {
        GravarHash(senhaHash);
        PrecisaTrocarSenha = false;
    }

    /// <summary>Senha inicial definida pelo administrador. A pessoa troca no primeiro acesso.</summary>
    public void DefinirSenhaProvisoria(string senhaHash)
    {
        GravarHash(senhaHash);
        PrecisaTrocarSenha = true;
    }

    private void GravarHash(string senhaHash)
    {
        if (string.IsNullOrWhiteSpace(senhaHash))
            throw new ArgumentException("O hash da senha não pode ser vazio.", nameof(senhaHash));
        SenhaHash = senhaHash;
    }

    /// <summary>Muda a equipe de um atendente e se ele é administrador.</summary>
    public void AlterarAtendimento(Equipe equipe, bool administrador)
    {
        if (!EhAtendente) throw new RegraDeNegocioException("Só contas de atendimento têm equipe.");
        ValidarEquipe(equipe, administrador);
        Equipe = equipe;
        Perfil = administrador ? Perfil.Administrador : Perfil.Atendente;

        // Quem sai da Coordenação deixa de coordenar os cursos.
        if (equipe != Equipes.Equipe.Coordenacao) _cursos.Clear();
    }

    /// <summary>
    /// Vincula a pessoa aos cursos que ela coordena. Quem está na Coordenação precisa de pelo menos um curso.
    /// Nas outras equipes não há cursos: a lista fica vazia.
    /// </summary>
    public void DefinirCursos(IEnumerable<Curso> cursos)
    {
        ArgumentNullException.ThrowIfNull(cursos);
        var lista = cursos.DistinctBy(c => c.Id).ToList();

        if (Equipe != Equipes.Equipe.Coordenacao)
        {
            if (lista.Count > 0)
                throw new DadosInvalidosException("Só quem atende na Coordenação é vinculado a cursos.");
            _cursos.Clear();
            return;
        }

        if (lista.Count == 0)
            throw new DadosInvalidosException("Escolha pelo menos um curso para quem atende na Coordenação.");

        // Tira os que saíram e põe os novos, sem mexer nos que continuam.
        _cursos.RemoveAll(atual => lista.All(novo => novo.Id != atual.Id));
        var novos = lista.Where(novo => _cursos.All(atual => atual.Id != novo.Id)).ToList();
        _cursos.AddRange(novos);
    }

    /// <summary>A pessoa coordena o curso com este id.</summary>
    public bool CoordenaCurso(int? cursoId) => cursoId is int id && _cursos.Any(c => c.Id == id);

    public void Desativar() => DesativadoEm ??= DateTime.UtcNow;

    public void Reativar() => DesativadoEm = null;

    /// <summary>
    /// E-mails ficam sem espaços e em minúsculas. Assim a RN02 (e-mail único)
    /// não depende de como a pessoa digitou.
    /// </summary>
    public static string NormalizarEmail(string? email) => (email ?? string.Empty).Trim().ToLowerInvariant();

    private static void ValidarEquipe(Equipe equipe, bool administrador)
    {
        if (!Enum.IsDefined(equipe)) throw new DadosInvalidosException("Escolha uma equipe válida.");
        // "Equipes.Equipe" porque, dentro desta classe, "Equipe" sozinho é a propriedade.
        if (administrador && equipe != Equipes.Equipe.SuporteTI)
            throw new DadosInvalidosException("Administradores fazem parte do Suporte de TI.");
    }

    private static string ValidarEmail(string? email)
    {
        var normalizado = NormalizarEmail(email);
        if (normalizado.Length == 0)
            throw new DadosInvalidosException("Informe o e-mail.");
        if (normalizado.Length > TamanhoMaximoEmail)
            throw new DadosInvalidosException($"O e-mail pode ter até {TamanhoMaximoEmail} caracteres.");
        if (!MailAddress.TryCreate(normalizado, out var endereco)
            || endereco.Address != normalizado
            || !endereco.Host.Contains('.'))
            throw new DadosInvalidosException("Informe um e-mail válido.");
        return normalizado;
    }
}
