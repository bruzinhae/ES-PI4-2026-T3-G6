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

Rotas marcadas com 🔒 exigem o cabeçalho `Authorization: Bearer <token>` (o token vem do login ou do cadastro).

| Método | Rota | Descrição |
| ------ | ---- | --------- |
| POST | `/api/usuarios` | **Create** — `{ nome, email, senha, aceitouTermos, ...campos do perfil }` → `{ usuario, token, expiraEm }` (já abre a sessão) |
| POST | `/api/auth/login` | **Login** — `{ email, senha }` → `{ usuario, token, expiraEm }` (401 igual para e-mail sem conta e senha errada) |
| POST | `/api/auth/recuperar-senha` | **Esqueci minha senha** — `{ email }` → sempre 200 com a mesma mensagem (não revela se a conta existe). Gera um link de uso único, válido por 30 min, que por enquanto aparece só no **console da API** |
| POST | `/api/auth/redefinir-senha` | `{ token, senha }` → 204; 400 se o link for inválido, usado ou expirado. Troca a senha e encerra todas as sessões do usuário |
| POST | `/api/auth/logout` 🔒 | Encerra a sessão atual (204) |
| GET | `/api/auth/eu` 🔒 | Usuário dono do token → `{ usuario }` |
| GET | `/api/usuarios` 🔒 | **Read** — lista todos → `{ usuarios }` |
| GET | `/api/usuarios/:id` 🔒 | **Read** — um usuário → `{ usuario }` (só o próprio; senão 403) |
| PATCH | `/api/usuarios/:id` 🔒 | **Update** — campos do perfil e/ou `senha` → `{ usuario }` (só o próprio; trocar a senha encerra as outras sessões) |
| POST | `/api/usuarios/:id/avatar` 🔒 | **Foto** — formulário com o arquivo no campo `foto` (PNG ou JPG, até 5 MB) → `{ usuario }` com `urlAvatar` apontando para a imagem |
| DELETE | `/api/usuarios/:id/avatar` 🔒 | **Remove a foto** — apaga o arquivo e volta `urlAvatar` para `null` → `{ usuario }` |
| DELETE | `/api/usuarios/:id` 🔒 | **Delete** — exclui a conta e as sessões (só o próprio) |
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
- Recuperação de senha: os links ficam na coleção `tokens_recuperacao_senha` (só o hash do token é salvo). O envio de
  e-mail ainda não existe: o link é impresso no log (`[recuperação de senha] link para ...`); para enviar de verdade,
  troque o `console.log` em `solicitarRecuperacaoSenha` (`modulos/auth/authService.js`). O endereço do frontend usado
  no link vem de `FRONTEND_URL` (padrão `http://localhost:5500`).
- Para proteger uma rota nova, use `exigirAutenticacao` (`src/middlewares/autenticacao.js`); depois dele,
  `req.usuario` e `req.sessao` estão disponíveis.
- O frontend guarda o token em `localStorage` (`acaistudy-token`) e o envia em toda requisição (`JS/users/api.js`).

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
    ├── utils/                     # ErroApi, validações e tokens (compartilhado)
    └── modulos/
        ├── auth/                  # Sessao.js, RecuperacaoSenha.js, authService.js, authController.js e authRoutes.js
        └── usuarios/              # Usuario.js (schema), usuarioService.js (regras),
                                   # usuarioController.js e usuarioRoutes.js

Novo módulo: crie `src/modulos/<nome>/` com o mesmo padrão (model, service, controller, routes)
e registre as rotas em `src/app.js`.
```
