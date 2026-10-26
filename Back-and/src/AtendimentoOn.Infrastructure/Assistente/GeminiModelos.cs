namespace AtendimentoOn.Infrastructure.Assistente;

// Formato da API REST "generateContent" do Gemini (v1beta). As propriedades viram camelCase no JSON.

internal sealed record GeminiRequisicao(GeminiConteudo SystemInstruction, IReadOnlyList<GeminiConteudo> Contents);

internal sealed record GeminiConteudo(string? Role, IReadOnlyList<GeminiParte>? Parts);

internal sealed record GeminiParte(string? Text);

internal sealed record GeminiResposta(IReadOnlyList<GeminiCandidato>? Candidates);

internal sealed record GeminiCandidato(GeminiConteudo? Content, string? FinishReason);
