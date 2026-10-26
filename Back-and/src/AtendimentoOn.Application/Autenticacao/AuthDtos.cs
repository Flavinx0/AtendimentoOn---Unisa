using AtendimentoOn.Application.Usuarios;

namespace AtendimentoOn.Application.Autenticacao;

public record LoginRequisicao(string Email, string Senha);

public record LoginResposta(string Token, UsuarioDto Usuario);

/// <param name="SenhaAtual">A senha usada para entrar (no primeiro acesso, a senha inicial do administrador).</param>
/// <param name="NovaSenha">A senha que a pessoa escolheu.</param>
public record TrocarSenhaRequisicao(string SenhaAtual, string NovaSenha);

/// <param name="Email">E-mail da conta. A resposta é a mesma exista a conta ou não.</param>
public record EsqueciSenhaRequisicao(string Email);

/// <param name="Email">E-mail da conta.</param>
/// <param name="Codigo">Código de 6 dígitos recebido por e-mail.</param>
/// <param name="NovaSenha">A senha que a pessoa escolheu.</param>
public record RedefinirSenhaRequisicao(string Email, string Codigo, string NovaSenha);
