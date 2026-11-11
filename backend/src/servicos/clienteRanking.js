import net from 'node:net';
import { env } from '../config/env.js';
import { ErroApi } from '../utils/ErroApi.js';

const TAMANHO_MAXIMO_DA_LINHA = 2_000_000;

// Cada tipo de pedido que o servidor Java entende: o que o backend aceita enviar e o que espera receber.
const PEDIDO_DE_RANKING = {
    tipo: 'pedidoDeRanking',
    tipoDaResposta: 'ranking',
    prefixoDeErroDeCalculo: 'Não foi possível calcular o ranking:',
    camposPermitidos: ['agora', 'preferencias', 'limite', 'alocar', 'espacos', 'tarefas'],
    descricao: 'de ranking',
    validar(pedido) {
        if ('alocar' in pedido && typeof pedido.alocar !== 'boolean') {
            throw new ErroApi(400, 'O campo "alocar" deve ser verdadeiro ou falso.');
        }
        listaLimitada(pedido, ['espacos', 'tarefas'], 2000);
    },
    respostaValida: (resposta) => Array.isArray(resposta.porEspaco) && Array.isArray(resposta.semEspaco),
};

const PEDIDO_DE_METAS = {
    tipo: 'pedidoDeMetas',
    tipoDaResposta: 'prioridadeDeMetas',
    prefixoDeErroDeCalculo: 'Não foi possível priorizar as metas:',
    camposPermitidos: ['agora', 'metas', 'quantidadeDeMarcos'],
    descricao: 'de metas',
    validar(pedido) {
        listaLimitada(pedido, ['metas'], 200);
    },
    respostaValida: (resposta) => Array.isArray(resposta.ranking) && Array.isArray(resposta.datasDosMarcos),
};

function listaLimitada(pedido, campos, maximo) {
    for (const campo of campos) {
        if (!Array.isArray(pedido[campo])) {
            throw new ErroApi(400, `O campo "${campo}" deve ser uma lista.`);
        }
        if (pedido[campo].length > maximo) {
            throw new ErroApi(400, `O campo "${campo}" não pode ter mais de ${maximo} itens.`);
        }
    }
}

function validarPedido(pedido, modelo) {
    if (!pedido || typeof pedido !== 'object' || Array.isArray(pedido)) {
        throw new ErroApi(400, `Envie o pedido ${modelo.descricao} em formato JSON.`);
    }

    const desconhecido = Object.keys(pedido).find((campo) => !modelo.camposPermitidos.includes(campo));
    if (desconhecido) {
        throw new ErroApi(400, `Campo não permitido no pedido ${modelo.descricao}: ${desconhecido}.`);
    }

    modelo.validar(pedido);
    return JSON.stringify({ ...pedido, tipo: modelo.tipo });
}

/** Pede ao servidor Java o ranking de tarefas por espaço livre (e, com `alocar`, a alocação). */
export function pedirRanking(pedido, configuracao = env.rankingJava) {
    return enviarPedido(pedido, PEDIDO_DE_RANKING, configuracao);
}

/** Pede ao servidor Java a prioridade das metas, a meta foco e as datas sugeridas para os marcos. */
export function pedirPrioridadeDeMetas(pedido, configuracao = env.rankingJava) {
    return enviarPedido(pedido, PEDIDO_DE_METAS, configuracao);
}

/**
 * Encaminha um pedido ao servidor Java usando o protocolo TCP de uma linha JSON.
 * As opções de conexão podem ser substituídas em testes; em produção usam o .env.
 */
async function enviarPedido(pedido, modelo, configuracao) {
    const mensagem = validarPedido(pedido, modelo);
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
                const erroDeCalculo = resposta.mensagem?.startsWith(modelo.prefixoDeErroDeCalculo);
                encerrar(new ErroApi(
                    erroDeCalculo ? 502 : 400,
                    resposta.mensagem || `O servidor Java rejeitou o pedido ${modelo.descricao}.`,
                ));
                return;
            }
            if (resposta?.tipo !== modelo.tipoDaResposta || !modelo.respostaValida(resposta)) {
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
