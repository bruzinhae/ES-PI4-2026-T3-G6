# PI_IV_AcaiStudy

Aplicação AçaíStudy (PI IV). Frontend estático em `frontend/`; backend (API Node.js/Express + MongoDB) em `backend/`.

## Pré-requisitos

- [Node.js 20+](https://nodejs.org/)
- Conta MongoDB Atlas (recomendado) **ou** [Docker](https://docs.docker.com/get-docker/) para Mongo local

## MongoDB Atlas (oficial do projeto)

No Compass, use o favorito **AçaíStudy**  
(`mongodb+srv://...@acaistudy.9drrdbe.mongodb.net/`).

1. Copie o exemplo de variáveis:

```bash
cd backend
cp .env.example .env
```

2. Edite `backend/.env` e troque `SUA_SENHA` pela senha do usuário Atlas `henrique_db_user`.

3. Suba a API:

```bash
cd backend
npm install
npm run dev   # http://localhost:3001/api
```

No log, procure por:

```text
MongoDB: conexão OK com o banco 'acaistudy'
```

> Não commite o arquivo `.env` (já está no `.gitignore`).

## MongoDB local (opcional / Docker)

Se preferir local em vez do Atlas:

```bash
cd backend
docker compose up -d
# sem MONGODB_URI, usa mongodb://localhost:27017/acaistudy
npm run dev
```

## Backend

API única em Node.js (`backend/`), organizada em módulos (`backend/src/modulos/`). Veja [backend/README.md](backend/README.md).

## Servidor Java

O servidor Java (`servidor/`) é um serviço TCP separado, na porta 3000. O backend Node é o cliente dele e o usa em três lugares:
o "Ajuste da grade" do calendário e o card de ajuste da página de Disciplinas (`GET /api/grade/sugestoes`),
o botão "Sugerir marcos" das Metas (a Sofia) e `POST /api/ranking`. Sem ele, a grade responde 503 e a Sofia volta a usar só o Gemini.

Para subir (Java 17, sem Maven e sem dependências):

```bash
cd servidor/src/main/java
javac *.java
java Servidor            # porta 3000
```

Depois de mudar o código do servidor, recompile e reinicie. Veja [servidor/README.md](servidor/README.md) e
[backend/README.md](backend/README.md) para detalhes.

## Frontend

Com o backend no ar, as páginas já abrem em `http://localhost:3001/index.html`, porque o mesmo servidor entrega o `frontend/`. Também dá para abrir a pasta com a extensão Live Server (a API em `localhost:3001` libera CORS no desenvolvimento).

Todas as telas, menos a home (`index.html`), usam a API pelo cliente `frontend/JS/users/api.js`: conta e perfil, calendário, disciplinas e blocos fixos, metas, relatórios e configurações. O token fica em `localStorage` (`acaistudy-token`) e, para apontar para outra API, defina `window.ACAISTUDY_API_URL`.

Ponto de entrada: `frontend/index.html` (homepage). Autenticação em `frontend/index_login.html`.

## Estrutura

```text
├── frontend/
│   ├── index.html                    # homepage
│   ├── index_*.html                  # app e autenticação
│   ├── CSS/                          # estilos
│   ├── JS/                           # scripts (JS/users/: login, cadastro, perfil, onboarding e cliente da API de usuários)
│   └── assets/                       # ícones e imagens
├── backend/
│   ├── docker-compose.yml            # MongoDB local (opcional)
│   ├── .env.example                  # modelo das variáveis de ambiente (Atlas, SMTP, Canvas, Gemini, servidor Java)
│   ├── package.json
│   └── src/                          # API Node.js (config, middlewares, servicos, utils, modulos/)
├── servidor/                         # servidor Java de ranking, alocação e metas (veja servidor/README.md)
│   └── src/main/java/                # código do servidor (compile com javac *.java)
└── Arquivos/
    └── Dicionário de dados/          # um JSON por coleção do MongoDB
```
