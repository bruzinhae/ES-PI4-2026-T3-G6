import mongoose from 'mongoose';

// Read-only model for the disciplines collection described in the project data dictionary.
// strict:false lets this lightweight model coexist with the complete document shape.
const disciplinaSchema = new mongoose.Schema({
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
    nome: { type: String, required: true },
    situacao: { type: String, default: 'ativa' },
}, { collection: 'disciplinas', strict: false, versionKey: false });

export const Disciplina = mongoose.model('Disciplina', disciplinaSchema);
