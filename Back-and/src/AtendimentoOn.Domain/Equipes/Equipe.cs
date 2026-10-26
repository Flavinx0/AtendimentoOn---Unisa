namespace AtendimentoOn.Domain.Equipes;

/// <summary>Equipes de atendimento. Cada atendente pertence a uma, e cada chamado vai para uma.</summary>
public enum Equipe
{
    Biblioteca = 0,
    SuporteTI = 1,
    Secretaria = 2,

    /// <summary>Coordenações de curso. Cada atendente desta equipe atende os cursos a que está vinculado.</summary>
    Coordenacao = 3,
}

public static class EquipeExtensoes
{
    /// <summary>Nome da equipe para mostrar em mensagens.</summary>
    public static string Nome(this Equipe equipe) => equipe switch
    {
        Equipe.Biblioteca => "Biblioteca",
        Equipe.SuporteTI => "Suporte de TI",
        Equipe.Secretaria => "Secretaria",
        Equipe.Coordenacao => "Coordenação",
        _ => equipe.ToString(),
    };
}
