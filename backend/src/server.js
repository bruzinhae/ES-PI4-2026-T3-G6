/**
 * server.js — PONTO DE ENTRADA da API do AçaíStudy.
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
import { verificarCorreio } from './servicos/correio.js';

// Conecta no banco ANTES de subir o servidor: não faz sentido aceitar requisições
// se não conseguimos salvar nem ler dados.
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

// Começa a escutar requisições HTTP. O frontend (JS/users/api.js) chama
// http://localhost:3001/api por padrão, por isso a porta padrão é 3001.
app.listen(env.porta, async () => {
    const base = `http://localhost:${env.porta}`;
    anunciarServidor({
        pagina: `${base}/index.html`,
        api: `${base}/api`,
    });

    const correio = await verificarCorreio();

    if (correio.ok) {
        console.log('E-mail: SMTP pronto para enviar o link de redefinição de senha.');
    } else {
        console.warn(`E-mail: recuperação de senha sem envio — ${correio.motivo}`);
    }
});

/**
 * Quadro no terminal com os dois endereços clicáveis: a página HTML da
 * plataforma e a API. As cores só entram quando a saída é um terminal.
 */
function anunciarServidor({ pagina, api }) {
    const cor = process.stdout.isTTY;
    const roxo = cor ? '\x1b[38;5;141m' : '';
    const titulo = cor ? '\x1b[1;38;5;135m' : '';
    const link = cor ? '\x1b[4;36m' : '';
    const suave = cor ? '\x1b[90m' : '';
    const reset = cor ? '\x1b[0m' : '';
    const largura = 52;

    const semCor = (texto) => texto.replace(/\x1b\[[0-9;]*m/g, '');
    const miolo = (conteudo = '') => {
        const folga = Math.max(0, largura - semCor(conteudo).length);
        return `${roxo}│${reset} ${conteudo}${' '.repeat(folga)} ${roxo}│${reset}`;
    };
    const traco = '─'.repeat(largura + 2);

    console.log('');
    console.log(`${roxo}╭${traco}╮${reset}`);
    console.log(miolo());
    console.log(miolo(`${titulo}AçaíStudy${reset}  ${suave}está no ar${reset}`));
    console.log(miolo());
    console.log(miolo(`${suave}Página da plataforma${reset}`));
    console.log(miolo(`${link}${pagina}${reset}`));
    console.log(miolo());
    console.log(miolo(`${suave}API${reset}`));
    console.log(miolo(`${link}${api}${reset}`));
    console.log(miolo());
    console.log(`${roxo}╰${traco}╯${reset}`);
    console.log('');
}
