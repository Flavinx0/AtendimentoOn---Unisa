using AtendimentoOn.Application.Chatbot;

namespace AtendimentoOn.Application.Abstracoes;

/// <summary>Gera as respostas automáticas do chat. A implementação usa o Gemini (ADR-002).</summary>
public interface IAssistenteVirtual
{
    Task<RespostaAssistenteDto> ResponderAsync(
        string pergunta,
        IReadOnlyList<MensagemHistoricoDto> historico,
        CancellationToken cancelamento = default);
}
