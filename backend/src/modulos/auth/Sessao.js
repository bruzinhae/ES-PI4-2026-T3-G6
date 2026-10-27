/**
 * auth/Sessao.js — SCHEMA da coleção "sessoes_autenticacao".
 *
 * Uma sessão representa um login ativo: "este usuário entrou e pode usar a API até expiraEm".
 * Segue o dicionário de dados (Arquivos/Dicionário de dados/sessoes_autenticacao.json), com
 * uma diferença: o `_id` é o HASH SHA-256 do token (ver utils/token.js), não o token em texto.
 *
 * O índice TTL em `expiraEm` faz o próprio MongoDB apagar sessões vencidas. Ele roda a cada
 * ~1 minuto, por isso o middleware de autenticação também confere a data.
 */

import mongoose from 'mongoose';

// Quanto tempo uma sessão vale depois do login: 7 dias.
export const DURACAO_SESSAO_MS = 7 * 24 * 60 * 60 * 1000;

const sessaoSchema = new mongoose.Schema(
    {
        _id: {
            type: String, // hash do token (hex), e não um ObjectId
        },
        usuarioId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usuario',
            required: true,
            index: true, // para apagar/listar as sessões de um usuário rapidamente
        },
        criadoEm: {
            type: Date,
            default: Date.now,
        },
        expiraEm: {
            type: Date,
            required: true,
            index: { expires: 0 }, // TTL: apagar o documento quando expiraEm for atingido
        },
    },
    {
        collection: 'sessoes_autenticacao',
        versionKey: false,
    }
);

export const Sessao = mongoose.model('Sessao', sessaoSchema);
