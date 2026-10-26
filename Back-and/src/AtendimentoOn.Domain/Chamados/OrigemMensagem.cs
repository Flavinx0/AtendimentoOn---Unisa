namespace AtendimentoOn.Domain.Chamados;

public enum OrigemMensagem
{
    /// <summary>Escrita por quem abriu o chamado.</summary>
    Usuario = 0,

    /// <summary>Escrita pelo atendente responsável.</summary>
    Atendente = 1,

    /// <summary>Gerada automaticamente pelo assistente virtual.</summary>
    Bot = 2,
}
