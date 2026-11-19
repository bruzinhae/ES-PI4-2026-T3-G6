# AçaíStudy 🍇

> **Organização de estudos sem esforço.**

Projeto Integrador IV · PUC

## O problema

Muitos estudantes universitários têm dificuldade para organizar a semana. Aulas, trabalho, provas e
entregas disputam o mesmo tempo, e montar um cronograma na mão (e mantê-lo atualizado) dá trabalho.
Na prática, o planejamento fica de lado e o estudo acaba concentrado na véspera.

## A solução

O AçaíStudy é uma plataforma web que **monta e ajusta a rotina de estudos sozinha**. O estudante informa
suas disciplinas, seus horários fixos e suas metas. A plataforma encontra os horários livres da semana,
decide o que é mais urgente e sugere onde encaixar cada sessão de estudo. Depois, acompanha o progresso
e propõe melhorias com a ajuda de uma assistente de IA, a **Sofia**.

## Funcionalidades

| | Funcionalidade | Descrição |
| - | -------------- | --------- |
| 🚀 | **Onboarding guiado** | No primeiro acesso, perguntas sobre o semestre, os horários, o foco e as metas deixam tudo configurado |
| 📅 | **Calendário semanal** | Aulas, compromissos fixos e sessões de estudo juntos, com **ajuste automático da grade** |
| 📚 | **Disciplinas e tarefas** | Matérias do semestre, provas e trabalhos, e quanto tempo livre sobra na semana |
| 🎯 | **Metas** | Objetivos com **sugestão automática de marcos** até o prazo |
| 📊 | **Relatórios** | Horas estudadas, progresso por disciplina e sugestões da Sofia |
| 🤖 | **Sofia (IA)** | Assistente com Gemini que analisa a rotina e sugere ajustes |
| 🎓 | **Integração com o Canvas** | Importa cursos e atividades do Canvas LMS da instituição |
| 🔐 | **Conta e segurança** | Cadastro, login com sessão por token, confirmação de e-mail e recuperação de senha |

## Arquitetura

O sistema tem três camadas independentes:

```text
┌────────────┐   HTTP/JSON   ┌──────────────────┐   TCP/JSON   ┌────────────────────────┐
│  Frontend  │ ────────────► │   API (Node.js)  │ ───────────► │ Servidor Java (ranking)│
│ HTML/CSS/JS│ ◄──────────── │  Express · 3001  │ ◄─────────── │   sockets · porta 3000 │
└────────────┘               └────────┬─────────┘              └────────────────────────┘
                                      │
                       ┌──────────────┼───────────────┐
                       ▼              ▼               ▼
                   MongoDB      Gemini (Sofia)   Canvas · SMTP
```

- **Frontend:** páginas em HTML, CSS e JavaScript puro, entregues pela própria API.
- **API:** Node.js com Express e MongoDB (Mongoose). Organizada em módulos (usuários, disciplinas,
  tarefas, sessões, metas, relatórios, grade…), com autenticação por token.
- **Servidor de ranking:** em Java, cliente-servidor com sockets e threads, no modelo visto em aula.
  Recebe os horários livres e as tarefas pendentes e devolve **um ranking de prioridade** para cada
  horário, além da distribuição dos marcos das metas. Não acessa o banco nem guarda estado: cada pedido
  é uma linha de JSON.

| Camada | Tecnologias |
| ------ | ----------- |
| Frontend | HTML5, CSS3, JavaScript (ES Modules), Jest |
| Backend | Node.js 20, Express 5, MongoDB Atlas, Mongoose, bcrypt, Nodemailer |
| Servidor | Java 17 (sem dependências), JUnit 5 |
| Integrações | Google Gemini, Canvas LMS, SMTP |

## Como rodar

**Pré-requisitos:** [Node.js 20+](https://nodejs.org/) e [Java 17+](https://adoptium.net/). Para o banco,
use o MongoDB Atlas do grupo ou o [Docker](https://docs.docker.com/get-docker/), que sobe um Mongo local.

**1. Configure o ambiente** (só na primeira vez):

```bash
cd backend
cp .env.example .env     # coloque a senha do Atlas em MONGODB_URI
npm install
```

> Sem Atlas? Apague a linha `MONGODB_URI` do `.env` e rode `docker compose up -d` dentro de `backend/`.

**2. Ligue o servidor Java** (terminal 1):

```bash
cd servidor/src/main/java
javac -d out Servidor.java
java -cp out Servidor            # porta 3000 · para desligar, digite "desativar"
```

**3. Ligue a API** (terminal 2):

```bash
cd backend
npm run dev                      # porta 3001
```

**4. Abra o site:** **<http://localhost:3001/index.html>** 🎉

A API sobe só com o banco. A **Sofia** precisa de `GEMINI_API_KEY`, o **e-mail** precisa das variáveis
`SMTP_*` e o **Canvas** precisa das variáveis `CANVAS_*`, todas no `.env`. Se o servidor Java estiver
desligado, o ajuste da grade fica indisponível e o resto do site continua funcionando.

## Testes

```bash
cd backend  && npm test                  # API: rotina semanal
cd frontend && npm install && npm test   # Frontend: metas (Jest)
cd servidor && mvn test                  # Servidor Java: JUnit 5 (precisa do Maven)
```

## Estrutura do repositório

```text
├── frontend/                 # telas (index_*.html), estilos (CSS/) e scripts (JS/)
├── backend/                  # API Node.js
│   └── src/modulos/          # um módulo por área: auth, usuarios, disciplinas, tarefas, metas…
├── servidor/                 # servidor Java de ranking, alocação e metas
└── Arquivos/
    └── Dicionário de dados/  # estrutura de cada coleção do MongoDB
```

## Documentação

- [backend/README.md](backend/README.md): rotas da API, autenticação e variáveis de ambiente.
- [servidor/README.md](servidor/README.md): arquitetura do servidor Java e protocolo de comunicação.
- [Dicionário de dados](Arquivos/Dicionário%20de%20dados/): campos de cada coleção do banco.

## Equipe

- Bernardo Alberto Amaro
- Bruna Barbour Fernandes
- Guilherme
- Henrique Ribeiro
- Rafael Candian
