using AtendimentoOn.Application.Abstracoes;
using AtendimentoOn.Domain.Comum;

namespace AtendimentoOn.Application.Chatbot;

public class ChatbotServico(IAssistenteVirtual assistente)
{
    public const int TamanhoMaximoPergunta = 2000;
    public const int LimiteDoHistorico = 20;

    public Task<RespostaAssistenteDto> PerguntarAsync(PerguntaAssistenteRequisicao requisicao, CancellationToken cancelamento = default)
    {
        var pergunta = (requisicao.Mensagem ?? string.Empty).Trim();
        if (pergunta.Length == 0)
            throw new DadosInvalidosException("Escreva sua pergunta.");
        if (pergunta.Length > TamanhoMaximoPergunta)
            throw new DadosInvalidosException($"A pergunta pode ter até {TamanhoMaximoPergunta} caracteres.");

        // Só as últimas mensagens vão junto: o suficiente para o contexto, sem gastar a cota à toa.
        var historico = (requisicao.Historico ?? [])
            .Where(m => !string.IsNullOrWhiteSpace(m.Conteudo))
            .TakeLast(LimiteDoHistorico)
            .Select(m => new MensagemHistoricoDto(m.Papel == "assistente" ? "assistente" : "usuario", m.Conteudo.Trim()))
            .ToList();

        return assistente.ResponderAsync(pergunta, historico, cancelamento);
    }
}
