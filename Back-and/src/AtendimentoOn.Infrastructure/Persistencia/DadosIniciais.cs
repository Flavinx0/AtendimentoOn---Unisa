using AtendimentoOn.Domain.Cursos;
using AtendimentoOn.Domain.Equipes;
using AtendimentoOn.Domain.Usuarios;

namespace AtendimentoOn.Infrastructure.Persistencia;

/// <summary>
/// Dados que entram no banco junto com as tabelas. Eles ficam gravados na migration e no script SQL.
/// Se mudar algo aqui, crie uma nova migration.
/// </summary>
internal static class DadosIniciais
{
    /// <summary>Categorias e a equipe que recebe os chamados de cada uma.</summary>
    public static readonly object[] Categorias =
    [
        new { Id = 1, Nome = "Financeiro", Ativa = true, Equipe = Equipe.Secretaria },
        new { Id = 2, Nome = "Secretaria acadêmica", Ativa = true, Equipe = Equipe.Secretaria },
        new { Id = 3, Nome = "Suporte de TI", Ativa = true, Equipe = Equipe.SuporteTI },
        new { Id = 4, Nome = "Biblioteca", Ativa = true, Equipe = Equipe.Biblioteca },
        new { Id = 5, Nome = "Outros assuntos", Ativa = true, Equipe = Equipe.Secretaria },
        new { Id = 6, Nome = "Coordenação de curso", Ativa = true, Equipe = Equipe.Coordenacao },
    ];

