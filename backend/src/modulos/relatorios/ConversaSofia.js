/**
 * relatorios/ConversaSofia.js — conversa da Sofia no relatório, uma por usuário e semana.
 */

import mongoose from 'mongoose';

const mensagemSchema = new mongoose.Schema(
    {
        papel: {
            type: String,
            enum: ['usuario', 'sofia'],
            required: true,
        },
        texto: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1200,
        },
        criadoEm: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: false, versionKey: false }
);

const conversaSofiaSchema = new mongoose.Schema(
    {
        usuarioId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usuario',
            required: true,
        },
        inicioSemana: {
            type: String,
            required: true,
            match: /^\d{4}-\d{2}-\d{2}$/,
        },
        mensagens: {
            type: [mensagemSchema],
            default: [],
        },
    },
    {
        collection: 'conversas_sofia',
        timestamps: true,
        versionKey: false,
    }
);

conversaSofiaSchema.index({ usuarioId: 1, inicioSemana: 1 }, { unique: true });

export const ConversaSofia = mongoose.model('ConversaSofia', conversaSofiaSchema);
