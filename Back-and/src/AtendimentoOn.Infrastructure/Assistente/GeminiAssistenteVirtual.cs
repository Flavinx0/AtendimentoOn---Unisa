using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using AtendimentoOn.Application.Abstracoes;
using AtendimentoOn.Application.Chatbot;
using AtendimentoOn.Application.Comum;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AtendimentoOn.Infrastructure.Assistente;

/// <summary>Responde às perguntas do chat usando a API do Gemini (ADR-002).</summary>
public class GeminiAssistenteVirtual(
    HttpClient http,
    IOptions<GeminiOpcoes> opcoes,
    ILogger<GeminiAssistenteVirtual> logger) : IAssistenteVirtual
{
    private const string MensagemIndisponivel =
        "O assistente virtual não conseguiu responder agora. Tente de novo em instantes ou abra um chamado.";

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    public async Task<RespostaAssistenteDto> ResponderAsync(
        string pergunta,
        IReadOnlyList<MensagemHistoricoDto> historico,
        CancellationToken cancelamento = default)
    {
        var configuracao = opcoes.Value;
        if (string.IsNullOrWhiteSpace(configuracao.ChaveApi))
        {
            throw new ServicoIndisponivelException(
                "O assistente virtual ainda não foi configurado (falta a chave do Gemini). Abra um chamado para falar com a equipe.");
        }

        // No Gemini, o papel do assistente se chama "model".
        var conteudos = historico
            .Select(m => new GeminiConteudo(m.Papel == "assistente" ? "model" : "user", [new GeminiParte(m.Conteudo)]))
            .Append(new GeminiConteudo("user", [new GeminiParte(pergunta)]))
            .ToList();
        var corpo = new GeminiRequisicao(new GeminiConteudo(null, [new GeminiParte(InstrucoesDoAssistente.Texto)]), conteudos);

        using var requisicao = new HttpRequestMessage(HttpMethod.Post, $"v1beta/models/{configuracao.Modelo}:generateContent")
        {
            // Corpo serializado antes do envio, com Content-Length definido.
            Content = new StringContent(JsonSerializer.Serialize(corpo, Json), Encoding.UTF8, "application/json"),
        };
        requisicao.Headers.Add("x-goog-api-key", configuracao.ChaveApi);

        HttpResponseMessage resposta;
        try
        {
            resposta = await http.SendAsync(requisicao, cancelamento);
        }
        catch (Exception erro) when (erro is HttpRequestException || (erro is TaskCanceledException && !cancelamento.IsCancellationRequested))
        {
            logger.LogWarning(erro, "Falha ao chamar o Gemini.");
            throw new ServicoIndisponivelException(MensagemIndisponivel, erro);
        }

        using (resposta)
        {
            if (!resposta.IsSuccessStatusCode)
            {
                var detalhe = await resposta.Content.ReadAsStringAsync(cancelamento);
                logger.LogWarning("O Gemini respondeu {Status}: {Detalhe}", (int)resposta.StatusCode, detalhe);
                throw new ServicoIndisponivelException(MensagemIndisponivel);
            }

            var dados = await resposta.Content.ReadFromJsonAsync<GeminiResposta>(Json, cancelamento);
            var partes = dados?.Candidates?.FirstOrDefault()?.Content?.Parts ?? [];
            var texto = string.Concat(partes.Select(p => p.Text)).Trim();
            return Interpretar(texto);
        }
    }

    /// <summary>Tira a marca [ESCALAR] do texto e a transforma em Escalar = true.</summary>
    internal static RespostaAssistenteDto Interpretar(string texto)
    {
        var marca = InstrucoesDoAssistente.MarcaEscalar;
        var escalar = texto.Contains(marca, StringComparison.OrdinalIgnoreCase);
        if (escalar) texto = texto.Replace(marca, string.Empty, StringComparison.OrdinalIgnoreCase).Trim();

        if (texto.Length == 0)
            return new RespostaAssistenteDto("Não consegui responder a isso. Um atendente pode ajudar você.", true);

        return new RespostaAssistenteDto(texto, escalar);
    }
}
