/**
 * server.js — PONTO DE ENTRADA da API de usuários.
 *
 * É o arquivo executado por `npm start` / `npm run dev` (ver "main" e "scripts" no package.json).
 * Ele tem só duas responsabilidades:
 *   1. Conectar no MongoDB.
 *   2. Colocar o servidor HTTP (Express) para escutar na porta configurada.
 *
 * Por que separar do app.js? O app.js só MONTA a aplicação (middlewares e rotas), sem abrir
 * porta nem conectar no banco. Assim dá para importar o `app` em testes automatizados sem
 * subir um servidor de verdade. Quem "liga" tudo é este arquivo.
 */

import { app } from './app.js';
import { conectarBanco } from './config/database.js';
import { env } from './config/env.js';

// Conecta no banco ANTES de subir o servidor: não faz sentido aceitar requisições
// se não conseguimos salvar nem ler usuários.
// O `await` aqui fora de uma função funciona porque o projeto usa ES Modules
// ("type": "module" no package.json), que permitem "top-level await".
try {
    await conectarBanco();
} catch (erro) {
    // Se o MongoDB estiver fora do ar ou a URI/senha estiver errada, mostramos o motivo
    // e encerramos o processo com código 1 (= terminou com erro), em vez de deixar
    // uma API "meio viva" que falharia em todas as requisições.
    console.error('MongoDB: falha ao conectar —', erro.message);
    process.exit(1);
}

// Começa a escutar requisições HTTP. O frontend (JS/servicos/api.js) chama
// http://localhost:3001/api por padrão, por isso a porta padrão é 3001.
app.listen(env.porta, () => {
    console.log(`API de usuários rodando em http://localhost:${env.porta}/api`);
});
