# API de Usuários (Node.js + MongoDB)

CRUD de usuários do AçaíStudy. Salva na coleção `usuarios`, seguindo o dicionário de dados
em `Arquivos/Dicionário de dados/usuarios.json`.

## Como rodar

Pré-requisito: [Node.js 20+](https://nodejs.org/).

```bash
cd backend/users
npm install
cp .env.example .env   # preencha a senha do Atlas em MONGODB_URI
npm run dev            # ou: npm start
```

Se `backend/users/.env` não existir, a API usa o `backend/.env` do Spring Boot.
Sem nenhuma URI, conecta em `mongodb://localhost:27017/acaistudy` (Docker Compose).

No log, procure por:

```text
MongoDB: conexão OK com o banco 'acaistudy'
API de usuários rodando em http://localhost:3001/api
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
backend/users/
├── .env.example
├── package.json
└── src/
    ├── server.js                  # conecta no MongoDB e sobe a API
    ├── app.js                     # Express: CORS, JSON, rotas, erros
    ├── config/                    # variáveis de ambiente e conexão
    ├── models/Usuario.js          # schema Mongoose da coleção "usuarios"
    ├── services/usuarioService.js # regras do CRUD
    ├── controllers/               # recebem a requisição e chamam o service
    ├── routes/                    # mapeamento das URLs
    ├── middlewares/               # tratamento de erros
    └── utils/                     # ErroApi e validações
```
