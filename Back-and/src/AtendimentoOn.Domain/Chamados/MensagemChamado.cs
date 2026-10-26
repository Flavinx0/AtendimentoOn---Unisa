using AtendimentoOn.Domain.Comum;
using AtendimentoOn.Domain.Usuarios;

namespace AtendimentoOn.Domain.Chamados;

public class MensagemChamado
{
    public const int TamanhoMaximoConteudo = 4000;

    public Guid Id { get; private set; }
    public Guid ChamadoId { get; private set; }
    public Guid? AutorId { get; private set; }
    public Usuario? Autor { get; private set; }
    public OrigemMensagem Origem { get; private set; }
    public string Conteudo { get; private set; } = string.Empty;
    public DateTime EnviadaEm { get; private set; }

    // Usado pelo Entity Framework ao ler do banco.
    private MensagemChamado() { }

    // Criada só por Chamado.AdicionarMensagem, que confere quem pode escrever.
    internal MensagemChamado(Guid chamadoId, Usuario autor, OrigemMensagem origem, string conteudo)
    {
        var texto = Validacao.TextoObrigatorio(conteudo, TamanhoMaximoConteudo,
            "Escreva uma mensagem antes de enviar.", $"A mensagem pode ter até {TamanhoMaximoConteudo} caracteres.");

        Id = Guid.NewGuid();
        ChamadoId = chamadoId;
        Autor = autor;
        AutorId = autor.Id;
        Origem = origem;
        Conteudo = texto;
        EnviadaEm = DateTime.UtcNow;
    }
}
