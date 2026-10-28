/**
 * metas/Meta.js — SCHEMA da coleção "metas".
 * Segue Arquivos/Dicionário de dados/metas.json.
 */

import mongoose from 'mongoose';

export const TIPOS_META = ['geral', 'disciplina', 'habito', 'projeto'];
export const PRIORIDADES_META = ['baixa', 'media', 'alta'];
export const SITUACOES_META = ['ativa', 'concluida', 'cancelada'];

const marcoSchema = new mongoose.Schema(
    {
        titulo: {
            type: String,
            required: [true, 'Informe o título do marco.'],
            trim: true,
            maxlength: [160, 'O título deve ter no máximo 160 caracteres.'],
        },
        atingido: {
            type: Boolean,
            default: false,
        },
        atingidoEm: {
            type: Date,
            default: null,
        },
        nota: {
            type: Number,
            default: null,
            min: [0, 'A nota mínima é 0.'],
            max: [10, 'A nota máxima é 10.'],
        },
    },
    { _id: true, versionKey: false }
);

const metaSchema = new mongoose.Schema(
    {
        usuarioId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usuario',
            required: true,
            index: true,
        },
        disciplinaId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Disciplina',
            default: null,
        },
        titulo: {
            type: String,
            required: [true, 'Informe o título da meta.'],
            trim: true,
            minlength: [2, 'O título deve ter ao menos 2 caracteres.'],
            maxlength: [200, 'O título deve ter no máximo 200 caracteres.'],
        },
        tipo: {
            type: String,
            enum: TIPOS_META,
            default: 'geral',
        },
        prioridade: {
            type: String,
            enum: PRIORIDADES_META,
            default: 'media',
        },
        prazo: {
            type: Date,
            default: null,
        },
        situacao: {
            type: String,
            enum: SITUACOES_META,
            default: 'ativa',
            index: true,
        },
        metaSemanalHoras: {
            type: Number,
            default: null,
            min: [1, 'A meta semanal mínima é 1 hora.'],
            max: [168, 'A meta semanal máxima é 168 horas.'],
        },
        marcos: {
            type: [marcoSchema],
            default: [],
        },
    },
    {
        collection: 'metas',
        versionKey: false,
        timestamps: { createdAt: 'criadoEm', updatedAt: 'atualizadoEm' },
        toJSON: {
            transform(_documento, retorno) {
                retorno.id = String(retorno._id);
                delete retorno._id;
                if (Array.isArray(retorno.marcos)) {
                    retorno.marcos = retorno.marcos.map((marco) => {
                        const item = { ...marco };
                        if (item._id) {
                            item.id = String(item._id);
                            delete item._id;
                        }
                        return item;
                    });
                }
                return retorno;
            },
        },
    }
);

export const Meta = mongoose.model('Meta', metaSchema);
