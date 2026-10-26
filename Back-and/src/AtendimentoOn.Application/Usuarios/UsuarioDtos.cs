using AtendimentoOn.Application.Cursos;
using AtendimentoOn.Domain.Equipes;
using AtendimentoOn.Domain.Usuarios;

namespace AtendimentoOn.Application.Usuarios;

/// <param name="Cursos">Cursos que a pessoa coordena (só para quem está na Coordenação).</param>
/// <param name="PrecisaTrocarSenha">true enquanto a pessoa estiver com a senha inicial criada pelo administrador.</param>
public record UsuarioDto(
    Guid Id, string Nome, string Email, Perfil Perfil, Equipe? Equipe, IReadOnlyList<CursoDto> Cursos, bool PrecisaTrocarSenha)
{
    public static UsuarioDto De(Usuario usuario) =>
        new(usuario.Id, usuario.Nome, usuario.Email, usuario.Perfil, usuario.Equipe,
            usuario.Cursos.OrderBy(c => c.Nome).Select(CursoDto.De).ToList(), usuario.PrecisaTrocarSenha);
}

/// <summary>Cadastro público: só os perfis Aluno e Funcionario.</summary>
public record CadastroRequisicao(string Nome, string Email, string Senha, Perfil Perfil);
