# Atendimento ON — API

API REST do Atendimento ON em C# (.NET 10). O código segue as camadas do DDD (ADR-001), a documentação sai no Swagger e o login usa JWT. É o back-end do front `atendimento-on-web`.

## Estrutura

```
src/
  AtendimentoOn.Domain/          entidades e regras de negócio, sem dependências externas
    Usuarios/  Categorias/  Chamados/  Comum/
  AtendimentoOn.Application/     casos de uso (serviços), DTOs e interfaces que a infraestrutura implementa
  AtendimentoOn.Infrastructure/  EF Core + SQL Server, JWT, hash de senha e cliente do Gemini
  AtendimentoOn.Api/             controllers, Swagger, tratamento de erros e Program.cs
```

As dependências seguem uma direção só: Api → Infrastructure → Application → Domain. O domínio não conhece banco, HTTP nem Gemini.

Onde ficam as regras:

| Regra | Onde |
|---|---|
| RN01: só quem abriu ou o atendente responsável encerra | `Chamado.Encerrar` |
| RN02: e-mail único | `UsuarioServico.CadastrarAsync` e índice único na tabela `Usuarios` |
| Ciclo de status do chamado | `Chamado.Assumir`, `Chamado.AdicionarMensagem` e `Chamado.Encerrar` |
| Quem vê cada chamado | `Chamado.PodeSerVistoPor` |
| Cadastro público só para Aluno e Funcionario | `Usuario.CriarSolicitante` |
| Equipe que recebe cada chamado | `Categoria.Equipe`, aplicada no construtor de `Chamado` |
| Atendente só vê e atende a própria equipe | `Chamado.PodeSerVistoPor` e `Chamado.PodeSerAtendidoPor` |
| Só administradores cadastram atendentes | `AtendenteServico` |

## Pré-requisitos

- .NET 10 SDK. Confira com `dotnet --list-sdks`.
- SQL Server (LocalDB, Express ou Docker). A criação do banco é a próxima etapa do projeto.
- Uma chave da API do Gemini, criada no Google AI Studio. Sem ela, a API funciona, mas o chat responde que o assistente está indisponível.

## Como rodar

Na pasta da solução:

```bash
dotnet restore
dotnet dev-certs https --trust
dotnet run --project src/AtendimentoOn.Api
```

O `dev-certs` só precisa ser rodado uma vez por máquina. O Swagger abre em https://localhost:7001/swagger.

Até o banco ser criado, a API sobe e o Swagger abre, mas os endpoints que leem ou gravam dados respondem com erro 500.

## Configuração e segredos

Os segredos ficam no user-secrets, que guarda os valores fora da pasta do projeto e, portanto, fora do Git:

```bash
cd src/AtendimentoOn.Api
dotnet user-secrets set "Gemini:ChaveApi" "SUA_CHAVE_DO_GEMINI"
```

| Chave | Para que serve |
|---|---|
| `ConnectionStrings:AtendimentoOn` | Conexão com o SQL Server. O padrão aponta para o LocalDB e será revisado na etapa do banco. |
| `Jwt:Chave` | Segredo que assina os tokens, com pelo menos 32 caracteres. O `appsettings.Development.json` traz uma chave só para desenvolvimento; em produção, defina outra com user-secrets ou variável de ambiente. |
| `Jwt:ExpiracaoHoras` | Validade do token (padrão: 8 horas). |
| `Gemini:ChaveApi` | Chave da API do Gemini. |
| `Gemini:Modelo` | Modelo usado. O padrão `gemini-flash-latest` aponta sempre para o Flash mais recente. |
| `Cors:Origens` | Endereços do front liberados quando ele for publicado em outro domínio. |
| `Email:Host`, `Email:Porta`, `Email:UsarSsl` | Servidor SMTP que envia o código do "Esqueci minha senha". Sem `Email:Host`, nenhum e-mail sai: o e-mail, com o código, aparece no console da API. |
| `Email:Usuario`, `Email:Senha` | Login no servidor de e-mail, quando ele pede. |
| `Email:Remetente`, `Email:NomeDoRemetente` | Quem aparece como remetente (padrão: `nao-responda@atendimento-on.local`, "Atendimento ON"). |

### Enviar os e-mails de verdade

Sem configurar nada, a API funciona normalmente e escreve no console cada e-mail que enviaria, com o código. Para testar com um e-mail chegando de fato, há duas opções.

