/**
 * utils/ErroApi.js — ERRO COM STATUS HTTP.
 *
 * O `Error` padrão do JavaScript só tem uma mensagem. Para a API precisamos saber também
 * QUAL status HTTP responder (400, 404, 409...). Esta classe acrescenta o `status`.
 *
 * Uso: em qualquer lugar (service, validações...) basta fazer
 *     throw new ErroApi(404, 'Usuário não encontrado.');
 * e o middleware tratarErros.js reconhece o erro (via `instanceof ErroApi`) e responde
 * com esse status e essa mensagem. Assim a regra de negócio não precisa conhecer o
 * objeto `res` do Express.
 */

export class ErroApi extends Error {
    /**
     * @param {number} status   Código HTTP a ser devolvido (ex.: 400, 404, 409).
     * @param {string} mensagem Texto que será mostrado ao usuário no frontend.
     */
    constructor(status, mensagem) {
        super(mensagem);
        this.status = status;
    }
}
