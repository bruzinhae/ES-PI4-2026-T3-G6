# PI_IV_AcaiStudy

Aplicação AçaíStudy (PI IV). Frontend estático em `frontend/`; backend Java em `backend/` com conexão ao MongoDB.

## Pré-requisitos

- [JDK 17+](https://adoptium.net/) (ou `brew install openjdk@17`)
- Conta MongoDB Atlas (recomendado) **ou** [Docker](https://docs.docker.com/get-docker/) para Mongo local
- O Maven Wrapper (`./mvnw`) já está no projeto — não é necessário instalar Maven globalmente

## MongoDB Atlas (oficial do projeto)

No Compass, use o favorito **AçaíStudy**  
(`mongodb+srv://...@acaistudy.9drrdbe.mongodb.net/`).

1. Copie o exemplo de variáveis:

```bash
cd backend
cp .env.example .env
```

2. Edite `backend/.env` e troque `SUA_SENHA` pela senha do usuário Atlas `henrique_db_user`.

3. Suba o backend carregando o `.env`:

```bash
cd backend
set -a && source .env && set +a
export JAVA_HOME="$(/usr/libexec/java_home 2>/dev/null || echo /opt/homebrew/opt/openjdk@17)"
export PATH="$JAVA_HOME/bin:$PATH"
./mvnw spring-boot:run
```

No log, procure por:

```text
MongoDB: conexão OK com o banco 'acaistudy'
```

A URI também pode ser passada direto:

```bash
export MONGODB_URI='mongodb+srv://henrique_db_user:SENHA@acaistudy.9drrdbe.mongodb.net/acaistudy?retryWrites=true&w=majority'
./mvnw spring-boot:run
```

> Não commite o arquivo `.env` (já está no `.gitignore`).

## MongoDB local (opcional / Docker)

Se preferir local em vez do Atlas:

```bash
cd backend
docker compose up -d
# sem MONGODB_URI, usa mongodb://localhost:27017/acaistudy
./mvnw spring-boot:run
```

## Backend (escopo atual)

Neste momento o backend **não** expõe API REST nem WebSocket — apenas sobe o Spring Boot e valida a conexão com um `ping` no MongoDB.

## Frontend

Abra os arquivos em `frontend/` no navegador (ou via extensão Live Server apontando para essa pasta). Ainda não há integração com o backend.

Ponto de entrada: `frontend/index.html` (homepage). Autenticação em `frontend/index_login.html`.

## Estrutura

```text
├── frontend/
│   ├── index.html                    # homepage
│   ├── index_*.html                  # app e autenticação
│   ├── CSS/                          # estilos
│   ├── JS/                           # scripts
│   └── assets/                       # ícones e imagens
└── backend/
    ├── docker-compose.yml            # MongoDB local (opcional)
    ├── .env.example                  # modelo da URI Atlas
    ├── pom.xml
    └── src/main/java/...             # Spring Boot + ping MongoDB
```

## Autenticação local via WebSocket

O cadastro e o login usam mensagens JSON pelo endpoint WebSocket `ws://localhost:8080/ws`; o backend não expõe rotas REST para autenticação. O handshake inicial do próprio protocolo WebSocket continua sendo necessário.

1. Inicie um MongoDB local com Docker: `cd backend; docker compose up -d`.
2. Em outro terminal, inicie o backend: `cd backend; .\mvnw.cmd spring-boot:run`.
3. Sirva `frontend/` pelo VS Code Live Server na porta `5500` (não abra as páginas como `file://`).
4. Abra `index_criar_conta.html`, crie a conta e depois teste o login em `index_login.html`.

O protocolo aceita `auth.register`, `auth.login`, `auth.me` e `auth.logout`. Cada mensagem contém `requestId`, `type` e `payload`; a resposta repete o `requestId` e informa `success`, `data` ou `error`. Senhas são armazenadas com BCrypt. A sessão expira em sete dias; o token do navegador fica em `sessionStorage` e o MongoDB mantém somente seu hash.

Em produção, sirva o site por HTTPS e use `wss://`. A entrada com Google ainda não está integrada. A senha do Atlas foi exposta no arquivo local `backend/.env.example`; rotacione-a no painel Atlas. Mantenha esse arquivo com placeholders e configure a URI real somente como variável de ambiente, nunca em arquivos versionados.
