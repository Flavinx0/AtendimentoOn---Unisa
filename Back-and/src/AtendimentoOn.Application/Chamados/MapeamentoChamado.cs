using AtendimentoOn.Domain.Chamados;

namespace AtendimentoOn.Application.Chamados;

internal static class MapeamentoChamado
{
    public static ChamadoDto ParaDto(Chamado chamado) => Preencher(new ChamadoDto(), chamado);

    public static ChamadoDetalheDto ParaDetalheDto(Chamado chamado)
    {
        var dto = Preencher(new ChamadoDetalheDto(), chamado);
        dto.Mensagens = chamado.Mensagens
            .OrderBy(m => m.EnviadaEm)
            .Select(ParaMensagemDto)
            .ToList();
        return dto;
    }

    public static MensagemDto ParaMensagemDto(MensagemChamado mensagem) => new(
        mensagem.Id,
        mensagem.AutorId,
        mensagem.Autor?.Nome,
        mensagem.Origem,
        mensagem.Conteudo,
        ComoUtc(mensagem.EnviadaEm));

    private static T Preencher<T>(T dto, Chamado chamado) where T : ChamadoDto
    {
        dto.Id = chamado.Id;
        dto.Protocolo = chamado.Protocolo;
        dto.Titulo = chamado.Titulo;
        dto.Descricao = chamado.Descricao;
        dto.CategoriaId = chamado.CategoriaId;
        dto.CategoriaNome = chamado.Categoria?.Nome ?? string.Empty;
        dto.CursoId = chamado.CursoId;
        dto.CursoNome = chamado.Curso?.NomeCompleto;
        dto.Status = chamado.Status;
        dto.Equipe = chamado.Equipe;
        dto.SolicitanteId = chamado.SolicitanteId;
        dto.SolicitanteNome = chamado.Solicitante?.Nome ?? string.Empty;
        dto.AtendenteId = chamado.AtendenteId;
        dto.AtendenteNome = chamado.Atendente?.Nome;
        dto.CriadoEm = ComoUtc(chamado.CriadoEm);
        dto.EncerradoEm = chamado.EncerradoEm is DateTime encerradoEm ? ComoUtc(encerradoEm) : null;
        return dto;
    }

    // O SQL Server não guarda o fuso. Como o sistema grava sempre em UTC,
    // marcamos a data como UTC na saída, e ela vai para o JSON com "Z" no final.
    private static DateTime ComoUtc(DateTime data) => DateTime.SpecifyKind(data, DateTimeKind.Utc);
}
