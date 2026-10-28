/**
 * sessoesEstudo/SessaoEstudo.js — SCHEMA da coleção "sessoes_estudo".
 * Segue Arquivos/Dicionário de dados/sessoes_estudo.json.
 */

import mongoose from 'mongoose';

export const ORIGENS_SESSAO = ['ia', 'manual'];
export const SITUACOES_SESSAO = ['agendada', 'concluida', 'nao_realizada', 'cancelada'];
export const TIPOS_FOCO = ['teorico', 'pratica', 'revisao'];

const sessaoEstudoSchema = new mongoose.Schema(
    {
        usuarioId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usuario',
            required: true,
            index: true,
        },
        tarefaId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tarefa',
            default: null,
        },
        disciplinaId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Disciplina',
            default: null,
            index: true,
        },
        conteudoId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },
        planoIaId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PlanoIa',
            default: null,
        },
        titulo: {
            type: String,
            required: [true, 'Informe o título da sessão.'],
            trim: true,
            maxlength: [160, 'O título deve ter no máximo 160 caracteres.'],
        },
        inicio: {
            type: Date,
            required: [true, 'Informe o início da sessão.'],
            index: true,
        },
        fim: {
            type: Date,
            required: [true, 'Informe o fim da sessão.'],
        },
        origem: {
            type: String,
            enum: ORIGENS_SESSAO,
            default: 'manual',
        },
        situacao: {
            type: String,
            enum: SITUACOES_SESSAO,
            default: 'agendada',
            index: true,
        },
        tipoFoco: {
            type: String,
            enum: TIPOS_FOCO,
            default: 'teorico',
        },
        revisaoEspacada: {
            type: Boolean,
            default: false,
        },
        minutosRealizados: {
            type: Number,
            default: null,
            min: 0,
        },
        pomodorosPlanejados: {
            type: Number,
            default: null,
            min: 0,
        },
        pomodorosConcluidos: {
            type: Number,
            default: null,
            min: 0,
        },
    },
    {
        collection: 'sessoes_estudo',
        versionKey: false,
        timestamps: { createdAt: 'criadoEm', updatedAt: 'atualizadoEm' },
        toJSON: {
            transform(_documento, retorno) {
                retorno.id = String(retorno._id);
                delete retorno._id;
                return retorno;
            },
        },
    }
);

sessaoEstudoSchema.index({ usuarioId: 1, inicio: 1 });

export const SessaoEstudo = mongoose.model('SessaoEstudo', sessaoEstudoSchema);
