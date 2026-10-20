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
