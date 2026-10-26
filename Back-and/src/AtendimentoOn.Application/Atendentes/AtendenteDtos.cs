using AtendimentoOn.Application.Cursos;
using AtendimentoOn.Domain.Equipes;
using AtendimentoOn.Domain.Usuarios;

namespace AtendimentoOn.Application.Atendentes;

public record AtendenteDto(
    Guid Id,
    string Nome,
    string Email,
    Perfil Perfil,
    Equipe? Equipe,
    bool Ativo,
    DateTime CriadoEm,
    IReadOnlyList<CursoDto> Cursos,
    bool PrecisaTrocarSenha)
{
    public static AtendenteDto De(Usuario usuario) => new(
        usuario.Id,
        usuario.Nome,
        usuario.Email,
        usuario.Perfil,
        usuario.Equipe,
        usuario.Ativo,
        DateTime.SpecifyKind(usuario.CriadoEm, DateTimeKind.Utc),
        usuario.Cursos.OrderBy(c => c.Nome).Select(CursoDto.De).ToList(),
        usuario.PrecisaTrocarSenha);
}

/// <param name="Nome">Nome do atendente.</param>
/// <param name="Email">E-mail usado no login.</param>
/// <param name="Senha">Senha inicial, que o administrador passa para a pessoa.</param>
/// <param name="Equipe">Equipe em que a pessoa vai atender.</param>
/// <param name="Administrador">true para dar acesso de administrador (só no Suporte de TI).</param>
/// <param name="Cursos">Ids dos cursos que a pessoa coordena. Obrigatório (pelo menos um) na Coordenação.</param>
public record NovoAtendenteRequisicao(
    string Nome, string Email, string Senha, Equipe Equipe, bool Administrador, IReadOnlyList<int>? Cursos = null);

/// <param name="Equipe">Equipe em que a pessoa atende.</param>
/// <param name="Administrador">Se a pessoa é administradora (só no Suporte de TI).</param>
/// <param name="Ativo">false desativa a conta: a pessoa não entra mais no sistema.</param>
/// <param name="Cursos">Ids dos cursos que a pessoa coordena. Obrigatório (pelo menos um) na Coordenação.</param>
public record AtualizarAtendenteRequisicao(Equipe Equipe, bool Administrador, bool Ativo, IReadOnlyList<int>? Cursos = null);