    /// <summary>
    /// Cursos de graduação da Unisa, cada um com a sua coordenação. Fontes: Edital 13/2026 (cursos presenciais,
    /// 2º semestre de 2026) e Edital 19/2026 (EaD e semipresencial, 2026-3), publicados em unisa.br.
    /// Medicina tem processo seletivo próprio e não aparece no edital, mas é um curso presencial da Unisa.
    /// O mesmo curso pode existir em mais de uma modalidade: cada oferta tem a sua coordenação.
    /// </summary>
    public static readonly object[] Cursos =
    [
        NovoCurso(1, "Administração", GrauDoCurso.Bacharelado, ModalidadeDoCurso.Presencial),
        NovoCurso(2, "Arquitetura e Urbanismo", GrauDoCurso.Bacharelado, ModalidadeDoCurso.Presencial),
        NovoCurso(3, "Biomedicina", GrauDoCurso.Bacharelado, ModalidadeDoCurso.Presencial),
        NovoCurso(4, "Ciências Biológicas", GrauDoCurso.Bacharelado, ModalidadeDoCurso.Presencial),
        NovoCurso(5, "Ciências Contábeis", GrauDoCurso.Bacharelado, ModalidadeDoCurso.Presencial),
        NovoCurso(6, "Comunicação Social – Publicidade e Propaganda", GrauDoCurso.Bacharelado, ModalidadeDoCurso.Presencial),
        NovoCurso(7, "Design", GrauDoCurso.Bacharelado, ModalidadeDoCurso.Presencial),
        NovoCurso(8, "Direito", GrauDoCurso.Bacharelado, ModalidadeDoCurso.Presencial),
        NovoCurso(9, "Educação Física", GrauDoCurso.Bacharelado, ModalidadeDoCurso.Presencial),
        NovoCurso(10, "Enfermagem", GrauDoCurso.Bacharelado, ModalidadeDoCurso.Presencial),
        NovoCurso(11, "Engenharia Ambiental", GrauDoCurso.Bacharelado, ModalidadeDoCurso.Presencial),
        NovoCurso(12, "Engenharia Civil", GrauDoCurso.Bacharelado, ModalidadeDoCurso.Presencial),
        NovoCurso(13, "Engenharia de Computação", GrauDoCurso.Bacharelado, ModalidadeDoCurso.Presencial),
        NovoCurso(14, "Engenharia de Produção", GrauDoCurso.Bacharelado, ModalidadeDoCurso.Presencial),
        NovoCurso(15, "Engenharia de Software", GrauDoCurso.Bacharelado, ModalidadeDoCurso.Presencial),
        NovoCurso(16, "Engenharia Elétrica", GrauDoCurso.Bacharelado, ModalidadeDoCurso.Presencial),
        NovoCurso(17, "Engenharia Mecânica", GrauDoCurso.Bacharelado, ModalidadeDoCurso.Presencial),
        NovoCurso(18, "Engenharia Mecatrônica", GrauDoCurso.Bacharelado, ModalidadeDoCurso.Presencial),
        NovoCurso(19, "Engenharia Química", GrauDoCurso.Bacharelado, ModalidadeDoCurso.Presencial),
        NovoCurso(20, "Farmácia", GrauDoCurso.Bacharelado, ModalidadeDoCurso.Presencial),
        NovoCurso(21, "Fisioterapia", GrauDoCurso.Bacharelado, ModalidadeDoCurso.Presencial),
        NovoCurso(22, "Medicina", GrauDoCurso.Bacharelado, ModalidadeDoCurso.Presencial),
        NovoCurso(23, "Medicina Veterinária", GrauDoCurso.Bacharelado, ModalidadeDoCurso.Presencial),
        NovoCurso(24, "Nutrição", GrauDoCurso.Bacharelado, ModalidadeDoCurso.Presencial),
        NovoCurso(25, "Odontologia", GrauDoCurso.Bacharelado, ModalidadeDoCurso.Presencial),
        NovoCurso(26, "Psicologia", GrauDoCurso.Bacharelado, ModalidadeDoCurso.Presencial),
        NovoCurso(27, "Serviço Social", GrauDoCurso.Bacharelado, ModalidadeDoCurso.Presencial),
        NovoCurso(28, "Ciências Biológicas", GrauDoCurso.Licenciatura, ModalidadeDoCurso.Presencial),
        NovoCurso(29, "Educação Física", GrauDoCurso.Licenciatura, ModalidadeDoCurso.Presencial),
        NovoCurso(30, "História", GrauDoCurso.Licenciatura, ModalidadeDoCurso.Presencial),
        NovoCurso(31, "Letras – Língua Portuguesa", GrauDoCurso.Licenciatura, ModalidadeDoCurso.Presencial),
        NovoCurso(32, "Matemática", GrauDoCurso.Licenciatura, ModalidadeDoCurso.Presencial),
        NovoCurso(33, "Pedagogia", GrauDoCurso.Licenciatura, ModalidadeDoCurso.Presencial),
        NovoCurso(34, "Análise e Desenvolvimento de Sistemas", GrauDoCurso.Tecnologo, ModalidadeDoCurso.Presencial),
        NovoCurso(35, "Estética e Cosmética", GrauDoCurso.Tecnologo, ModalidadeDoCurso.Presencial),
        NovoCurso(36, "Gastronomia", GrauDoCurso.Tecnologo, ModalidadeDoCurso.Presencial),
        NovoCurso(37, "Gestão da Tecnologia da Informação", GrauDoCurso.Tecnologo, ModalidadeDoCurso.Presencial),
        NovoCurso(38, "Gestão de Recursos Humanos", GrauDoCurso.Tecnologo, ModalidadeDoCurso.Presencial),
        NovoCurso(39, "Gestão Financeira", GrauDoCurso.Tecnologo, ModalidadeDoCurso.Presencial),
        NovoCurso(40, "Gestão Hospitalar", GrauDoCurso.Tecnologo, ModalidadeDoCurso.Presencial),
        NovoCurso(41, "Logística", GrauDoCurso.Tecnologo, ModalidadeDoCurso.Presencial),
        NovoCurso(42, "Marketing", GrauDoCurso.Tecnologo, ModalidadeDoCurso.Presencial),
        NovoCurso(43, "Processos Gerenciais", GrauDoCurso.Tecnologo, ModalidadeDoCurso.Presencial),
        NovoCurso(44, "Administração", GrauDoCurso.Bacharelado, ModalidadeDoCurso.EaD),
        NovoCurso(45, "Análise e Desenvolvimento de Sistemas", GrauDoCurso.Tecnologo, ModalidadeDoCurso.EaD),
        NovoCurso(46, "Ciências Contábeis", GrauDoCurso.Bacharelado, ModalidadeDoCurso.EaD),
        NovoCurso(47, "Ciências Econômicas", GrauDoCurso.Bacharelado, ModalidadeDoCurso.EaD),
        NovoCurso(48, "Design de Interiores", GrauDoCurso.Tecnologo, ModalidadeDoCurso.EaD),
        NovoCurso(49, "Engenharia de Software", GrauDoCurso.Bacharelado, ModalidadeDoCurso.EaD),
        NovoCurso(50, "Gastronomia", GrauDoCurso.Tecnologo, ModalidadeDoCurso.EaD),
        NovoCurso(51, "Gestão Comercial", GrauDoCurso.Tecnologo, ModalidadeDoCurso.EaD),
        NovoCurso(52, "Gestão da Qualidade", GrauDoCurso.Tecnologo, ModalidadeDoCurso.EaD),
        NovoCurso(53, "Gestão da Tecnologia da Informação", GrauDoCurso.Tecnologo, ModalidadeDoCurso.EaD),
        NovoCurso(54, "Gestão de Recursos Humanos", GrauDoCurso.Tecnologo, ModalidadeDoCurso.EaD),
        NovoCurso(55, "Gestão de Serviços Judiciais e Notariais", GrauDoCurso.Tecnologo, ModalidadeDoCurso.EaD),
        NovoCurso(56, "Gestão do Agronegócio", GrauDoCurso.Tecnologo, ModalidadeDoCurso.EaD),
        NovoCurso(57, "Gestão Financeira", GrauDoCurso.Tecnologo, ModalidadeDoCurso.EaD),
        NovoCurso(58, "Gestão Pública", GrauDoCurso.Tecnologo, ModalidadeDoCurso.EaD),
        NovoCurso(59, "Logística", GrauDoCurso.Tecnologo, ModalidadeDoCurso.EaD),
        NovoCurso(60, "Marketing", GrauDoCurso.Tecnologo, ModalidadeDoCurso.EaD),
        NovoCurso(61, "Processos Gerenciais", GrauDoCurso.Tecnologo, ModalidadeDoCurso.EaD),
        NovoCurso(62, "Segurança do Trabalho", GrauDoCurso.Tecnologo, ModalidadeDoCurso.EaD),
        NovoCurso(63, "Teologia", GrauDoCurso.Bacharelado, ModalidadeDoCurso.EaD),
        NovoCurso(64, "Agronomia", GrauDoCurso.Bacharelado, ModalidadeDoCurso.Semipresencial),
        NovoCurso(65, "Arquitetura e Urbanismo", GrauDoCurso.Bacharelado, ModalidadeDoCurso.Semipresencial),
        NovoCurso(66, "Artes Visuais", GrauDoCurso.Licenciatura, ModalidadeDoCurso.Semipresencial),
        NovoCurso(67, "Biomedicina", GrauDoCurso.Bacharelado, ModalidadeDoCurso.Semipresencial),
        NovoCurso(68, "Ciências Biológicas", GrauDoCurso.Bacharelado, ModalidadeDoCurso.Semipresencial),
        NovoCurso(69, "Ciências Biológicas", GrauDoCurso.Licenciatura, ModalidadeDoCurso.Semipresencial),
        NovoCurso(70, "Educação Física", GrauDoCurso.Bacharelado, ModalidadeDoCurso.Semipresencial),
        NovoCurso(71, "Educação Física", GrauDoCurso.Licenciatura, ModalidadeDoCurso.Semipresencial),
        NovoCurso(72, "Engenharia Ambiental", GrauDoCurso.Bacharelado, ModalidadeDoCurso.Semipresencial),
        NovoCurso(73, "Engenharia Civil", GrauDoCurso.Bacharelado, ModalidadeDoCurso.Semipresencial),
        NovoCurso(74, "Engenharia de Computação", GrauDoCurso.Bacharelado, ModalidadeDoCurso.Semipresencial),
        NovoCurso(75, "Engenharia de Produção", GrauDoCurso.Bacharelado, ModalidadeDoCurso.Semipresencial),
        NovoCurso(76, "Engenharia Elétrica", GrauDoCurso.Bacharelado, ModalidadeDoCurso.Semipresencial),
        NovoCurso(77, "Engenharia Mecânica", GrauDoCurso.Bacharelado, ModalidadeDoCurso.Semipresencial),
        NovoCurso(78, "Engenharia Mecatrônica", GrauDoCurso.Bacharelado, ModalidadeDoCurso.Semipresencial),
        NovoCurso(79, "Engenharia Química", GrauDoCurso.Bacharelado, ModalidadeDoCurso.Semipresencial),
        NovoCurso(80, "Estética e Cosmética", GrauDoCurso.Tecnologo, ModalidadeDoCurso.Semipresencial),
        NovoCurso(81, "Farmácia", GrauDoCurso.Bacharelado, ModalidadeDoCurso.Semipresencial),
        NovoCurso(82, "Filosofia", GrauDoCurso.Licenciatura, ModalidadeDoCurso.Semipresencial),
        NovoCurso(83, "Fisioterapia", GrauDoCurso.Bacharelado, ModalidadeDoCurso.Semipresencial),
        NovoCurso(84, "Geografia", GrauDoCurso.Licenciatura, ModalidadeDoCurso.Semipresencial),
        NovoCurso(85, "História", GrauDoCurso.Licenciatura, ModalidadeDoCurso.Semipresencial),
        NovoCurso(86, "Letras – Língua Portuguesa", GrauDoCurso.Licenciatura, ModalidadeDoCurso.Semipresencial),
        NovoCurso(87, "Matemática", GrauDoCurso.Licenciatura, ModalidadeDoCurso.Semipresencial),
        NovoCurso(88, "Nutrição", GrauDoCurso.Bacharelado, ModalidadeDoCurso.Semipresencial),
        NovoCurso(89, "Pedagogia", GrauDoCurso.Licenciatura, ModalidadeDoCurso.Semipresencial),
        NovoCurso(90, "Psicopedagogia", GrauDoCurso.Bacharelado, ModalidadeDoCurso.Semipresencial),
        NovoCurso(91, "Serviço Social", GrauDoCurso.Bacharelado, ModalidadeDoCurso.Semipresencial),
    ];