Mailpit (servidor de e-mail de teste, que roda no próprio computador e mostra os e-mails numa página). Baixe o `mailpit.exe` em https://mailpit.axllent.org, rode-o e configure:

```bash
cd src/AtendimentoOn.Api
dotnet user-secrets set "Email:Host" "localhost"
dotnet user-secrets set "Email:Porta" "1025"
dotnet user-secrets set "Email:UsarSsl" "false"
```

Os e-mails aparecem em http://localhost:8025.

Gmail (o e-mail chega na caixa de entrada de verdade). A conta precisa da verificação em duas etapas, e a senha usada é uma "senha de app" gerada nas configurações de segurança da conta Google, não a senha normal:

```bash
cd src/AtendimentoOn.Api
dotnet user-secrets set "Email:Host" "smtp.gmail.com"
dotnet user-secrets set "Email:Porta" "587"
dotnet user-secrets set "Email:Usuario" "sua.conta@gmail.com"
dotnet user-secrets set "Email:Senha" "SENHA_DE_APP"
dotnet user-secrets set "Email:Remetente" "sua.conta@gmail.com"
```

## Perfis e equipes

| Perfil | Quem cria | O que faz |
|---|---|---|
| Aluno, Funcionario | A própria pessoa, pelo cadastro público | Abre e acompanha os próprios chamados |
| Atendente | Um administrador, na tela Equipe | Vê e atende só os chamados da própria equipe (na Coordenação, só os dos cursos a que está vinculado) |
| Administrador | Um administrador | Faz parte do Suporte de TI, vê todas as equipes e gerencia os atendentes |

As equipes são `Biblioteca`, `SuporteTI`, `Secretaria` e `Coordenacao`. Cada categoria pertence a uma equipe, e o chamado vai para a equipe da categoria escolhida: Biblioteca para a `Biblioteca`, Suporte de TI para o `SuporteTI`, Coordenação de curso para a `Coordenacao` e as demais (Financeiro, Secretaria acadêmica e Outros assuntos) para a `Secretaria`, seja de aluno ou de funcionário.

### Coordenação de curso

A Coordenação é dividida por curso. O banco já vem com os 91 cursos de graduação da Unisa, tirados dos editais oficiais: o Edital 13/2026 (cursos presenciais, 2º semestre de 2026) e o Edital 19/2026 (EaD e semipresencial, 2026-3). Medicina tem processo seletivo próprio e não aparece no edital, mas entrou como curso presencial. O mesmo curso em modalidades diferentes conta como cursos diferentes, cada um com a sua coordenação: Administração presencial e Administração EaD, por exemplo.

- Quem abre um chamado na categoria Coordenação de curso escolhe o curso. Sem curso, a API recusa o chamado (400).
- Cada pessoa da Coordenação é vinculada aos cursos que coordena, na tela Equipe. Um curso pode ter mais de um coordenador, e uma pessoa pode coordenar vários cursos.
- Quem está na Coordenação vê e atende só os chamados dos seus cursos. Os de outros cursos respondem 404, como os de outras equipes.
- Uma conta na Coordenação precisa de pelo menos um curso. Quem sai da Coordenação perde os vínculos.
- Chamados de um curso sem ninguém vinculado ficam visíveis para os administradores, que podem assumir ou vincular alguém ao curso.

O primeiro administrador entra junto com o banco: `admin@unisa.br`, senha `123456`. Conta desativada não consegue entrar e perde o acesso na hora, mesmo com um token ainda válido.

## Senhas

- **Senha inicial do atendente.** O administrador cria o atendente já com uma senha, que passa para a pessoa. Essa senha é provisória: no login, `usuario.precisaTrocarSenha` vem `true` e o token traz a claim `senha_provisoria`. Enquanto a senha não for trocada, a API responde 403 em todas as rotas, menos `POST /api/auth/trocar-senha` e `GET /api/usuarios/eu`. A troca devolve um token novo, já liberado. Na tela Equipe, quem ainda não trocou aparece com a marca "Senha inicial".
- **Trocar senha.** Qualquer pessoa logada troca a própria senha informando a atual. Senha atual errada responde 400, e não 401, para não encerrar a sessão.
- **Esqueci minha senha.** A pessoa informa o e-mail e recebe um código de 6 números. O código vale por 15 minutos, aceita até 5 tentativas erradas e só pode ser usado uma vez; pedir um novo invalida o anterior. Só o hash do código fica no banco. Para não revelar quais e-mails têm conta, a API responde igual quando a conta não existe ou está desativada, e usa a mesma mensagem para código errado, vencido ou de e-mail sem conta. No máximo um código por minuto para a mesma conta, e até 20 pedidos a cada 15 minutos por endereço IP (depois disso, 429).

