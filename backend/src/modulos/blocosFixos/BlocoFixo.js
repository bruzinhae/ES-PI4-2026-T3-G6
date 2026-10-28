import mongoose from 'mongoose';

export const CATEGORIAS_BLOCO = ['aulas', 'trabalho', 'sono', 'saude', 'pausa', 'translado', 'outro'];
const blocoFixoSchema = new mongoose.Schema({
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
    disciplinaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Disciplina', default: null },
    nome: { type: String, required: [true, 'Informe o nome do compromisso.'], trim: true, minlength: [2, 'O nome deve ter ao menos 2 caracteres.'], maxlength: [80, 'O nome deve ter no m\u00e1ximo 80 caracteres.'] },
    categoria: { type: String, enum: { values: CATEGORIAS_BLOCO, message: 'Categoria de bloco inv\u00e1lida.' }, required: true },
    recorrencia: { type: String, enum: ['semanal', 'unico'], required: true },
    diasSemana: { type: [Number], default: [] },
    data: { type: Date, default: null },
    horaInicio: { type: String, required: true, match: [/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'Informe um hor\u00e1rio v\u00e1lido.'] },
    duracaoMinutos: { type: Number, required: true, min: [15, 'A dura\u00e7\u00e3o m\u00ednima \u00e9 15 minutos.'], max: [1440, 'A dura\u00e7\u00e3o m\u00e1xima \u00e9 24 horas.'], validate: { validator: Number.isInteger, message: 'A dura\u00e7\u00e3o deve ser um n\u00famero inteiro de minutos.' } },
    prioridade: { type: Number, required: true, min: 1, max: 10, validate: { validator: Number.isInteger, message: 'A prioridade deve ser um n\u00famero inteiro.' } },
    fixo: { type: Boolean, default: true },
    local: { type: String, trim: true, maxlength: [120, 'O local deve ter no m\u00e1ximo 120 caracteres.'], default: null },
}, { timestamps: { createdAt: 'criadoEm', updatedAt: 'atualizadoEm' }, versionKey: false });

blocoFixoSchema.pre('validate', function () {
    if (this.recorrencia === 'semanal') {
        if (!this.diasSemana?.length) this.invalidate('diasSemana', 'Selecione ao menos um dia da semana.');
        if (this.data) this.invalidate('data', 'Blocos semanais n\u00e3o devem ter uma data \u00fanica.');
    } else if (this.recorrencia === 'unico') {
        if (!this.data) this.invalidate('data', 'Informe a data do compromisso.');
        if (this.diasSemana?.length) this.invalidate('diasSemana', 'Blocos de data \u00fanica n\u00e3o devem ter dias da semana.');
    }
    if (this.diasSemana?.some(dia => !Number.isInteger(dia) || dia < 0 || dia > 6)) this.invalidate('diasSemana', 'Os dias devem ser n\u00fameros entre 0 (segunda) e 6 (domingo).');
    if (this.horaInicio && Number.isInteger(this.duracaoMinutos)) {
        const [h, m] = this.horaInicio.split(':').map(Number);
        if (h * 60 + m + this.duracaoMinutos > 1440) this.invalidate('duracaoMinutos', 'O hor\u00e1rio e a dura\u00e7\u00e3o ultrapassam o fim do dia.');
    }
});
blocoFixoSchema.index({ usuarioId: 1, recorrencia: 1, diasSemana: 1 });
export const BlocoFixo = mongoose.model('BlocoFixo', blocoFixoSchema, 'blocos_rotina');
