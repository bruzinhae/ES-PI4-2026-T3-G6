/**
 * auth/ConfirmacaoEmail.js — SCHEMA da coleção "tokens_confirmacao_email".
 *
 * Cada documento é o link de "confirme sua conta": vale por 24 horas e só pode ser usado
 * uma vez (`usadoEm` preenchido = já usado). O `_id` é o HASH SHA-256 do token; o token
 * em texto só existe no e-mail. `emailNormalizado` trava o link no endereço da época:
 * se a pessoa trocar o e-mail, o link antigo não confirma o endereço novo.
 *
 * O índice TTL apaga o documento 7 dias depois de `expiraEm`.
 */

import mongoose from 'mongoose';

export const DURACAO_CONFIRMACAO_MS = 24 * 60 * 60 * 1000;

const SETE_DIAS_EM_SEGUNDOS = 7 * 24 * 60 * 60;

const confirmacaoEmailSchema = new mongoose.Schema(
    {
        _id: {
            type: String,
        },
        usuarioId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usuario',
            required: true,
            index: true,
        },
        emailNormalizado: {
            type: String,
            required: true,
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
        collection: 'tokens_confirmacao_email',
        versionKey: false,
    }
);

export const ConfirmacaoEmail = mongoose.model('ConfirmacaoEmail', confirmacaoEmailSchema);