    private static object NovoCurso(int id, string nome, GrauDoCurso grau, ModalidadeDoCurso modalidade) =>
        new { Id = id, Nome = nome, Grau = grau, Modalidade = modalidade, Ativo = true };

    /// <summary>
    /// Primeiro administrador, do Suporte de TI: admin@unisa.br, senha 123456.
    /// É ele quem cadastra os outros atendentes pela tela Equipe.
    /// </summary>
    public static readonly object[] Usuarios =
    [
        new
        {
            Id = Guid.Parse("2ce77f75-f668-4d91-a8fa-80286026ec0c"),
            Nome = "Administrador",
            Email = "admin@unisa.br",
            // Hash da senha "123456", gerado pelo mesmo PasswordHasher que a API usa no cadastro.
            SenhaHash = "AQAAAAIAAYagAAAAEBQJguaX8me7NAOUsTCozoGkuXLQU1C1uU5HleOAa1FJDDMF2DCwDaIZ/aMfvpCj9w==",
            Perfil = Perfil.Administrador,
            PrecisaTrocarSenha = false,
            Equipe = (Equipe?)Equipe.SuporteTI,
            CriadoEm = new DateTime(2026, 10, 25, 0, 0, 0, DateTimeKind.Utc),
            DesativadoEm = (DateTime?)null,
        },
    ];
}
