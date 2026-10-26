using AtendimentoOn.Domain.Comum;

namespace AtendimentoOn.Domain.Cursos;

/// <summary>
/// Curso de graduação da Unisa. Cada curso tem a sua coordenação: os chamados da categoria
/// "Coordenação de curso" vão para quem coordena o curso escolhido pelo aluno.
/// </summary>
public class Curso
{
    public const int TamanhoMaximoNome = 120;

    public int Id { get; private set; }
    public string Nome { get; private set; } = string.Empty;
    public GrauDoCurso Grau { get; private set; }
    public ModalidadeDoCurso Modalidade { get; private set; }

    /// <summary>Cursos desativados somem da lista, mas os chamados antigos continuam com eles.</summary>
    public bool Ativo { get; private set; } = true;

    /// <summary>Ex.: "Administração (Bacharelado, Presencial)". O mesmo curso pode existir em mais de uma modalidade.</summary>
    public string NomeCompleto => $"{Nome} ({Grau.Nome()}, {Modalidade.Nome()})";

    // Usado pelo Entity Framework ao ler do banco.
    private Curso() { }

    public Curso(int id, string nome, GrauDoCurso grau, ModalidadeDoCurso modalidade)
    {
        if (!Enum.IsDefined(grau)) throw new DadosInvalidosException("Escolha um grau válido.");
        if (!Enum.IsDefined(modalidade)) throw new DadosInvalidosException("Escolha uma modalidade válida.");

        Id = id;
        Nome = Validacao.TextoObrigatorio(nome, TamanhoMaximoNome,
            "Informe o nome do curso.", $"O nome do curso pode ter até {TamanhoMaximoNome} caracteres.");
        Grau = grau;
        Modalidade = modalidade;
    }

    public void Desativar() => Ativo = false;
}
