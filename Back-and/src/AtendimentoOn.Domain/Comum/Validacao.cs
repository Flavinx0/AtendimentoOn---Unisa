namespace AtendimentoOn.Domain.Comum;

internal static class Validacao
{
    /// <summary>Remove os espaços das pontas e confere se o texto foi preenchido e cabe no limite.</summary>
    public static string TextoObrigatorio(string? valor, int tamanhoMaximo, string mensagemSeVazio, string mensagemSeLongo)
    {
        var texto = (valor ?? string.Empty).Trim();
        if (texto.Length == 0) throw new DadosInvalidosException(mensagemSeVazio);
        if (texto.Length > tamanhoMaximo) throw new DadosInvalidosException(mensagemSeLongo);
        return texto;
    }
}
