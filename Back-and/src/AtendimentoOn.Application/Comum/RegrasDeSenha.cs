using AtendimentoOn.Domain.Comum;

namespace AtendimentoOn.Application.Comum;

public static class RegrasDeSenha
{
    public const int TamanhoMinimo = 6;
    public const int TamanhoMaximo = 100;

    public static string Validar(string? senha)
    {
        var valor = senha ?? string.Empty;
        if (valor.Length < TamanhoMinimo)
            throw new DadosInvalidosException($"A senha precisa ter pelo menos {TamanhoMinimo} caracteres.");
        if (valor.Length > TamanhoMaximo)
            throw new DadosInvalidosException($"A senha pode ter até {TamanhoMaximo} caracteres.");
        return valor;
    }
}
