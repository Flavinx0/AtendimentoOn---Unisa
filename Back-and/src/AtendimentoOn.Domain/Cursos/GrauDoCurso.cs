namespace AtendimentoOn.Domain.Cursos;

public enum GrauDoCurso
{
    Bacharelado = 0,
    Licenciatura = 1,
    Tecnologo = 2,
}

public enum ModalidadeDoCurso
{
    Presencial = 0,
    EaD = 1,
    Semipresencial = 2,
}

public static class CursoExtensoes
{
    public static string Nome(this GrauDoCurso grau) => grau switch
    {
        GrauDoCurso.Bacharelado => "Bacharelado",
        GrauDoCurso.Licenciatura => "Licenciatura",
        GrauDoCurso.Tecnologo => "Tecnólogo",
        _ => grau.ToString(),
    };

    public static string Nome(this ModalidadeDoCurso modalidade) => modalidade switch
    {
        ModalidadeDoCurso.Presencial => "Presencial",
        ModalidadeDoCurso.EaD => "EaD",
        ModalidadeDoCurso.Semipresencial => "Semipresencial",
        _ => modalidade.ToString(),
    };
}
