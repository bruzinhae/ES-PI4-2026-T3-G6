/**
 * utils/token.js — TOKENS DE SESSÃO.
 *
 * O token é o "crachá" que o frontend recebe no login e manda em toda requisição
 * (cabeçalho `Authorization: Bearer <token>`). É uma sequência aleatória sem significado
 * próprio: quem vale é a sessão guardada no banco.
 *
 * O banco guarda só o HASH (SHA-256) do token, nunca o token em si. Assim, mesmo que alguém
 * leia a coleção de sessões, não consegue usar os valores de lá para entrar na conta.
 * SHA-256 simples basta (diferente de senha) porque o token já é aleatório e longo:
 * não dá para "adivinhar" por força bruta.
 */

import { createHash, randomBytes } from 'node:crypto';

// Gera um token novo: 32 bytes aleatórios em base64url (43 caracteres, seguros para URL/cabeçalho).
export function gerarToken() {
    return randomBytes(32).toString('base64url');
}

// Hash do token; é o que fica salvo como `_id` da sessão e usado para procurá-la.
export function hashDoToken(token) {
    return createHash('sha256').update(token).digest('hex');
}
