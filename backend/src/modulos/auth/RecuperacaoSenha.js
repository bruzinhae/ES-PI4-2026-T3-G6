/**
 * auth/RecuperacaoSenha.js — SCHEMA da coleção "tokens_recuperacao_senha".
 *
 * Cada documento é um link de "esqueci minha senha": vale por 30 minutos e só pode ser usado
 * uma vez (`usadoEm` preenchido = já usado). Segue o dicionário de dados, e, como nas
 * sessões, o `_id` é o HASH SHA-256 do token (ver utils/token.js); o token em texto só
 * existe no link enviado ao usuário.
 *
 * O índice TTL apaga o documento 7 dias depois de `expiraEm`: tempo de sobra para consulta,
 * sem a coleção crescer para sempre.
 */

import mongoose from 'mongoose';

// Quanto tempo o link vale depois de pedido: 30 minutos.
export const DURACAO_RECUPERACAO_MS = 30 * 60 * 1000;

const SETE_DIAS_EM_SEGUNDOS = 7 * 24 * 60 * 60;

const recuperacaoSenhaSchema = new mongoose.Schema(
    {
        _id: {
            type: String, // hash do token (hex)
        },
        usuarioId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usuario',
            required: true,
            index: true,
        },
        criadoEm: {
            type: Date,
            default: Date.now,
        },
        expiraEm: {
            type: Date,
            required: true,
            index: { expires: SETE_DIAS_EM_SEGUNDOS },
        },
        usadoEm: {
            type: Date,
            default: null,
        },
    },
    {
        collection: 'tokens_recuperacao_senha',
        versionKey: false,
    }
);

export const RecuperacaoSenha = mongoose.model('RecuperacaoSenha', recuperacaoSenhaSchema);
