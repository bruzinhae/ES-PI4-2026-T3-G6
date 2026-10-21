/**
 * config/env.js — VARIÁVEIS DE AMBIENTE da API de usuários.
 *
 * Variáveis de ambiente são configurações que mudam de máquina para máquina (senha do banco,
 * porta...) e que NÃO devem ficar escritas no código nem ir para o GitHub. Elas ficam num
 * arquivo `.env` (que está no .gitignore); o `.env.example` mostra quais variáveis existem.
 *
 * Ordem de leitura:
 *   1. backend/users/.env  (específico desta API)
 *   2. backend/.env        (fallback: o mesmo arquivo usado pelo Spring Boot, para não precisar
 *                           duplicar a URI do Atlas)
 * Se a mesma variável estiver nos dois, vale a do primeiro arquivo.
 *
 * O resto do projeto importa o objeto `env` daqui em vez de ler `process.env` espalhado pelo
 * código — assim os valores padrão e os nomes ficam todos num lugar só.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// Caminho absoluto da pasta backend/users.
// Em ES Modules não existe `__dirname`, então calculamos a partir da URL deste arquivo
// (src/config/env.js) e subimos duas pastas ('../..').
// Usar caminho absoluto garante que o .env é encontrado mesmo se o `npm start`
// for rodado de outra pasta.
const pastaUsers = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// Carrega os arquivos .env para dentro de `process.env`.
// `quiet: true` desliga a mensagem informativa que o dotenv imprime no console.
dotenv.config({
    path: [path.join(pastaUsers, '.env'), path.join(pastaUsers, '..', '.env')],
    quiet: true,
});

export const env = {
    // Porta HTTP da API. 3001 para não conflitar com o Spring Boot (8080).
    // `Number(...)` porque tudo em process.env é string.
    porta: Number(process.env.PORT) || 3001,

    // Endereço do MongoDB. Sem nenhuma configuração, usa o Mongo local
    // (o do docker-compose.yml do backend).
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/acaistudy',

    // Origens (sites) que podem chamar a API pelo navegador. Ver o uso no app.js.
    corsOrigin: process.env.CORS_ORIGIN || '*',
};
