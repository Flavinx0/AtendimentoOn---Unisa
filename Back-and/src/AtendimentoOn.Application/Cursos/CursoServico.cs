using AtendimentoOn.Domain.Cursos;

namespace AtendimentoOn.Application.Cursos;

/// <param name="Id">Identificador do curso.</param>
/// <param name="Nome">Nome do curso, sem o grau e a modalidade.</param>
/// <param name="Grau">Bacharelado, Licenciatura ou Tecnologo.</param>
/// <param name="Modalidade">Presencial, EaD ou Semipresencial.</param>
public record CursoDto(int Id, string Nome, GrauDoCurso Grau, ModalidadeDoCurso Modalidade)
{
    public static CursoDto De(Curso curso) => new(curso.Id, curso.Nome, curso.Grau, curso.Modalidade);
}

public class CursoServico(ICursoRepositorio cursos)
{
    /// <summary>Cursos de graduação da Unisa, usados ao abrir um chamado para a coordenação.</summary>
    public async Task<IReadOnlyList<CursoDto>> ListarAsync(CancellationToken cancelamento = default)
    {
        var lista = await cursos.ListarAtivosAsync(cancelamento);
        return lista.Select(CursoDto.De).ToList();
    }
}
