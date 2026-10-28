/**
 * disciplinas/Disciplina.js — SCHEMA da coleção "disciplinas".
 * Segue Arquivos/Dicionário de dados/disciplinas.json.
 * Conteúdos ficam embutidos no documento da disciplina.
 */

import mongoose from 'mongoose';

export const CORES_DISCIPLINA = ['roxo', 'azul', 'verde', 'ambar'];
export const SITUACOES_DISCIPLINA = ['ativa', 'concluida', 'trancada'];
export const SITUACOES_CONTEUDO = ['pendente', 'em_andamento', 'concluido'];

const conteudoSchema = new mongoose.Schema(
    {
        titulo: {
            type: String,
            required: [true, 'Informe o título do conteúdo.'],
            trim: true,
            minlength: [2, 'O título deve ter ao menos 2 caracteres.'],
            maxlength: [160, 'O título deve ter no máximo 160 caracteres.'],
        },
        dificuldade: {
            type: Number,
            default: null,
            min: [1, 'A dificuldade mínima é 1.'],
            max: [5, 'A dificuldade máxima é 5.'],
            validate: {
                validator: (valor) => valor === null || Number.isInteger(valor),
                message: 'A dificuldade deve ser um número inteiro.',
            },
        },
        situacao: {
            type: String,
            enum: SITUACOES_CONTEUDO,
            default: 'pendente',
        },
        ordem: {
            type: Number,
            required: true,
            min: [1, 'A ordem começa em 1.'],
            validate: {
                validator: Number.isInteger,
                message: 'A ordem deve ser um número inteiro.',
            },
        },
        minutosEstimados: {
            type: Number,
            default: null,
            min: [15, 'O tempo estimado mínimo é 15 minutos.'],
            max: [6000, 'O tempo estimado máximo é 6000 minutos.'],
            validate: {
                validator: (valor) => valor === null || Number.isInteger(valor),
                message: 'Os minutos estimados devem ser um número inteiro.',
            },
        },
        concluidoEm: {
            type: Date,
            default: null,
        },
    },
    { _id: true, versionKey: false }
);

const disciplinaSchema = new mongoose.Schema(
    {
        usuarioId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usuario',
            required: true,
            index: true,
        },
        nome: {
            type: String,
            required: [true, 'Informe o nome da disciplina.'],
            trim: true,
            minlength: [2, 'O nome deve ter ao menos 2 caracteres.'],
            maxlength: [120, 'O nome deve ter no máximo 120 caracteres.'],
        },
        area: {
            type: String,
            required: [true, 'Informe a área da disciplina.'],
            trim: true,
            minlength: [2, 'A área deve ter ao menos 2 caracteres.'],
            maxlength: [80, 'A área deve ter no máximo 80 caracteres.'],
        },
        professor: {
            type: String,
            trim: true,
            maxlength: [120, 'O nome do professor deve ter no máximo 120 caracteres.'],
            default: null,
        },
        local: {
            type: String,
            trim: true,
            maxlength: [120, 'O local deve ter no máximo 120 caracteres.'],
            default: null,
        },
        creditos: {
            type: Number,
            default: null,
            min: [1, 'Os créditos mínimos são 1.'],
            max: [20, 'Os créditos máximos são 20.'],
            validate: {
                validator: (valor) => valor === null || Number.isInteger(valor),
                message: 'Os créditos devem ser um número inteiro.',
            },
        },
        peso: {
            type: Number,
            default: 3,
            min: [1, 'O peso mínimo é 1.'],
            max: [5, 'O peso máximo é 5.'],
            validate: {
                validator: Number.isInteger,
                message: 'O peso deve ser um número inteiro.',
            },
        },
        media: {
            type: Number,
            default: null,
            min: [0, 'A média mínima é 0.'],
            max: [10, 'A média máxima é 10.'],
        },
        dificuldade: {
            type: Number,
            default: 3,
            min: [1, 'A dificuldade mínima é 1.'],
            max: [5, 'A dificuldade máxima é 5.'],
            validate: {
                validator: Number.isInteger,
                message: 'A dificuldade deve ser um número inteiro.',
            },
        },
        cor: {
            type: String,
            enum: {
                values: CORES_DISCIPLINA,
                message: 'Cor de disciplina inválida.',
            },
            default: 'roxo',
        },
        periodoLetivo: {
            type: String,
            trim: true,
            maxlength: [20, 'O período letivo deve ter no máximo 20 caracteres.'],
            default: null,
        },
        situacao: {
            type: String,
            enum: {
                values: SITUACOES_DISCIPLINA,
                message: 'Situação de disciplina inválida.',
            },
            default: 'ativa',
            index: true,
        },
        conteudos: {
            type: [conteudoSchema],
            default: [],
        },
    },
    {
        collection: 'disciplinas',
        versionKey: false,
        timestamps: { createdAt: 'criadoEm', updatedAt: 'atualizadoEm' },
        toJSON: {
            transform(_documento, retorno) {
                retorno.id = String(retorno._id);
                delete retorno._id;
                if (Array.isArray(retorno.conteudos)) {
                    retorno.conteudos = retorno.conteudos.map((conteudo) => {
                        const item = { ...conteudo };
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

disciplinaSchema.index({ usuarioId: 1, situacao: 1 });
disciplinaSchema.index({ usuarioId: 1, nome: 1 });

export const Disciplina = mongoose.model('Disciplina', disciplinaSchema);
