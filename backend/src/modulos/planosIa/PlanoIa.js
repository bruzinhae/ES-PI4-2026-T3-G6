/**
 * planosIa/PlanoIa.js — SCHEMA da coleção "planos_ia".
 * Segue Arquivos/Dicionário de dados/planos_ia.json.
 */

import mongoose from 'mongoose';

export const TIPOS_PLANO_IA = ['plano_semanal', 'ajuste_atraso'];
export const SITUACOES_PLANO_IA = ['pendente', 'aprovada', 'recusada'];

const sessaoPropostaSchema = new mongoose.Schema(
    {
        tarefaId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tarefa',
            default: null,
        },
        disciplinaId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Disciplina',
            default: null,
        },
        titulo: {
            type: String,
            required: true,
            trim: true,
            maxlength: 160,
        },
        inicio: {
            type: Date,
            required: true,
        },
        fim: {
            type: Date,
            required: true,
        },
    },
    { _id: false, versionKey: false }
);

const planoIaSchema = new mongoose.Schema(
    {
        usuarioId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usuario',
            required: true,
            index: true,
        },
        tipo: {
            type: String,
            enum: TIPOS_PLANO_IA,
            required: true,
        },
        inicioSemana: {
            type: Date,
            required: true,
            index: true,
        },
        situacao: {
            type: String,
            enum: SITUACOES_PLANO_IA,
            default: 'pendente',
            index: true,
        },
        mensagem: {
            type: String,
            trim: true,
            maxlength: [2000, 'A mensagem deve ter no máximo 2000 caracteres.'],
            default: '',
        },
        sessoesPropostas: {
            type: [sessaoPropostaSchema],
            default: [],
        },
        avisos: {
            type: [String],
            default: [],
        },
        modelo: {
            type: String,
            trim: true,
            default: null,
        },
        versaoPrompt: {
            type: String,
            trim: true,
            default: null,
        },
        tokensEntrada: {
            type: Number,
            default: null,
            min: 0,
        },
        tokensSaida: {
            type: Number,
            default: null,
            min: 0,
        },
        criadoEm: {
            type: Date,
            default: Date.now,
        },
        decididoEm: {
            type: Date,
            default: null,
        },
    },
    {
        collection: 'planos_ia',
        versionKey: false,
        timestamps: false,
        toJSON: {
            transform(_documento, retorno) {
                retorno.id = String(retorno._id);
                delete retorno._id;
                return retorno;
            },
        },
    }
);

export const PlanoIa = mongoose.model('PlanoIa', planoIaSchema);
