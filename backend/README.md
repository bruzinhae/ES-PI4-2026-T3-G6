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

No log, procure por:

```text
MongoDB: conexão OK com o banco 'acaistudy'
API AçaíStudy rodando em http://localhost:3001/api
```

Depois abra o frontend (Live Server em `frontend/`) e crie uma conta em `index_criar_conta.html`.
Para apontar o frontend para outra URL, defina `window.ACAISTUDY_API_URL` antes de carregar `JS/users/api.js`.

## Endpoints

Erros sempre voltam como `{ "mensagem": "..." }`.

| Método | Rota | Descrição |
| ------ | ---- | --------- |
| POST | `/api/usuarios` | **Create** — `{ nome, email, senha, aceitouTermos, ...campos do perfil }` → `{ usuario }` |
| POST | `/api/usuarios/login` | **Login** — `{ email, senha }` → `{ usuario }` (404 se o e-mail não tem conta, 401 se a senha não conferir) |
| GET | `/api/usuarios` | **Read** — lista todos → `{ usuarios }` |
| GET | `/api/usuarios/:id` | **Read** — um usuário → `{ usuario }` |
| PATCH | `/api/usuarios/:id` | **Update** — qualquer campo do perfil e/ou `senha` → `{ usuario }` |
| DELETE | `/api/usuarios/:id` | **Delete** — exclui o usuário |
| GET | `/api/saude` | Health check |

Campos do perfil: `nome, email, urlAvatar, instituicao, curso, semestre, turno, metaSemanalHoras, onboardingConcluido`.

## Regras importantes

- A senha é salva como `hashSenha` (bcrypt, custo 10). `hashSenha` e `emailNormalizado` **nunca** são devolvidos pela API.
- `emailNormalizado` (minúsculo, sem espaços) é único: não dá para ter duas contas com o mesmo e-mail.
- Senha com no mínimo 8 caracteres; `turno` ∈ `matutino | vespertino | noturno | integral`; `semestre` inteiro de 1 a 12.
- Trocar o e-mail volta `emailVerificado` para `false`.
- A API **não tem autenticação**: qualquer cliente pode ler, alterar ou excluir qualquer usuário.
  O frontend guarda o `id` do último usuário criado no `localStorage` para abrir o perfil.

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
    ├── middlewares/               # tratamento de erros (compartilhado)
    ├── utils/                     # ErroApi e validações (compartilhado)
    └── modulos/
        └── usuarios/              # Usuario.js (schema), usuarioService.js (regras),
                                   # usuarioController.js e usuarioRoutes.js

Novo módulo: crie `src/modulos/<nome>/` com o mesmo padrão (model, service, controller, routes)
e registre as rotas em `src/app.js`.
```