## Testar pelo Swagger

1. Crie uma conta em `POST /api/usuarios` com o perfil `Aluno` ou `Funcionario`.
2. Faça login em `POST /api/auth/login` e copie o `token` da resposta.
3. Clique em **Authorize**, cole o token (sem a palavra Bearer) e confirme.
4. Chame os outros endpoints. `GET /api/usuarios/eu` mostra quem está logado.

Contas de atendente não são criadas pelo cadastro público: entre como `admin@unisa.br` e use `POST /api/equipe/atendentes`.

## Ligar o front

No front, crie o arquivo `.env.development.local` com:

```
VITE_USE_MOCK=false
VITE_API_URL=https://localhost:7001
```

Rode a API e depois o `npm run dev` do front.

## Endpoints

Todos exigem `Authorization: Bearer <token>`, menos o login, o cadastro, o `esqueci-senha` e o `redefinir-senha`. Com a senha inicial do administrador ainda não trocada, só `trocar-senha` e `usuarios/eu` respondem; as outras rotas dão 403.

| Método | Rota | O que faz | Sucesso |
|---|---|---|---|
| POST | `/api/auth/login` | Login. Devolve `{ token, usuario }` | 200 |
| POST | `/api/auth/trocar-senha` | Troca a senha `{ senhaAtual, novaSenha }`. Devolve `{ token, usuario }` | 200 |
| POST | `/api/auth/esqueci-senha` | Envia o código por e-mail `{ email }` (público) | 204 |
| POST | `/api/auth/redefinir-senha` | Cria a senha nova com o código `{ email, codigo, novaSenha }` (público) | 204 |
| POST | `/api/usuarios` | Cadastro de aluno ou funcionário | 201 |
| GET | `/api/usuarios/eu` | Dados do usuário logado | 200 |
| GET | `/api/categorias` | Categorias ativas | 200 |
| GET | `/api/cursos` | Cursos de graduação `{ id, nome, grau, modalidade }` | 200 |
| GET | `/api/chamados` | Lista: os próprios para aluno e funcionário, os da equipe (e dos seus cursos, na Coordenação) para atendente, todos para administrador | 200 |
| GET | `/api/chamados/{id}` | Detalhe com as mensagens | 200 |
| POST | `/api/chamados` | Abre um chamado `{ titulo, descricao, categoriaId, cursoId }`. O `cursoId` é obrigatório na categoria Coordenação de curso | 201 |
| POST | `/api/chamados/{id}/mensagens` | Envia mensagem `{ conteudo }` | 201 |
| PATCH | `/api/chamados/{id}/assumir` | O atendente assume o chamado | 204 |
| PATCH | `/api/chamados/{id}/encerrar` | Encerra o chamado (RN01) | 204 |
| POST | `/api/chatbot/mensagens` | Pergunta ao assistente `{ mensagem, historico }`. Devolve `{ resposta, escalar }` | 200 |
| GET | `/api/equipe/atendentes` | Lista atendentes e administradores (só administrador) | 200 |
| POST | `/api/equipe/atendentes` | Cria atendente `{ nome, email, senha, equipe, administrador, cursos }` (só administrador) | 201 |
| PUT | `/api/equipe/atendentes/{id}` | Muda `{ equipe, administrador, ativo, cursos }` (só administrador) | 200 |

`cursos` é a lista de ids dos cursos que a pessoa coordena: obrigatória (pelo menos um) na equipe `Coordenacao` e ignorada nas outras. O login, o `/api/usuarios/eu` e a lista da equipe devolvem os cursos de cada pessoa da Coordenação. Os chamados da Coordenação trazem `cursoId` e `cursoNome`, por exemplo `Administração (Bacharelado, Presencial)`.

