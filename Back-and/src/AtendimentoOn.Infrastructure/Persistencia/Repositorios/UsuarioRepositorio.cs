using AtendimentoOn.Domain.Usuarios;
using Microsoft.EntityFrameworkCore;

namespace AtendimentoOn.Infrastructure.Persistencia.Repositorios;

// Consultas com rastreamento: o usuário retornado pode ser usado para alterar chamados na mesma operação.
// Os cursos vêm junto: decidem quais chamados quem está na Coordenação pode ver e atender.
public class UsuarioRepositorio(AppDbContext contexto) : IUsuarioRepositorio
{
    public Task<Usuario?> ObterPorIdAsync(Guid id, CancellationToken cancelamento = default) =>
        contexto.Usuarios.Include(u => u.Cursos).FirstOrDefaultAsync(u => u.Id == id, cancelamento);

    public Task<Usuario?> ObterPorEmailAsync(string email, CancellationToken cancelamento = default) =>
        contexto.Usuarios.Include(u => u.Cursos).FirstOrDefaultAsync(u => u.Email == email, cancelamento);

    public Task<bool> EmailEmUsoAsync(string email, CancellationToken cancelamento = default) =>
        contexto.Usuarios.AnyAsync(u => u.Email == email, cancelamento);

    public async Task<IReadOnlyList<Usuario>> ListarAtendimentoAsync(CancellationToken cancelamento = default) =>
        await contexto.Usuarios
            .AsNoTracking()
            .Include(u => u.Cursos)
            .Where(u => u.Perfil == Perfil.Atendente || u.Perfil == Perfil.Administrador)
            .OrderBy(u => u.Nome)
            .ToListAsync(cancelamento);

    public void Adicionar(Usuario usuario) => contexto.Usuarios.Add(usuario);
}
