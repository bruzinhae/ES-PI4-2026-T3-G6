/**
 * middlewares/autenticacao.js — PROTEÇÃO DE ROTAS.
 *
 * Qualquer módulo da API protege uma rota colocando `exigirAutenticacao` antes do controller:
 *     router.get('/', exigirAutenticacao, controller.listar);
 * Quando passa, a requisição ganha `req.usuario` (documento do usuário) e `req.sessao`.
 * O frontend manda o token no cabeçalho `Authorization: Bearer <token>`.
 */

import { buscarSessaoValida } from '../modulos/auth/authService.js';
import { Usuario } from '../modulos/usuarios/Usuario.js';
import { ErroApi } from '../utils/ErroApi.js';

const MENSAGEM_NAO_AUTENTICADO = 'Sessão inválida ou expirada. Entre novamente.';

export async function exigirAutenticacao(req, _res, next) {
    const [tipo, token] = (req.headers.authorization || '').split(' ');

    if (tipo !== 'Bearer' || !token) {
        throw new ErroApi(401, 'Faça login para continuar.');
    }

    const sessao = await buscarSessaoValida(token);
    const usuario = sessao && await Usuario.findById(sessao.usuarioId);

    if (!usuario) {
        throw new ErroApi(401, MENSAGEM_NAO_AUTENTICADO);
    }

    req.sessao = sessao;
    req.usuario = usuario;
    next();
}

/**
 * Para rotas do tipo /:id — só deixa o próprio usuário mexer na própria conta.
 * Use depois de `exigirAutenticacao`.
 */
export function exigirProprioUsuario(req, _res, next) {
    if (req.params.id !== req.usuario.id) {
        throw new ErroApi(403, 'Você não tem permissão para acessar esta conta.');
    }
    next();
}
