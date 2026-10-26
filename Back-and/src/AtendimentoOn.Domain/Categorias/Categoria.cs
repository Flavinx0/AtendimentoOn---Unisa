using AtendimentoOn.Domain.Comum;
using AtendimentoOn.Domain.Equipes;

namespace AtendimentoOn.Domain.Categorias;

public class Categoria
{
    public const int TamanhoMaximoNome = 80;

    public int Id { get; private set; }
    public string Nome { get; private set; } = string.Empty;
    public bool Ativa { get; private set; } = true;

    /// <summary>Equipe que recebe os chamados desta categoria.</summary>
    public Equipe Equipe { get; private set; }

    private Categoria() { }

    public Categoria(int id, string nome, Equipe equipe)
    {
        if (!Enum.IsDefined(equipe)) throw new DadosInvalidosException("Escolha uma equipe válida.");

        Id = id;
        Nome = Validacao.TextoObrigatorio(nome, TamanhoMaximoNome,
            "Informe o nome da categoria.", $"O nome da categoria pode ter até {TamanhoMaximoNome} caracteres.");
        Equipe = equipe;
    }

    /// <summary>Categorias desativadas somem da lista, mas os chamados antigos continuam com elas.</summary>
    public void Desativar() => Ativa = false;
}
