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
import { RecuperacaoSenha, DURACAO_RECUPERACAO_MS } from './RecuperacaoSenha.js';
import { trocarSenha } from '../usuarios/usuarioService.js';
import { env } from '../../config/env.js';
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

/**
 * RECUPERAÇÃO DE SENHA — passo 1: o usuário informou o e-mail na tela "Esqueci minha senha".
 *
 * Se existir uma conta com senha (conta só do Google não tem), gera um link de uso único
 * válido por 30 minutos e invalida os links anteriores. A função NÃO diz se o e-mail existe
 * (a resposta da API é sempre a mesma), para não revelar quais e-mails têm conta.
 *
 * Ainda não há envio de e-mail: o link aparece no console do servidor. Para enviar de
 * verdade, troque só o `console.log` abaixo por uma chamada ao serviço de e-mail.
 */
export async function solicitarRecuperacaoSenha({ email } = {}) {
    if (typeof email !== 'string') {
        return;
    }

    const usuario = await Usuario.findOne({ emailNormalizado: normalizarEmail(email) });

    if (!usuario?.hashSenha) {
        return;
    }

    await RecuperacaoSenha.deleteMany({ usuarioId: usuario._id, usadoEm: null });

    const token = gerarToken();
    await RecuperacaoSenha.create({
        _id: hashDoToken(token),
        usuarioId: usuario._id,
        expiraEm: new Date(Date.now() + DURACAO_RECUPERACAO_MS),
    });

    const link = `${env.frontendUrl}/index_nova_senha.html?token=${token}`;
    console.log(`[recuperação de senha] link para ${usuario.email} (vale 30 min): ${link}`);
}

/**
 * RECUPERAÇÃO DE SENHA — passo 2: o usuário abriu o link e digitou a senha nova.
 *
 * Confere se o token existe, não foi usado e não expirou; troca a senha, marca o token como
 * usado e encerra TODAS as sessões do usuário (quem estava logado com a senha antiga cai).
 * Qualquer problema com o token dá o mesmo 400, sem detalhar o motivo.
 */
export async function redefinirSenha({ token, senha } = {}) {
    const recuperacao = typeof token === 'string'
        ? await RecuperacaoSenha.findById(hashDoToken(token))
        : null;

    if (!recuperacao || recuperacao.usadoEm || recuperacao.expiraEm <= new Date()) {
        throw new ErroApi(400, 'Link inválido ou expirado. Peça um novo link de recuperação.');
    }

    await trocarSenha(recuperacao.usuarioId, senha);

    recuperacao.usadoEm = new Date();
    await recuperacao.save();
    await encerrarSessoesDoUsuario(recuperacao.usuarioId);
}
