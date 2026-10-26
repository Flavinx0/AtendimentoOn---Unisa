namespace AtendimentoOn.Domain.Chamados;

/// <summary>Aberto → EmAtendimento ⇄ AguardandoUsuario → Encerrado</summary>
public enum StatusChamado
{
    /// <summary>Recém-aberto, ainda sem atendente.</summary>
    Aberto = 0,

    /// <summary>Um atendente assumiu e a vez é dele.</summary>
    EmAtendimento = 1,

    /// <summary>O atendente respondeu e espera o retorno de quem abriu.</summary>
    AguardandoUsuario = 2,

    /// <summary>Finalizado. Não recebe mais mensagens.</summary>
    Encerrado = 3,
}
