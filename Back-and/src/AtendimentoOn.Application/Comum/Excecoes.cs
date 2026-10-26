namespace AtendimentoOn.Application.Comum;

/// <summary>Login recusado, ou sessão que não vale mais (HTTP 401).</summary>
public sealed class CredenciaisInvalidasException(string mensagem) : Exception(mensagem);

/// <summary>Um serviço externo, como o Gemini, não respondeu (HTTP 503).</summary>
public sealed class ServicoIndisponivelException(string mensagem, Exception? causa = null) : Exception(mensagem, causa);
