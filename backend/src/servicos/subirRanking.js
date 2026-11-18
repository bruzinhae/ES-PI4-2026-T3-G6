import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '../config/env.js';

const pastaServidor = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../servidor');

function portaAberta(porta) {
    return new Promise((resolve) => {
        const socket = net.connect({ host: env.rankingJava.host, port: porta });
        const encerrar = (aberta) => {
            socket.removeAllListeners();
            socket.destroy();
            resolve(aberta);
        };
        socket.setTimeout(400);
        socket.once('connect', () => encerrar(true));
        socket.once('timeout', () => encerrar(false));
        socket.once('error', () => encerrar(false));
    });
}

function esperar(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

/**
 * Sobe o servidor Java de sugestões se a porta estiver livre.
 * A API Node fala com ele em RANKING_PORT (padrão 3000).
 */
export async function garantirRanking() {
    if (process.env.RANKING_AUTOSTART === 'false') return;
    const porta = env.rankingJava.port;
    if (await portaAberta(porta)) return;

    const classes = path.join(pastaServidor, 'target', 'classes');
    if (!existsSync(path.join(classes, 'Servidor.class'))) {
        console.warn(`Ranking Java: sem classes em ${classes}. Compile com: mvn -f servidor/pom.xml compile`);
        return;
    }

    const filho = spawn('java', ['-cp', classes, 'Servidor', String(porta)], {
        cwd: pastaServidor,
        detached: true,
        stdio: 'ignore',
    });
    filho.on('error', () => {
        console.warn('Ranking Java: o comando java não está disponível neste computador.');
    });
    filho.unref();

    for (let tentativa = 0; tentativa < 10; tentativa += 1) {
        await esperar(300);
        if (await portaAberta(porta)) {
            console.log(`Ranking Java: ouvindo em ${env.rankingJava.host}:${porta}.`);
            return;
        }
    }
    console.warn(`Ranking Java: a porta ${porta} não respondeu. As sugestões da grade ficam indisponíveis até o Servidor subir.`);
}
