/**
 * tarefas/Tarefa.js — SCHEMA da coleção "tarefas".
 * Segue Arquivos/Dicionário de dados/tarefas.json.
 */

import mongoose from 'mongoose';

export const CATEGORIAS_TAREFA = ['estudos', 'pessoal'];
export const TIPOS_TAREFA = ['prova', 'exercicio', 'trabalho', 'leitura', 'outro'];
export const SITUACOES_TAREFA = ['pendente', 'em_andamento', 'concluida'];

const tarefaSchema = new mongoose.Schema(
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
            index: true,
        },
        conteudoId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },
        titulo: {
            type: String,
            required: [true, 'Informe o título da tarefa.'],
            trim: true,
            minlength: [2, 'O título deve ter ao menos 2 caracteres.'],
            maxlength: [160, 'O título deve ter no máximo 160 caracteres.'],
        },
        categoria: {
            type: String,
            enum: CATEGORIAS_TAREFA,
            default: 'estudos',
        },
        tipo: {
            type: String,
            enum: TIPOS_TAREFA,
            default: 'outro',
        },
        etiqueta: {
            type: String,
            trim: true,
            maxlength: [40, 'A etiqueta deve ter no máximo 40 caracteres.'],
            default: null,
        },
        prazo: {
            type: Date,
            default: null,
        },
        minutosEstimados: {
            type: Number,
            default: null,
            min: [15, 'O tempo estimado mínimo é 15 minutos.'],
            max: [1440, 'O tempo estimado máximo é 1440 minutos.'],
            validate: {
                validator: (valor) => valor === null || Number.isInteger(valor),
                message: 'Os minutos estimados devem ser um número inteiro.',
            },
        },
        prioridade: {
            type: Number,
            default: 5,
            min: 1,
            max: 10,
            validate: {
                validator: Number.isInteger,
                message: 'A prioridade deve ser um número inteiro.',
            },
        },
        local: {
            type: String,
            trim: true,
            maxlength: [120, 'O local deve ter no máximo 120 caracteres.'],
            default: null,
        },
        observacoes: {
            type: String,
            trim: true,
            maxlength: [1000, 'As observações devem ter no máximo 1000 caracteres.'],
            default: null,
        },
        situacao: {
            type: String,
            enum: SITUACOES_TAREFA,
            default: 'pendente',
            index: true,
        },
        concluidoEm: {
            type: Date,
            default: null,
        },
        origem: {
            type: String,
            enum: ['manual', 'canvas'],
            default: 'manual',
        },
        idExterno: {
            type: String,
            default: null,
            maxlength: 80,
        },
    },
    {
        collection: 'tarefas',
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

tarefaSchema.index({ usuarioId: 1, prazo: 1 });
tarefaSchema.index(
    { usuarioId: 1, idExterno: 1 },
    { unique: true, partialFilterExpression: { idExterno: { $type: 'string' } } },
);

export const Tarefa = mongoose.model('Tarefa', tarefaSchema);
