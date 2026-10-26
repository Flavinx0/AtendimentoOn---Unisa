# Atendimento ON — Front-end

Interface web do Atendimento ON, o sistema de atendimento da comunidade Unisa (alunos e funcionários): chamados com protocolo e assistente virtual integrado ao Gemini.

Stack: React 19, TypeScript, Vite 6 e React Router 7. Não há biblioteca de componentes; os estilos estão em `src/styles/global.css` e a fonte (Archivo) vem do pacote `@fontsource-variable/archivo`.

## Como rodar

Pré-requisito: Node.js 20 ou mais recente.

```bash
npm install
npm run dev
```

Abra http://localhost:5173.

Por padrão o projeto sobe em **modo demonstração**: os dados são simulados no navegador e a API não precisa estar rodando. Contas de exemplo, todas com a senha `123456`:

| Conta | E-mail | O que vê |
|---|---|---|
| Aluno | aluno@unisa.br | Os próprios chamados e o assistente virtual |
| Funcionário | funcionario@unisa.br | Os próprios chamados e o assistente virtual |
| Biblioteca | biblioteca@unisa.br | A fila da Biblioteca |
| Secretaria | secretaria@unisa.br | A fila da Secretaria |
| Coordenação | coordenacao@unisa.br | A fila da Coordenação, só com os chamados dos 3 cursos que ela coordena |
| Administrador (TI) | admin@unisa.br | A fila do Suporte de TI, a tela Outras equipes e a tela Equipe, onde cadastra atendentes |

Nos dados de exemplo há um chamado de Psicologia, curso que ainda não tem ninguém da Coordenação vinculado: só o administrador o vê, em Outras equipes.

Na tela de login, os botões do quadro "Modo demonstração" preenchem essas contas. Para voltar aos dados iniciais, use "Restaurar dados de exemplo" no menu da conta (canto superior direito).

## Perfis e equipes

- **Aluno e funcionário** se cadastram sozinhos, abrem chamados e usam o assistente virtual.
- **Atendente** pertence a uma equipe (Biblioteca, Suporte de TI, Secretaria ou Coordenação) e vê e atende só os chamados dela. Na Coordenação, só os dos cursos a que está vinculado.
- **Administrador** faz parte do Suporte de TI. A fila de trabalho dele é a do Suporte de TI; as filas das outras áreas ficam separadas, na tela **Outras equipes**, onde ele acompanha a Biblioteca, a Secretaria e a Coordenação. É o único que cadastra atendentes, muda a equipe deles, vincula os cursos de quem está na Coordenação e desativa contas, na tela **Equipe**.

Cada chamado vai para a equipe da categoria escolhida: Biblioteca para a Biblioteca, Suporte de TI para o Suporte de TI, Coordenação de curso para a Coordenação e as demais (Financeiro, Secretaria acadêmica e Outros assuntos) para a Secretaria.

### Senhas e primeiro acesso

- O administrador cria cada atendente já com uma senha inicial. No primeiro acesso, o sistema leva a pessoa direto para a tela "Crie a sua senha": até ela trocar a senha inicial por uma dela, nenhuma outra tela abre. Na tela Equipe, quem ainda não trocou aparece com a marca "Senha inicial".
- Qualquer pessoa troca a própria senha pelo menu da conta, em "Trocar senha".
- No login, "Esqueci minha senha" envia um código de 6 números para o e-mail. Com ele, a pessoa cria uma senha nova. No modo demonstração nenhum e-mail é enviado, e o código aparece na própria tela.

### Aviso do assistente

A cada login, alunos e funcionários veem um aviso sugerindo perguntar ao assistente virtual antes de abrir um chamado, com os botões "Perguntar ao assistente" e "Agora não". O aviso aparece uma vez por login.

### Coordenação de curso

Ao abrir um chamado na categoria Coordenação de curso, a pessoa escolhe o curso, separado por modalidade (Presencial, EaD e Semipresencial). O chamado vai só para quem coordena aquele curso. São 91 cursos de graduação da Unisa, tirados dos editais oficiais de 2026. Na tela Equipe, o administrador vincula cada pessoa da Coordenação aos cursos dela e vê quais cursos ainda não têm ninguém.

## Conectar à API em C#

1. Crie o arquivo `.env.development.local` na raiz (ele não vai para o Git):

   ```
   VITE_USE_MOCK=false
   VITE_API_URL=https://localhost:7001
   ```

   Use a porta HTTPS que aparece em `Properties/launchSettings.json` do projeto da API.