Os enums trafegam como texto: `status` (`Aberto`, `EmAtendimento`, `AguardandoUsuario`, `Encerrado`), `perfil` (`Aluno`, `Funcionario`, `Atendente`, `Administrador`), `equipe` (`Biblioteca`, `SuporteTI`, `Secretaria`, `Coordenacao`), `grau` (`Bacharelado`, `Licenciatura`, `Tecnologo`), `modalidade` (`Presencial`, `EaD`, `Semipresencial`) e `origem` (`Usuario`, `Atendente`, `Bot`). As datas saem em UTC, com `Z` no final.

## Respostas de erro

Os erros saem no formato ProblemDetails. O campo `detail` traz a mensagem em português que o front mostra ao usuário.

| Status | Quando |
|---|---|
| 400 | Dados inválidos (`DadosInvalidosException`), como assunto vazio ou senha curta |
| 401 | Login errado, token ausente ou expirado |
| 403 | Ação não permitida para o perfil (`AcessoNegadoException`), como um aluno tentando assumir um chamado |
| 404 | Chamado inexistente ou de outra pessoa |
| 409 | Conflito com o estado atual (`RegraDeNegocioException`), como e-mail já cadastrado ou chamado encerrado |
| 429 | Mais de 20 perguntas por minuto ao assistente |
| 503 | O Gemini não respondeu ou a chave não foi configurada |

As exceções viram respostas em `Api/Erros/TratadorDeErros.cs`.

## Ciclo do chamado

| Ação | Quem pode | Status depois |
|---|---|---|
| Abrir | Qualquer usuário logado | Aberto |
| Assumir | Atendente, se o chamado não tiver outro responsável | Em atendimento |
| Mensagem do atendente responsável | Atendente responsável | Aguardando usuário |
| Mensagem de quem abriu | Solicitante | Volta para Em atendimento se estava Aguardando usuário |
| Encerrar | Solicitante ou atendente responsável (RN01) | Encerrado |

Chamado encerrado não recebe mensagens. Se duas pessoas alterarem o mesmo chamado ao mesmo tempo, a coluna `Versao` detecta o conflito e a segunda recebe 409.

## Assistente virtual (Gemini)

- As instruções enviadas ao modelo ficam em `Infrastructure/Assistente/InstrucoesDoAssistente.cs`.
- Quando o caso precisa de uma pessoa, o modelo termina a resposta com a marca `[ESCALAR]`. A API remove a marca e devolve `escalar: true`, e o front oferece abrir um chamado com a conversa.
- O histórico enviado é limitado às últimas 20 mensagens, e cada usuário pode fazer até 20 perguntas por minuto. Os dois limites protegem a cota da chave.
- A chave do Gemini fica só na API. O front nunca a recebe.

## Banco de dados

As tabelas são definidas em `Infrastructure/Persistencia/Configuracoes`, e os dados iniciais em `Infrastructure/Persistencia/DadosIniciais.cs`: as seis categorias, com a equipe de cada uma, os 91 cursos de graduação e o primeiro administrador (`admin@unisa.br`, senha `123456`).

Tabelas: `Usuarios` (com `PrecisaTrocarSenha`), `Categorias`, `Cursos`, `CoordenadoresCursos` (quem coordena cada curso), `Chamados` (com `CursoId` nos chamados da Coordenação), `MensagensChamado` e `CodigosDeRecuperacao` (códigos do "Esqueci minha senha", só com o hash).

Em desenvolvimento, a API aplica as migrations pendentes sempre que sobe. Na primeira vez, ela cria o banco `AtendimentoOn` no LocalDB.

Ferramenta de migrations (uma vez por máquina):

```bash
dotnet tool install --global dotnet-ef
```

Depois de mudar uma entidade, uma configuração ou os dados iniciais, crie uma migration nova:

```bash
dotnet ef migrations add NomeDaMudanca --project src/AtendimentoOn.Infrastructure --startup-project src/AtendimentoOn.Api --output-dir Persistencia/Migracoes
```

Script SQL de criação do banco (seção 5.2 do documento):

```bash
dotnet ef migrations script --project src/AtendimentoOn.Infrastructure --startup-project src/AtendimentoOn.Api --output banco/criacao-do-banco.sql
```

Pare a API antes de rodar os comandos `dotnet ef`, porque eles compilam o projeto.

Para recriar o banco do zero em desenvolvimento (apaga todos os dados):

```bash
dotnet ef database drop --force --project src/AtendimentoOn.Infrastructure --startup-project src/AtendimentoOn.Api
```
