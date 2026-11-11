/**
 * servicos/clienteGemini.js — chamada à API do Gemini (models.generateContent).
 *
 * Pede a resposta em JSON seguindo um schema e devolve o objeto já interpretado.
 * Se o modelo principal estiver sobrecarregado ou sem cota, tenta o modelo reserva.
 * A chave fica só no backend: o navegador nunca fala direto com o Gemini.
 */

import { env } from '../config/env.js';
import { ErroApi } from '../utils/ErroApi.js';

const URL_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MENSAGEM_INDISPONIVEL = 'A Sofia não conseguiu analisar sua semana agora. Tente novamente em instantes.';
const MENSAGEM_LIMITE = 'A Sofia atingiu o limite de uso do Gemini. Tente novamente mais tarde.';

function nivelPensamento(modelo) {
    const id = modelo.toLowerCase();
    if (id.includes('lite')) return 'MINIMAL';
    const versao = id.match(/gemini-(\d+)(?:\.(\d+))?/);
    if (!versao) return 'LOW';
    const maior = Number(versao[1]);
    const menor = Number(versao[2] || 0);
    if (maior > 3 || (maior === 3 && menor >= 7)) return 'LOW';
    return 'MINIMAL';
}

function interpretar(corpo, modelo, mensagemIndisponivel) {
    const candidato = corpo.candidates?.[0];
    const texto = (candidato?.content?.parts || [])
        .filter((parte) => parte.text && !parte.thought)
        .map((parte) => parte.text)
        .join('');

    try {
        return { dados: JSON.parse(texto), modelo };
    } catch {
        console.error(`[gemini] ${modelo}: resposta sem JSON válido. finishReason:`, candidato?.finishReason);
        throw new ErroApi(503, mensagemIndisponivel);
    }
}

export async function gerarJson({ instrucaoSistema, prompt, schema, mensagens = {} }) {
    if (!env.gemini.apiKey) {
        throw new ErroApi(503, 'A Sofia ainda não está configurada neste servidor.');
    }

    const mensagemIndisponivel = mensagens.indisponivel || MENSAGEM_INDISPONIVEL;
    const mensagemLimite = mensagens.limite || MENSAGEM_LIMITE;
    let mensagem = mensagemIndisponivel;
    const modelos = env.gemini.modelos;
    for (let indice = 0; indice < modelos.length; indice += 1) {
        const modelo = modelos[indice];
        const corpo = JSON.stringify({
            systemInstruction: { parts: [{ text: instrucaoSistema }] },
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: 'application/json',
                responseJsonSchema: schema,
                maxOutputTokens: 1024,
                thinkingConfig: { thinkingLevel: nivelPensamento(modelo) },
            },
        });
        const ultimo = indice === modelos.length - 1;

        for (let tentativa = 1; tentativa <= 2; tentativa += 1) {
            let resposta;
            try {
                resposta = await fetch(`${URL_BASE}/${encodeURIComponent(modelo)}:generateContent`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-goog-api-key': env.gemini.apiKey,
                    },
                    body: corpo,
                    signal: AbortSignal.timeout(env.gemini.timeoutMs),
                });
            } catch (erro) {
                console.error(`[gemini] ${modelo}: falha de rede ou tempo esgotado:`, erro.name);
                mensagem = MENSAGEM_INDISPONIVEL;
                break;
            }

            if (resposta.ok) {
                return interpretar(await resposta.json(), modelo, mensagemIndisponivel);
            }

            const detalhe = await resposta.text().catch(() => '');
            console.error(`[gemini] ${modelo}: HTTP ${resposta.status}:`, detalhe.slice(0, 500));
            mensagem = resposta.status === 429 ? mensagemLimite : mensagemIndisponivel;

            const sobrecarregado = resposta.status === 429 || resposta.status === 503;
            if (resposta.status === 404) break;
            if (sobrecarregado && ultimo && tentativa === 1) {
                await new Promise((resolver) => setTimeout(resolver, 1000));
                continue;
            }

            if (!sobrecarregado && resposta.status < 500) {
                throw new ErroApi(503, mensagem);
            }
            break;
        }
    }

    throw new ErroApi(503, mensagem);
}
