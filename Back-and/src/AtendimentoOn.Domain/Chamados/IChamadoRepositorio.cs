using AtendimentoOn.Domain.Equipes;

namespace AtendimentoOn.Domain.Chamados;

public interface IChamadoRepositorio
{
    /// <summary>
    /// Sem filtros, traz todos os chamados. Com filtros, traz os abertos por <paramref name="solicitanteId"/>
    /// e também os da <paramref name="equipe"/>. Com <paramref name="cursos"/>, os da equipe ficam
    /// restritos a esses cursos (é assim que cada coordenação vê só os seus).
    /// </summary>
    Task<IReadOnlyList<Chamado>> ListarAsync(
        Guid? solicitanteId, Equipe? equipe, IReadOnlyCollection<int>? cursos, CancellationToken cancelamento = default);

    /// <summary>Chamado com categoria, pessoas e mensagens, pronto para ser alterado.</summary>
    Task<Chamado?> ObterComMensagensAsync(Guid id, CancellationToken cancelamento = default);

    void Adicionar(Chamado chamado);
}
