using System.Text.Json.Serialization;
using AtendimentoOn.Api.Configuracao;
using AtendimentoOn.Api.Erros;
using AtendimentoOn.Application;
using AtendimentoOn.Infrastructure;
using AtendimentoOn.Infrastructure.Persistencia;

var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddControllers(opcoes =>
    {
        // As validações, com mensagens em português, ficam no domínio e nos serviços.
        opcoes.SuppressImplicitRequiredAttributeForNonNullableReferenceTypes = true;
    })
    .AddJsonOptions(opcoes =>
    {
        // Enums como texto ("EmAtendimento" em vez de 1), que é o que o front espera.
        opcoes.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddAplicacao();
builder.Services.AddInfraestrutura(builder.Configuration);

builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<TratadorDeErros>();

builder.Services.AddSwaggerDocumentado();
builder.Services.AddLimitesDeRequisicoes();
builder.Services.AddCorsDoFront(builder.Configuration);

var app = builder.Build();

// Em desenvolvimento, cria o banco e aplica as migrations pendentes ao subir a API.
if (app.Environment.IsDevelopment())
{
    await app.Services.AplicarMigracoesAsync();
}

app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(opcoes => opcoes.DocumentTitle = "Atendimento ON API");
}

app.UseHttpsRedirection();
app.UseCors(CorsConfiguracao.Politica);
app.UseAuthentication();
app.UseBloqueioDeSenhaProvisoria(); // quem está com a senha inicial do administrador só pode trocá-la
app.UseAuthorization();
app.UseRateLimiter();

app.MapControllers();

app.Run();
