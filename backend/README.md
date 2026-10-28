# API do AçaíStudy (Node.js + MongoDB)

API única do projeto: cada área é um módulo em `src/modulos/` (hoje só `usuarios`, que salva na
coleção `usuarios` seguindo `Arquivos/Dicionário de dados/usuarios.json`).

## Como rodar

Pré-requisito: [Node.js 20+](https://nodejs.org/).

```bash
cd backend
npm install
cp .env.example .env   # preencha a senha do Atlas em MONGODB_URI
npm run dev            # ou: npm start
```

Sem nenhuma URI, conecta em `mongodb://localhost:27017/acaistudy` (Docker Compose).

No log aparece um quadro com os dois links. Clique na página para abrir o site:

```text
MongoDB: conexão OK com o banco 'acaistudy'

╭──────────────────────────────────────────────────────╮
│                                                      │
│  AçaíStudy  está no ar                               │
│                                                      │
│  Página da plataforma                                │
│  http://localhost:3001/index.html                    │
│                                                      │
│  API                                                 │
│  http://localhost:3001/api                           │
│                                                      │
╰──────────────────────────────────────────────────────╯
```

O mesmo servidor entrega as páginas do `frontend/` e a API.

## Endpoints

Erros sempre voltam como `{ "mensagem": "..." }`.

Rotas marcadas com 🔒 exigem o cabeçalho `Authorization: Bearer <token>` (o token vem do login ou do cadastro).

| Método | Rota | Descrição |
| ------ | ---- | --------- |
| POST | `/api/usuarios` | **Create** — `{ nome, email, senha, aceitouTermos, ...campos do perfil }` → `{ usuario, token, expiraEm }` (já abre a sessão) |
| POST | `/api/auth/login` | **Login** — `{ email, senha }` → `{ usuario, token, expiraEm }` (401 igual para e-mail sem conta e senha errada) |
| POST | `/api/auth/recuperar-senha` | **Esqueci minha senha** — `{ email }` → 200 com a mesma mensagem se o envio estiver ok (não revela se a conta existe). Se o e-mail estiver cadastrado, manda um link único, válido por 30 min, para `index_nova_senha.html`. 503 se o SMTP falhar |
| GET | `/api/auth/redefinir-senha?token=` | Confere se o link ainda vale (204) ou se está inválido, usado ou expirado (400). Não consome o token |
| POST | `/api/auth/redefinir-senha` | `{ token, senha }` → 204; 400 se o link for inválido, usado ou expirado. Troca a senha e encerra todas as sessões do usuário |
| POST | `/api/auth/logout` 🔒 | Encerra a sessão atual (204) |
| GET | `/api/auth/eu` 🔒 | Usuário dono do token → `{ usuario }` |
| GET | `/api/usuarios` 🔒 | **Read** — lista todos → `{ usuarios }` |
| GET | `/api/usuarios/:id` 🔒 | **Read** — um usuário → `{ usuario }` (só o próprio; senão 403) |
| PATCH | `/api/usuarios/:id` 🔒 | **Update** — campos do perfil e/ou `senha` → `{ usuario }` (só o próprio; trocar a senha encerra as outras sessões) |
| POST | `/api/usuarios/:id/avatar` 🔒 | **Foto** — formulário com o arquivo no campo `foto` (PNG ou JPG, até 5 MB) → `{ usuario }` com `urlAvatar` apontando para a imagem |
| DELETE | `/api/usuarios/:id/avatar` 🔒 | **Remove a foto** — apaga o arquivo e volta `urlAvatar` para `null` → `{ usuario }` |
| DELETE | `/api/usuarios/:id` 🔒 | **Delete** — exclui a conta e as sessões (só o próprio) |
| GET | `/api/blocos-fixos` 🔒 | Lista os blocos fixos do usuário autenticado |
| POST | `/api/blocos-fixos` 🔒 | Cria um bloco fixo (`nome, categoria, recorrencia, diasSemana/data, horaInicio, duracaoMinutos, prioridade`; `disciplinaId, fixo, local` opcionais) |
| GET | `/api/blocos-fixos/:id` 🔒 | Busca um bloco pertencente ao usuário autenticado |
| PATCH | `/api/blocos-fixos/:id` 🔒 | Atualiza os campos enviados e valida novamente o bloco e conflitos |
| DELETE | `/api/blocos-fixos/:id` 🔒 | Exclui um bloco pertencente ao usuário autenticado (204) |
| GET | `/api/disciplinas` 🔒 | Lista as disciplinas do usuário (`?situacao=ativa` filtra). Inclui `progresso` e `horasSemanais` |
| GET | `/api/disciplinas/ativas` 🔒 | Resumo (`id`, `nome`, `cor`) para selects de vínculo |
| POST | `/api/disciplinas` 🔒 | Cria disciplina (`nome`, `area` obrigatórios; `professor`, `local`, `creditos`, `media`, `dificuldade`, `cor`, `periodoLetivo`, `situacao`, `conteudos` opcionais). `media` é a nota desta matéria, de 0 a 10 |
| GET | `/api/disciplinas/:id` 🔒 | Busca uma disciplina do usuário |
| PATCH | `/api/disciplinas/:id` 🔒 | Atualiza os campos enviados |
| DELETE | `/api/disciplinas/:id` 🔒 | Exclui a disciplina e desvincula blocos associados (204) |
| GET | `/api/relatorios?inicio=` 🔒 | Painel da semana (foco, consistência, pomodoro, metas, defasagem). `inicio` é qualquer dia da semana, formato `AAAA-MM-DD` |
| GET | `/api/cabecalho` 🔒 | Resumo do header: progresso de tarefas e avisos (prazos, conteúdos pendentes, sessões de hoje) |
| GET | `/api/metas` 🔒 | Lista as metas (`?situacao=ativa` filtra) e o painel da tela (`progresso`, marcos, consistência da semana) |
| POST | `/api/metas` 🔒 | Cria meta (`titulo` obrigatório; `tipo`, `prioridade`, `prazo`, `situacao`, `disciplinaId`, `metaSemanalHoras`, `marcos` opcionais). Hábito exige horas semanais |
| GET | `/api/metas/:id` 🔒 | Busca uma meta do usuário |
| PATCH | `/api/metas/:id` 🔒 | Atualiza os campos enviados, inclusive marcos |
| DELETE | `/api/metas/:id` 🔒 | Exclui a meta (204) |
| GET | `/api/configuracoes` 🔒 | Preferências da Sofia e o resumo da semana (sessões, blocos e horários sobrepostos) |
| PATCH | `/api/configuracoes` 🔒 | Salva as preferências enviadas (`antifadiga`, `focoMatinal`, `repeticaoEspacada`, `ajusteDinamico`, `rigidez`, `janelaFoco`, `duracaoMinutos`) |
| GET | `/api/canvas` 🔒 | Diz se o Canvas está conectado. Não devolve token |
| POST | `/api/canvas/conectar` 🔒 | Conecta com o token de acesso do aluno (`instanciaUrl`, `token`) e importa cursos e atividades |
| GET | `/api/canvas/oauth` 🔒 | Devolve a URL de autorização, se `CANVAS_CLIENT_ID` e `CANVAS_CLIENT_SECRET` estiverem no `.env` |
| GET | `/api/canvas/retorno` | Volta do Canvas depois da autorização. Redireciona para a tela de configurações |
| POST | `/api/canvas/sincronizar` 🔒 | Atualiza disciplinas e atividades já ligadas ao Canvas |
| DELETE | `/api/canvas` 🔒 | Remove a conexão. O que já foi importado permanece |
| GET | `/api/saude` | Health check |

Campos do perfil: `nome, email, instituicao, curso, semestre, turno, metaSemanalHoras, onboardingConcluido`.
A foto não entra nesse JSON: envie o arquivo em `POST /api/usuarios/:id/avatar`. Sem foto, `urlAvatar` é `null` e o frontend mostra o ícone padrão.

## Regras importantes

- A senha é salva como `hashSenha` (bcrypt, custo 10). `hashSenha` e `emailNormalizado` **nunca** são devolvidos pela API.
- `emailNormalizado` (minúsculo, sem espaços) é único: não dá para ter duas contas com o mesmo e-mail.
- Senha com no mínimo 8 caracteres; `turno` ∈ `matutino | vespertino | noturno | integral`; `semestre` inteiro de 1 a 12.
- Trocar o e-mail volta `emailVerificado` para `false`.
- Sessões ficam na coleção `sessoes_autenticacao` e valem 7 dias. O token é aleatório (43 caracteres) e só o
  **hash SHA-256** dele é salvo no banco (`_id` da sessão); o token em texto existe só na resposta do login.
- Recuperação de senha: os links ficam na coleção `tokens_recuperacao_senha` (só o hash do token é salvo). Cada
  pedido gera um token novo e apaga os links anteriores ainda não usados. O e-mail sai por SMTP
  (`src/servicos/correio.js`); preencha `SMTP_HOST`, `SMTP_USER` e `SMTP_PASS` no `.env` (no Gmail, use uma
  senha de app). O endereço do frontend usado no link vem de `FRONTEND_URL` (padrão `http://localhost:3001`,
  a mesma origem que entrega as páginas).
- Para proteger uma rota nova, use `exigirAutenticacao` (`src/middlewares/autenticacao.js`); depois dele,
  `req.usuario` e `req.sessao` estão disponíveis.
- Blocos fixos são armazenados na coleção `blocos_rotina` (conforme o dicionário de dados), sempre associados a `usuarioId`. A API valida
  recorrência, dias, data, horário, duração, prioridade e conflitos de horário por usuário.
- Disciplinas seguem `Arquivos/Dicionário de dados/disciplinas.json` (`cor` ∈ `roxo|azul|verde|ambar`; conteúdos embutidos).
  `horasSemanais` vem da soma dos blocos semanais vinculados; `progresso` é % de conteúdos `concluido`.
- Metas seguem `Arquivos/Dicionário de dados/metas.json`. `progresso` é a fração de marcos `atingido`;
  em hábito sem marcos, é as horas estudadas na semana sobre `metaSemanalHoras`. O painel não inventa previsão de IA:
  a consistência usa as sessões já encerradas e o ritmo é a média do progresso das metas ativas.
- Na subida, `config/colecoes.js` cria/sincroniza todas as coleções do dicionário: `usuarios`, `sessoes_autenticacao`,
  `tokens_recuperacao_senha`, `disciplinas`, `blocos_rotina`, `tarefas`, `metas`, `sessoes_estudo`, `planos_ia`.
  Metas têm CRUD em `/api/metas`. Tarefas, sessões e planos de IA têm schema; as rotas dessas áreas entram nas próximas entregas.
- O frontend guarda o token em `localStorage` (`acaistudy-token`) e o envia em toda requisição (`JS/users/api.js`).
- Canvas: o token de acesso fica cifrado no documento do usuário e some de toda resposta JSON. A sincronização
  grava `origem: "canvas"` e `idExterno` em disciplinas e tarefas, então uma nova sincronização atualiza em vez de duplicar.
  Sem `CANVAS_CLIENT_ID` e `CANVAS_CLIENT_SECRET`, use o token gerado pelo aluno. A Redirect URI da Developer Key é
  `FRONTEND_URL/api/canvas/retorno`.

## Estrutura

```text
backend/
├── .env.example
├── docker-compose.yml             # MongoDB local (opcional)
├── package.json
└── src/
    ├── server.js                  # conecta no MongoDB e sobe a API
    ├── app.js                     # Express: CORS, JSON, registro das rotas de cada módulo, erros
    ├── config/                    # variáveis de ambiente e conexão (compartilhado)
    ├── middlewares/               # tratamento de erros e autenticação (compartilhado)
    ├── servicos/                  # correio.js — envio do link de redefinição de senha
    ├── utils/                     # ErroApi, validações e tokens (compartilhado)
    └── modulos/
        ├── auth/                  # sessões e recuperação de senha
        ├── usuarios/              # contas e perfil
        ├── disciplinas/           # CRUD completo (schema + service + rotas)
        ├── blocosFixos/           # blocos_rotina
        ├── tarefas/               # schema Tarefa.js (coleção pronta)
        ├── metas/                 # CRUD e painel da tela de metas
        ├── configuracoes/         # preferências da Sofia gravadas no usuário
        ├── canvas/                # conexão com o Canvas LMS e importação de cursos/atividades
        ├── sessoesEstudo/         # schema SessaoEstudo.js (coleção pronta)
        └── planosIa/              # schema PlanoIa.js (coleção pronta)

Novo módulo: crie `src/modulos/<nome>/` com o mesmo padrão (model, service, controller, routes)
e registre as rotas em `src/app.js`.
```