2. Rode a API e depois `npm run dev`.

Em desenvolvimento, o Vite encaminha toda chamada que começa com `/api` para `VITE_API_URL` (veja `vite.config.ts`). Por isso não é preciso configurar CORS nem confiar no certificado local do .NET enquanto vocês desenvolvem.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run typecheck` | Verifica os tipos do TypeScript |
| `npm run build` | Verifica os tipos e gera a versão de produção em `dist/` |
| `npm run preview` | Serve a pasta `dist/` localmente |

## Estrutura

```
src/
  api/            comunicação com a API (infraestrutura do front)
    contrato.ts     interface Api: tudo o que o front precisa do back-end
    http.ts         fetch com o token JWT, leitura de erros e sessão expirada
    httpApi.ts      implementação real (rotas da API em C#)
    adaptadores.ts  converte o JSON da API nos tipos do front
    mock/           API simulada usada no modo demonstração
  auth/           sessão, leitura do JWT, contexto de login e rotas protegidas
  components/     componentes reutilizáveis (layout, protocolo, status, diálogos)
  hooks/          useAsync, para carregar dados
  pages/          uma tela por arquivo
  styles/         global.css: cores, tipografia e layout
  types/          tipos do domínio: Usuario, Chamado, Mensagem, Categoria
  utils/          datas, textos, status
```

Se o login e o cadastro que já existem na API usarem nomes de campos diferentes dos descritos abaixo, o ajuste é feito só em `src/api/adaptadores.ts` (leitura das respostas) e `src/api/httpApi.ts` (rotas e corpo das requisições).

## Telas

- **Login e cadastro.** O cadastro já entra na conta em seguida.
- **Início (aluno e funcionário).** Campo para perguntar ao assistente e, em destaque, o chamado que precisa de atenção.
- **Início (atendente).** O próximo chamado da fila, com o botão "Chamar próximo", e os atendimentos em andamento.
- **Chamados.** Abas por situação, busca por protocolo, assunto ou solicitante e filtro por categoria.
- **Abrir chamado.** Pode chegar preenchido com a conversa do assistente.
- **Detalhe do chamado.** Conversa, andamento, assumir (atendente), responder e encerrar. Busca novas mensagens a cada 15 segundos.
- **Assistente virtual.** Chat com o Gemini. Quando a resposta vem com `escalar: true`, oferece abrir um chamado com a conversa.

## Contrato esperado da API

Todas as rotas, menos login e cadastro, recebem `Authorization: Bearer <token>`.

| Método | Rota | Corpo | Resposta |
|---|---|---|---|
| POST | `/api/auth/login` | `{ email, senha }` | `{ token }` ou `{ token, usuario }` |
| POST | `/api/usuarios` | `{ nome, email, senha, perfil }` | 201 |
| GET | `/api/categorias` | | `Categoria[]` (`{ id, nome }`) |
| GET | `/api/chamados` | | `Chamado[]` |
| GET | `/api/chamados/{id}` | | `ChamadoDetalhe` |
| POST | `/api/chamados` | `{ titulo, descricao, categoriaId }` | 201 com o `Chamado` criado |
| POST | `/api/chamados/{id}/mensagens` | `{ conteudo }` | 201 (corpo opcional) |
| PATCH | `/api/chamados/{id}/assumir` | | 200 ou 204 |
| PATCH | `/api/chamados/{id}/encerrar` | | 200 ou 204 |
| POST | `/api/chatbot/mensagens` | `{ mensagem, historico }` | `{ resposta, escalar }` |

`GET /api/chamados` devolve só os chamados do próprio usuário para Aluno e Funcionário, e todos para Atendente. Os ids podem ser `int` ou `Guid`: o front envia `categoriaId` como número quando ele só tem dígitos.

### Chamado

Usado na lista e no retorno da criação:

```json
{
  "id": "3f2a9c1e-…",
  "protocolo": "ON-2026-0042",
  "titulo": "Boleto de outubro com valor diferente",
  "descricao": "O boleto veio com valor maior que o dos meses anteriores…",
  "categoriaId": 1,
  "categoriaNome": "Financeiro",
  "status": "AguardandoUsuario",
  "solicitanteId": "8c1d…",
  "solicitanteNome": "Ana Souza",
  "atendenteId": "41be…",
  "atendenteNome": "Beatriz Rocha",
  "criadoEm": "2026-10-22T18:58:00Z",
  "encerradoEm": null
}
```

### ChamadoDetalhe

Os mesmos campos do chamado, mais as mensagens:

```json
"mensagens": [
  {
    "id": "a71c…",
    "autorId": "41be…",
    "autorNome": "Beatriz Rocha",
    "origem": "Atendente",
    "conteudo": "Olá, Ana! A diferença é…",
    "enviadaEm": "2026-10-23T22:58:00Z"
  }
]
```

A descrição do chamado não precisa ser repetida como mensagem: o front já mostra a descrição no topo da conversa.

### Chatbot

Requisição (o histórico traz as mensagens anteriores da conversa, no máximo 20):

```json
{
  "mensagem": "Quero falar com um atendente",
  "historico": [
    { "papel": "usuario", "conteudo": "Como emito a 2ª via do boleto?" },
    { "papel": "assistente", "conteudo": "Boletos e mensalidades ficam com o setor Financeiro…" }
  ]
}
```

Resposta:

```json
{ "resposta": "Certo. Vou encaminhar você para a equipe de atendimento.", "escalar": true }
```

Na API, `papel: "usuario"` vira `role: "user"` e `papel: "assistente"` vira `role: "model"` na chamada ao Gemini. Uma forma simples de preencher `escalar` é instruir o modelo, no prompt de sistema, a terminar a resposta com uma marca (por exemplo `[ESCALAR]`) quando o caso precisar de uma pessoa; a API remove a marca do texto e devolve `escalar: true`. As respostas podem usar `**negrito**` e listas com `- `, que o front exibe formatadas.

### Valores dos enums

- `status`: `Aberto`, `EmAtendimento`, `AguardandoUsuario`, `Encerrado`
- `perfil`: `Aluno`, `Funcionario`, `Atendente`
- `origem`: `Usuario`, `Atendente`, `Bot`

### Regras que a API deve garantir

O front esconde os botões que não se aplicam, mas quem garante a regra é a API.

- **RN01:** só o solicitante ou o atendente responsável encerra o chamado (senão, 403).
- **RN02:** e-mail único no cadastro (senão, 409).
- O cadastro público não deve aceitar o perfil `Atendente`. Crie as contas de atendente por seed no banco.
- Assumir é só para Atendente: o chamado passa de `Aberto` para `EmAtendimento` e grava o atendente.
- Mensagem do atendente responsável: o chamado passa para `AguardandoUsuario`.
- Mensagem do solicitante com o chamado em `AguardandoUsuario`: volta para `EmAtendimento`.
- Só o solicitante e o atendente responsável enviam mensagens, e chamado encerrado não recebe mensagens (409).

## Ajustes recomendados na API

1. **Enums como texto**, no `Program.cs`:

   ```csharp
   builder.Services.AddControllers().AddJsonOptions(o =>
       o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
   ```

   Sem isso, o .NET envia os enums como números. O front até aceita números (0, 1, 2…), desde que a ordem dos enums seja a listada acima, mas o cadastro envia `perfil` como texto.

2. **Claims do token:** id do usuário (`ClaimTypes.NameIdentifier` ou `sub`), nome (`ClaimTypes.Name`), e-mail (`ClaimTypes.Email`) e perfil (`ClaimTypes.Role`). O front lê tanto os nomes curtos quanto as URIs completas do .NET. Outra opção é o login devolver `{ token, usuario: { id, nome, email, perfil } }`.

3. **Datas em UTC:** grave com `DateTime.UtcNow`. Datas sem fuso vindas da API são tratadas como UTC.

4. **Mensagens de erro:** nas regras de negócio, devolva ProblemDetails com `detail` em português, por exemplo `Problem(detail: "Este chamado já foi encerrado.", statusCode: 409)`. O front mostra esse texto. Erros de validação (`errors`) também aparecem na tela.

5. **Chave do Gemini:** fica só na API (por exemplo, em user-secrets ou `appsettings.Development.json` fora do Git), nunca no front.

6. **Produção:** se o front for publicado em outro endereço, configure CORS na API para esse endereço e gere o build com `VITE_API_URL` apontando para a API.

## Requisitos de navegador

Versões atuais do Chrome, Edge, Firefox e Safari, no computador e no celular. O layout se adapta a telas a partir de 360 px de largura e acompanha o tema claro ou escuro do sistema.
