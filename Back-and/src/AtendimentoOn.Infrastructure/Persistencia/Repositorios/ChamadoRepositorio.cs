using AtendimentoOn.Domain.Chamados;
using AtendimentoOn.Domain.Equipes;
using Microsoft.EntityFrameworkCore;

namespace AtendimentoOn.Infrastructure.Persistencia.Repositorios;

public class ChamadoRepositorio(AppDbContext contexto) : IChamadoRepositorio
{
    public async Task<IReadOnlyList<Chamado>> ListarAsync(
        Guid? solicitanteId, Equipe? equipe, IReadOnlyCollection<int>? cursos, CancellationToken cancelamento = default)
    {
        // Só leitura: sem rastreamento e sem as mensagens, que a lista não usa.
        IQueryable<Chamado> consulta = contexto.Chamados
            .AsNoTracking()
            .Include(c => c.Categoria)
            .Include(c => c.Curso)
            .Include(c => c.Solicitante)
            .Include(c => c.Atendente);

        // Na Coordenação, cada pessoa vê só os chamados dos cursos que coordena.
        var dosCursos = cursos?.ToArray();

        if (solicitanteId is Guid solicitante && equipe is Equipe daEquipe)
        {
            consulta = dosCursos is null
                ? consulta.Where(c => c.SolicitanteId == solicitante || c.Equipe == daEquipe)
                : consulta.Where(c => c.SolicitanteId == solicitante
                    || (c.Equipe == daEquipe && c.CursoId != null && dosCursos.Contains(c.CursoId.Value)));
        }
        else if (solicitanteId is Guid somenteSolicitante)
        {
            consulta = consulta.Where(c => c.SolicitanteId == somenteSolicitante);
        }
        else if (equipe is Equipe somenteEquipe)
        {
            consulta = dosCursos is null
                ? consulta.Where(c => c.Equipe == somenteEquipe)
                : consulta.Where(c => c.Equipe == somenteEquipe && c.CursoId != null && dosCursos.Contains(c.CursoId.Value));
        }

        return await consulta.OrderByDescending(c => c.CriadoEm).ToListAsync(cancelamento);
    }

    public Task<Chamado?> ObterComMensagensAsync(Guid id, CancellationToken cancelamento = default) =>
        contexto.Chamados
            .Include(c => c.Categoria)
            .Include(c => c.Curso)
            .Include(c => c.Solicitante)
            .Include(c => c.Atendente)
            .Include(c => c.Mensagens).ThenInclude(m => m.Autor)
            .AsSplitQuery()
            .FirstOrDefaultAsync(c => c.Id == id, cancelamento);

    public void Adicionar(Chamado chamado) => contexto.Chamados.Add(chamado);
}
