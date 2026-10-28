/**
 * auth/authController.js — CAMADA HTTP das rotas /api/auth.
 * Mesmo papel do usuarioController: extrai da requisição, chama o service e responde.
 */

import * as authService from './authService.js';
import { apresentarUsuario } from '../usuarios/apresentarUsuario.js';

// POST /api/auth/login — devolve o usuário e o token da nova sessão.
export async function entrar(req, res) {
    const { usuario, token, expiraEm } = await authService.entrar(req.body);
    res.json({ usuario: apresentarUsuario(req, usuario), token, expiraEm });
}

// POST /api/auth/recuperar-senha — pede o link de recuperação. Responde sempre 200 com a mesma
// mensagem, exista a conta ou não.
export async function recuperarSenha(req, res) {
    await authService.solicitarRecuperacaoSenha(req.body);
    res.json({ mensagem: 'Se o e-mail estiver cadastrado, enviamos um link de recuperação.' });
}

// GET /api/auth/redefinir-senha?token= — a tela confere o link ao abrir. 204 = ainda vale.
export async function conferirLinkRedefinicao(req, res) {
    await authService.conferirLinkRedefinicao(req.query.token);
    res.status(204).end();
}

// POST /api/auth/redefinir-senha — troca a senha usando o token do link. 204 = sem corpo.
export async function redefinirSenha(req, res) {
    await authService.redefinirSenha(req.body);
    res.status(204).end();
}

// POST /api/auth/logout — encerra a sessão usada na requisição. 204 = sem corpo.
export async function sair(req, res) {
    await authService.encerrarSessao(req.sessao.id);
    res.status(204).end();
}

// GET /api/auth/eu — devolve o usuário dono do token (o middleware já o carregou).
export function eu(req, res) {
    res.json({ usuario: apresentarUsuario(req, req.usuario) });
}
