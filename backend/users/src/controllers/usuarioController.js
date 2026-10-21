/**
 * controllers/usuarioController.js — CAMADA HTTP das rotas /api/usuarios.
 *
 * O controller é o "meio de campo" entre a requisição HTTP e a regra de negócio:
 *   1. Tira da requisição o que interessa (`req.body`, `req.params.id`);
 *   2. Chama a função correspondente do service (onde estão as regras de verdade);
 *   3. Devolve a resposta com o status HTTP certo.
 *
 * Por que não colocar tudo aqui? Separar deixa o service independente do Express:
 * ele não sabe o que é `req`/`res`, então pode ser reaproveitado e testado sozinho.
 *
 * Repare que não há try/catch: no Express 5, se uma função `async` lançar erro (ex.:
 * ErroApi 404 vindo do service), ele é enviado automaticamente para o middleware
 * tratarErros.js, que monta a resposta de erro.
 */

import * as usuarioService from '../services/usuarioService.js';

// POST /api/usuarios — cria um usuário com os dados do formulário de cadastro.
// 201 = Created (recurso criado com sucesso).
export async function criar(req, res) {
    const usuario = await usuarioService.criar(req.body);
    res.status(201).json({ usuario });
}

// POST /api/usuarios/login — confere e-mail e senha e devolve o usuário (404 se o e-mail não tem conta, 401 se a senha não conferir).
export async function entrar(req, res) {
    const usuario = await usuarioService.autenticar(req.body);
    res.json({ usuario });
}

// GET /api/usuarios — devolve todos os usuários (o status padrão já é 200 = OK).
export async function listar(_req, res) {
    const usuarios = await usuarioService.listar();
    res.json({ usuarios });
}

// GET /api/usuarios/:id — devolve um único usuário pelo id.
export async function buscarPorId(req, res) {
    const usuario = await usuarioService.buscarPorId(req.params.id);
    res.json({ usuario });
}

// PATCH /api/usuarios/:id — atualiza só os campos enviados e devolve o usuário já atualizado.
export async function atualizar(req, res) {
    const usuario = await usuarioService.atualizar(req.params.id, req.body);
    res.json({ usuario });
}

// DELETE /api/usuarios/:id — exclui o usuário.
// 204 = No Content: deu certo e não há nada para devolver no corpo, por isso `.end()`.
export async function excluir(req, res) {
    await usuarioService.excluir(req.params.id);
    res.status(204).end();
}
