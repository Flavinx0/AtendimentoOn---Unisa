namespace AtendimentoOn.Domain.Comum;

/// <summary>
/// Base dos erros esperados do sistema. A API transforma cada tipo em uma resposta HTTP 4xx,
/// e o front mostra a mensagem para o usuário. Por isso as mensagens são escritas para quem usa o sistema.
/// </summary>
public abstract class ExcecaoDeNegocio(string mensagem) : Exception(mensagem);

/// <summary>Dados ausentes ou fora do formato esperado (HTTP 400).</summary>
public sealed class DadosInvalidosException(string mensagem) : ExcecaoDeNegocio(mensagem);

/// <summary>A ação não é permitida para este usuário (HTTP 403).</summary>
public sealed class AcessoNegadoException(string mensagem) : ExcecaoDeNegocio(mensagem);

/// <summary>O recurso não existe, ou o usuário não pode vê-lo (HTTP 404).</summary>
public sealed class NaoEncontradoException(string mensagem) : ExcecaoDeNegocio(mensagem);

/// <summary>A ação conflita com o estado atual, por exemplo um chamado já encerrado (HTTP 409).</summary>
public sealed class RegraDeNegocioException(string mensagem) : ExcecaoDeNegocio(mensagem);
