/**
 * middlewares/tratarErros.js — TRATAMENTO CENTRAL DE ERROS.
 *
 * Em vez de cada rota montar sua própria resposta de erro, todas apenas LANÇAM o erro
 * (`throw`) e ele chega aqui. Este arquivo converte qualquer erro numa resposta JSON
 * sempre no mesmo formato:
 *
 *     { "mensagem": "texto explicando o problema" }
 *
 * Isso simplifica o frontend (JS/servicos/api.js), que só precisa ler `mensagem` para
 * mostrar o erro na tela, e evita vazar detalhes internos (stack trace, dados do banco).
 *
 * Os dois middlewares são registrados no FINAL do app.js.
 */

import mongoose from 'mongoose';
import { ErroApi } from '../utils/ErroApi.js';

/**
 * Chamado quando nenhuma rota respondeu à requisição (URL ou método inexistente).
 * Não responde direto: cria um ErroApi 404 e passa adiante com `next(erro)`,
 * para que a resposta seja montada no mesmo lugar que os outros erros (tratarErros).
 */
export function rotaNaoEncontrada(_req, _res, next) {
    next(new ErroApi(404, 'Rota não encontrada.'));
}

/**
 * Middleware de erro do Express. O Express reconhece que é um tratador de erro porque a
 * função tem QUATRO parâmetros (erro, req, res, next) — por isso o `_next` precisa existir
 * mesmo sem ser usado.
 *
 * Cada `if` abaixo reconhece um tipo de erro e escolhe o status HTTP adequado.
 */
export function tratarErros(erro, _req, res, _next) {
    // 1) Erros que NÓS lançamos de propósito (ex.: "Usuário não encontrado.").
    //    Eles já carregam o status certo e uma mensagem pronta para o usuário.
    if (erro instanceof ErroApi) {
        return res.status(erro.status).json({ mensagem: erro.message });
    }

    // 2) Falha nas validações do schema do Mongoose (models/Usuario.js),
    //    ex.: nome muito curto, e-mail inválido, semestre 15.
    //    O Mongoose junta todos os campos inválidos em `erro.errors`; devolvemos só o
    //    primeiro para mostrar uma mensagem simples por vez.
    //    Se o problema foi de TIPO (ex.: semestre "abc" em vez de número), o erro interno
    //    é um CastError, cuja mensagem padrão é técnica — trocamos por uma mais amigável.
    //    Status 400 = Bad Request (o cliente mandou dados errados).
    if (erro instanceof mongoose.Error.ValidationError) {
        const primeiro = Object.values(erro.errors)[0];
        const mensagem = primeiro instanceof mongoose.Error.CastError
            ? `Valor inválido para o campo "${primeiro.path}".`
            : primeiro?.message;

        return res.status(400).json({ mensagem: mensagem ?? 'Dados inválidos.' });
    }

    // 3) CastError fora de uma validação: acontece principalmente quando o :id da URL não
    //    tem o formato de um ObjectId do MongoDB (ex.: GET /api/usuarios/123).
    if (erro instanceof mongoose.Error.CastError) {
        const mensagem = erro.path === '_id'
            ? 'ID de usuário inválido.'
            : `Valor inválido para o campo "${erro.path}".`;

        return res.status(400).json({ mensagem });
    }

    // 4) Código 11000 do MongoDB = violação de índice único (`unique: true` no
    //    emailNormalizado). O service já confere se o e-mail está livre antes de salvar,
    //    mas se duas requisições chegarem ao mesmo tempo as duas podem passar nessa
    //    checagem — aí é o próprio banco que barra a segunda, e caímos aqui.
    //    Status 409 = Conflict.
    if (erro?.code === 11000) {
        return res.status(409).json({ mensagem: 'Já existe uma conta com este e-mail.' });
    }

    // 5) JSON malformado no corpo da requisição (ex.: vírgula sobrando).
    //    Esse erro é gerado pelo `express.json()` antes mesmo de chegar nas rotas.
    if (erro?.type === 'entity.parse.failed') {
        return res.status(400).json({ mensagem: 'Corpo da requisição inválido.' });
    }

    // 6) Qualquer outra coisa é um erro inesperado (bug, banco caiu no meio...).
    //    Registramos o erro completo no terminal para quem estiver depurando, mas para o
    //    cliente devolvemos só uma mensagem genérica — detalhes internos não devem vazar.
    //    Status 500 = Internal Server Error.
    console.error(erro);
    return res.status(500).json({ mensagem: 'Erro interno do servidor.' });
}
