/**
 * auth/authController.js — CAMADA HTTP das rotas /api/auth.
 * Mesmo papel do usuarioController: extrai da requisição, chama o service e responde.
 */

import * as authService from './authService.js';

// POST /api/auth/login — devolve o usuário e o token da nova sessão.
export async function entrar(req, res) {
    const { usuario, token, expiraEm } = await authService.entrar(req.body);
    res.json({ usuario, token, expiraEm });
}

// POST /api/auth/logout — encerra a sessão usada na requisição. 204 = sem corpo.
export async function sair(req, res) {
    await authService.encerrarSessao(req.sessao.id);
    res.status(204).end();
}

// GET /api/auth/eu — devolve o usuário dono do token (o middleware já o carregou).
export function eu(req, res) {
    res.json({ usuario: req.usuario });
}
