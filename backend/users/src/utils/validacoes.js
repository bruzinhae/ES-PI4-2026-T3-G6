/**
 * utils/validacoes.js — VALIDAÇÕES E NORMALIZAÇÕES COMPARTILHADAS.
 *
 * Funções pequenas usadas em mais de um lugar (model e service). Ficam juntas aqui para que
 * a regra seja a mesma em todo o projeto — ex.: se o tamanho mínimo da senha mudar, muda
 * só neste arquivo.
 */

import { ErroApi } from './ErroApi.js';

// Tamanho mínimo da senha. Deve bater com o aviso "Mínimo 8 caracteres" da tela de cadastro.
export const SENHA_TAMANHO_MINIMO = 8;

/**
 * Deixa o e-mail num formato padrão para comparação: sem espaços nas pontas e minúsculo.
 * Assim "Ana@Gmail.com " e "ana@gmail.com" são reconhecidos como o MESMO e-mail, e não dá
 * para criar duas contas só mudando maiúsculas.
 * O `?? ''` evita erro se o e-mail vier undefined/null.
 */
export function normalizarEmail(email) {
    return String(email ?? '').trim().toLowerCase();
}

/**
 * Confere se o texto tem o formato básico de um e-mail: algo@algo.algo, sem espaços.
 * É uma checagem simples de propósito — a única forma de ter certeza de que o e-mail
 * existe é enviando uma mensagem de verificação (por isso existe `emailVerificado`).
 */
export function emailValido(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email ?? '').trim());
}

/**
 * Garante que a senha é um texto com o tamanho mínimo; se não for, lança ErroApi 400.
 * A senha é validada aqui (e não no schema) porque o banco NUNCA recebe a senha em si,
 * só o hash dela — então o schema não tem como validar o tamanho original.
 *
 * @param {string} rotulo Início da mensagem de erro; permite reaproveitar a função para
 *                        outros campos (ex.: 'A nova senha').
 */
export function validarSenha(senha, rotulo = 'A senha') {
    if (typeof senha !== 'string' || senha.length < SENHA_TAMANHO_MINIMO) {
        throw new ErroApi(400, `${rotulo} deve ter ao menos ${SENHA_TAMANHO_MINIMO} caracteres.`);
    }
}

/**
 * Mantém apenas as chaves permitidas que vieram no corpo da requisição.
 *
 * Proteção importante: sem isso, um cliente poderia mandar campos que não deveria controlar,
 * como `{ "emailVerificado": true }` ou `{ "hashSenha": "..." }`, e eles iriam direto para o
 * banco. Com esta "lista branca", tudo que não estiver em `permitidos` é descartado.
 *
 * Ex.: selecionarCampos({ nome: 'Ana', admin: true }, ['nome']) → { nome: 'Ana' }
 */
export function selecionarCampos(dados, permitidos) {
    return Object.fromEntries(
        Object.entries(dados ?? {}).filter(([chave]) => permitidos.includes(chave))
    );
}
