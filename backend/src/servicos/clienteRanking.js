import net from 'node:net';
import { env } from '../config/env.js';
import { ErroApi } from '../utils/ErroApi.js';

const TAMANHO_MAXIMO_DA_LINHA = 2_000_000;
const CAMPOS_DO_PEDIDO = ['agora', 'preferencias', 'limite', 'espacos', 'tarefas'];

function validarPedido(pedido) {
    if (!pedido || typeof pedido !== 'object' || Array.isArray(pedido)) {
        throw new ErroApi(400, 'Envie o pedido de ranking em formato JSON.');
    }

    const desconhecido = Object.keys(pedido).find((campo) => !CAMPOS_DO_PEDIDO.includes(campo));
    if (desconhecido) {
        throw new ErroApi(400, `Campo não permitido no pedido de ranking: ${desconhecido}.`);
    }

    for (const campo of ['espacos', 'tarefas']) {
        if (!Array.isArray(pedido[campo])) {
            throw new ErroApi(400, `O campo "${campo}" deve ser uma lista.`);
        }
        if (pedido[campo].length > 2000) {
            throw new ErroApi(400, `O campo "${campo}" não pode ter mais de 2000 itens.`);
        }
    }

    return JSON.stringify({ ...pedido, tipo: 'pedidoDeRanking' });
}

/**
 * Encaminha um pedido ao servidor Java usando o protocolo TCP de uma linha JSON.
 * As opções de conexão podem ser substituídas em testes; em produção usam o .env.
 */
export async function pedirRanking(pedido, configuracao = env.rankingJava) {
    const mensagem = validarPedido(pedido);
    if (Buffer.byteLength(mensagem, 'utf8') > TAMANHO_MAXIMO_DA_LINHA) {
        throw new ErroApi(413, 'O pedido de ranking excede o limite de 2 MB.');
    }

    return new Promise((resolve, reject) => {
        const socket = net.createConnection({
            host: configuracao.host,
            port: configuracao.port,
        });
        let buffer = '';
        let finalizado = false;

        function encerrar(erro, resultado) {
            if (finalizado) return;
            finalizado = true;
            socket.destroy();
            if (erro) reject(erro);
            else resolve(resultado);
        }

        socket.setEncoding('utf8');
        socket.setTimeout(configuracao.timeoutMs, () => {
            encerrar(new ErroApi(504, 'O servidor Java de ranking demorou para responder.'));
        });

        socket.on('connect', () => {
            socket.write(`${mensagem}\n`, 'utf8', (erro) => {
                if (erro) {
                    encerrar(new ErroApi(503, 'Não foi possível enviar o pedido ao servidor Java de ranking.'));
                }
            });
        });

        socket.on('data', (parte) => {
            buffer += parte;
            if (Buffer.byteLength(buffer, 'utf8') > TAMANHO_MAXIMO_DA_LINHA) {
                encerrar(new ErroApi(502, 'A resposta do servidor Java de ranking excede o limite de 2 MB.'));
                return;
            }

            const fimDaLinha = buffer.indexOf('\n');
            if (fimDaLinha === -1) return;

            let resposta;
            try {
                resposta = JSON.parse(buffer.slice(0, fimDaLinha).replace(/\r$/, ''));
            } catch {
                encerrar(new ErroApi(502, 'O servidor Java de ranking devolveu uma resposta inválida.'));
                return;
            }

            if (resposta?.tipo === 'erro') {
                const erroDeCalculo = resposta.mensagem?.startsWith('Não foi possível calcular o ranking:');
                encerrar(new ErroApi(
                    erroDeCalculo ? 502 : 400,
                    resposta.mensagem || 'O servidor Java rejeitou o pedido de ranking.',
                ));
                return;
            }
            if (resposta?.tipo !== 'ranking'
                || !Array.isArray(resposta.porEspaco)
                || !Array.isArray(resposta.semEspaco)) {
                encerrar(new ErroApi(502, 'O servidor Java devolveu um tipo de resposta inesperado.'));
                return;
            }

            encerrar(null, resposta);
        });

        socket.on('error', () => {
            encerrar(new ErroApi(503, 'Servidor Java de ranking indisponível.'));
        });

        socket.on('close', () => {
            if (!finalizado) {
                encerrar(new ErroApi(503, 'O servidor Java encerrou a conexão sem responder.'));
            }
        });
    });
}
