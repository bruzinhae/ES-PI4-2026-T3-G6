/**
 * auth/authService.js — REGRAS DE AUTENTICAÇÃO (login, logout e sessões).
 *
 * Fluxo: o login confere e-mail/senha e cria uma Sessao; devolve o token em texto uma única
 * vez. Nas requisições seguintes, o middleware (middlewares/autenticacao.js) usa
 * `buscarSessaoValida` para descobrir quem está chamando.
 * Não conhece o Express: lança ErroApi, como o usuarioService.
 */

import bcrypt from 'bcryptjs';
import { Usuario } from '../usuarios/Usuario.js';
import { Sessao, DURACAO_SESSAO_MS } from './Sessao.js';
import { ErroApi } from '../../utils/ErroApi.js';
import { gerarToken, hashDoToken } from '../../utils/token.js';
import { normalizarEmail } from '../../utils/validacoes.js';

const MENSAGEM_LOGIN_INVALIDO = 'E-mail ou senha incorretos.';

// Hash de uma senha qualquer. Quando o e-mail não existe, comparamos contra ele só para
// gastar o mesmo tempo de um login real; senão o tempo de resposta revelaria se o e-mail
// tem conta.
const HASH_FALSO = bcrypt.hashSync('senha-que-nunca-sera-usada', 10);

/**
 * Cria uma sessão para o usuário e devolve o token (texto) e a data de expiração.
 * O token só existe aqui; no banco fica apenas o hash dele.
 */
export async function criarSessao(usuarioId) {
    const token = gerarToken();
    const expiraEm = new Date(Date.now() + DURACAO_SESSAO_MS);
    await Sessao.create({ _id: hashDoToken(token), usuarioId, expiraEm });
    return { token, expiraEm };
}

/**
 * LOGIN — confere e-mail e senha e abre uma sessão.
 * E-mail sem conta, conta só do Google (sem hashSenha) e senha errada respondem o MESMO
 * 401, para não revelar quais e-mails estão cadastrados.
 */
export async function entrar({ email, senha } = {}) {
    const usuario = typeof email === 'string'
        ? await Usuario.findOne({ emailNormalizado: normalizarEmail(email) })
        : null;

    const senhaConfere = typeof senha === 'string'
        && await bcrypt.compare(senha, usuario?.hashSenha || HASH_FALSO)
        && Boolean(usuario?.hashSenha);

    if (!senhaConfere) {
        throw new ErroApi(401, MENSAGEM_LOGIN_INVALIDO);
    }

    const { token, expiraEm } = await criarSessao(usuario._id);
    return { usuario, token, expiraEm };
}

/**
 * Procura a sessão a partir do token recebido. Devolve null se o token não existe ou já
 * venceu (nesse caso a sessão vencida é apagada).
 */
export async function buscarSessaoValida(token) {
    const sessao = await Sessao.findById(hashDoToken(token));

    if (!sessao) {
        return null;
    }
    if (sessao.expiraEm <= new Date()) {
        await sessao.deleteOne();
        return null;
    }
    return sessao;
}

// LOGOUT — apaga uma sessão (pelo id dela, que é o hash do token).
export async function encerrarSessao(sessaoId) {
    await Sessao.deleteOne({ _id: sessaoId });
}

/**
 * Apaga todas as sessões de um usuário. `manterSessaoId` preserva uma delas: usado quando
 * a senha muda (encerra os outros dispositivos, mas não derruba quem acabou de trocar).
 */
export async function encerrarSessoesDoUsuario(usuarioId, manterSessaoId = null) {
    await Sessao.deleteMany({
        usuarioId,
        ...(manterSessaoId && { _id: { $ne: manterSessaoId } }),
    });
}
