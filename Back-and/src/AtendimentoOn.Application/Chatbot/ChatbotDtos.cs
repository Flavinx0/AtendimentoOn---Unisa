namespace AtendimentoOn.Application.Chatbot;

/// <param name="Papel">"usuario" ou "assistente".</param>
/// <param name="Conteudo">Texto da mensagem.</param>
public record MensagemHistoricoDto(string Papel, string Conteudo);

/// <param name="Mensagem">A pergunta atual.</param>
/// <param name="Historico">Mensagens anteriores da conversa, para o assistente manter o contexto.</param>
public record PerguntaAssistenteRequisicao(string Mensagem, IReadOnlyList<MensagemHistoricoDto>? Historico);

/// <param name="Resposta">Texto da resposta.</param>
/// <param name="Escalar">true quando o caso precisa de um atendente; o front oferece abrir um chamado.</param>
public record RespostaAssistenteDto(string Resposta, bool Escalar);
