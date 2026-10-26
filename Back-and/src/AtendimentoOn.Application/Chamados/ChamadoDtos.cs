using AtendimentoOn.Domain.Chamados;
using AtendimentoOn.Domain.Equipes;

namespace AtendimentoOn.Application.Chamados;

/// <param name="CursoId">Curso do aluno. Obrigatório quando a categoria é da Coordenação.</param>
public record AbrirChamadoRequisicao(string Titulo, string Descricao, int CategoriaId, int? CursoId = null);

public record EnviarMensagemRequisicao(string Conteudo);

/// <summary>Formato "plano" que o front espera, com os nomes já resolvidos.</summary>
public class ChamadoDto
{
    public Guid Id { get; set; }
    public string Protocolo { get; set; } = string.Empty;
    public string Titulo { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public int CategoriaId { get; set; }
    public string CategoriaNome { get; set; } = string.Empty;

    /// <summary>Só nos chamados para a Coordenação.</summary>
    public int? CursoId { get; set; }

    /// <summary>Ex.: "Administração (Bacharelado, Presencial)".</summary>
    public string? CursoNome { get; set; }

    public StatusChamado Status { get; set; }
    public Equipe Equipe { get; set; }
    public Guid SolicitanteId { get; set; }
    public string SolicitanteNome { get; set; } = string.Empty;
    public Guid? AtendenteId { get; set; }
    public string? AtendenteNome { get; set; }
    public DateTime CriadoEm { get; set; }
    public DateTime? EncerradoEm { get; set; }
}

public class ChamadoDetalheDto : ChamadoDto
{
    public IReadOnlyList<MensagemDto> Mensagens { get; set; } = [];
}

public record MensagemDto(
    Guid Id,
    Guid? AutorId,
    string? AutorNome,
    OrigemMensagem Origem,
    string Conteudo,
    DateTime EnviadaEm);
