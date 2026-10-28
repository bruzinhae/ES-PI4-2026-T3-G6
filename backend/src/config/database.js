/**
 * config/database.js — CONEXÃO COM O MONGODB via Mongoose.
 *
 * O Mongoose é a biblioteca que faz a ponte entre o JavaScript e o MongoDB: com ela definimos
 * "schemas" (formato dos documentos, ver models/Usuario.js) e fazemos consultas com métodos
 * como `find`, `create`, `findById`...
 *
 * A conexão fica isolada neste arquivo para que só um lugar do projeto saiba COMO conectar.
 * Depois que `mongoose.connect` termina, todos os models (ex.: Usuario) passam a usar essa
 * conexão automaticamente — não é preciso passar a conexão de arquivo em arquivo.
 */

import mongoose from 'mongoose';
import { env } from './env.js';
import { garantirColecoes } from './colecoes.js';

/**
 * Abre a conexão com o banco usando a URI definida em MONGODB_URI (Atlas ou local).
 * Se falhar, o erro "sobe" para quem chamou (server.js), que encerra a aplicação.
 */
export async function conectarBanco() {
    await mongoose.connect(env.mongodbUri);

    // O nome do banco vem da própria URI (o trecho "/acaistudy" antes do "?").
    // Mostrar no log ajuda a confirmar que estamos no banco certo.
    console.log(`MongoDB: conexão OK com o banco '${mongoose.connection.name}'`);

    // Cria no Atlas/local as coleções do dicionário (mesmo vazias) e sincroniza índices.
    const colecoes = await garantirColecoes();
    console.log(`MongoDB: coleções prontas — ${colecoes.join(', ')}`);
}

/**
 * Fecha a conexão. Não é usada pelo servidor em si, mas fica disponível para scripts
 * e testes que precisem encerrar a conexão no final (senão o Node não termina o processo).
 */
export async function desconectarBanco() {
    await mongoose.disconnect();
}
