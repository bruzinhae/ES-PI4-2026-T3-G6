/**
 * config/env.js — VARIÁVEIS DE AMBIENTE da API do AçaíStudy.
 *
 * Variáveis de ambiente são configurações que mudam de máquina para máquina (senha do banco,
 * porta...) e que NÃO devem ficar escritas no código nem ir para o GitHub. Elas ficam num
 * arquivo `.env` (que está no .gitignore); o `.env.example` mostra quais variáveis existem.
 *
 * Lê o arquivo backend/.env (copie de backend/.env.example e preencha a senha do Atlas).
 *
 * O resto do projeto importa o objeto `env` daqui em vez de ler `process.env` espalhado pelo
 * código — assim os valores padrão e os nomes ficam todos num lugar só.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// Caminho absoluto da pasta backend.
// Em ES Modules não existe `__dirname`, então calculamos a partir da URL deste arquivo
// (src/config/env.js) e subimos duas pastas ('../..').
// Usar caminho absoluto garante que o .env é encontrado mesmo se o `npm start`
// for rodado de outra pasta.
const pastaBackend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// Carrega os arquivos .env para dentro de `process.env`.
// `quiet: true` desliga a mensagem informativa que o dotenv imprime no console.
dotenv.config({
    path: path.join(pastaBackend, '.env'),
    quiet: true,
});

// Porta HTTP da API. O servidor Java de cálculo do calendário usa outra porta.
// `Number(...)` porque tudo em process.env é string.
const porta = Number(process.env.PORT) || 3001;

// Porta do SMTP. 587 = STARTTLS (Gmail e a maioria dos provedores); 465 = TLS direto.
const portaSmtp = Number(process.env.SMTP_PORT) || 587;

// `SMTP_SECURE=true` força TLS na conexão. Sem a variável, só a porta 465 liga isso.
const smtpSecure = process.env.SMTP_SECURE === 'true'
    || (process.env.SMTP_SECURE !== 'false' && portaSmtp === 465);

const usuarioSmtp = process.env.SMTP_USER || '';

export const env = {
    porta,

    // Endereço do MongoDB. Sem nenhuma configuração, usa o Mongo local
    // (o do docker-compose.yml do backend).
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/acaistudy',

    // Endereço do frontend, usado para montar o link de recuperação de senha.
    // O mesmo processo entrega as páginas, então o padrão é a própria API.
    frontendUrl: (process.env.FRONTEND_URL || `http://localhost:${porta}`).replace(/\/+$/, ''),

    // Origens (sites) que podem chamar a API pelo navegador. Ver o uso no app.js.
    corsOrigin: process.env.CORS_ORIGIN || '*',

    // Conta SMTP que envia o link de redefinição. Sem host, usuário e senha, o envio
    // não acontece (a recuperação avisa em vez de fingir que o e-mail saiu).
    smtp: {
        host: process.env.SMTP_HOST || '',
        port: portaSmtp,
        secure: smtpSecure,
        user: usuarioSmtp,
        pass: process.env.SMTP_PASS || '',
        from: process.env.SMTP_FROM || (usuarioSmtp ? `AçaíStudy <${usuarioSmtp}>` : ''),
    },
};
