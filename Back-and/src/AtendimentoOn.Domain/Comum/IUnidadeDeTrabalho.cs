namespace AtendimentoOn.Domain.Comum;

/// <summary>Grava no banco, de uma vez, tudo o que foi alterado durante a operação.</summary>
public interface IUnidadeDeTrabalho
{
    Task SalvarAsync(CancellationToken cancelamento = default);
}
