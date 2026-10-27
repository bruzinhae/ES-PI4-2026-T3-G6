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

O servidor de cálculo do calendário (Java, socket) ficará separado e é chamado por esta API.

## Frontend

Abra os arquivos em `frontend/` no navegador (ou via extensão Live Server apontando para essa pasta). Criar conta, login e perfil usam a API (`frontend/JS/users/api.js`); as demais telas ainda são mock.

Ponto de entrada: `frontend/index.html` (homepage). Autenticação em `frontend/index_login.html`.

## Estrutura

```text
├── frontend/
│   ├── index.html                    # homepage
│   ├── index_*.html                  # app e autenticação
│   ├── CSS/                          # estilos
│   ├── JS/                           # scripts (JS/users/: login, cadastro, perfil, onboarding e cliente da API de usuários)
│   └── assets/                       # ícones e imagens
└── backend/
    ├── docker-compose.yml            # MongoDB local (opcional)
    ├── .env.example                  # modelo da URI Atlas
    ├── package.json
    └── src/                          # API Node.js (config, middlewares, utils, modulos/)
```
