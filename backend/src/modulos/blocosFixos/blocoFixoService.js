import mongoose from 'mongoose';
import { ErroApi } from '../../utils/ErroApi.js';
import { BlocoFixo, CATEGORIAS_BLOCO } from './BlocoFixo.js';
import { Disciplina } from '../disciplinas/Disciplina.js';

const CAMPOS = ['disciplinaId', 'nome', 'categoria', 'recorrencia', 'diasSemana', 'data', 'inicioRecorrencia', 'horaInicio', 'duracaoMinutos', 'prioridade', 'fixo', 'local'];
const CAMPOS_OBRIGATORIOS = ['nome', 'categoria', 'recorrencia', 'horaInicio', 'duracaoMinutos', 'prioridade'];
const LIMPAR = valor => valor === '' ? null : valor;
function validarPayload(dados, parcial = false) {
    if (!dados || typeof dados !== 'object' || Array.isArray(dados)) throw new ErroApi(400, 'Envie os dados do bloco em formato JSON.');
    const desconhecidos = Object.keys(dados).filter(campo => !CAMPOS.includes(campo));
    if (desconhecidos.length) throw new ErroApi(400, `Campo n\u00e3o permitido: ${desconhecidos[0]}.`);
    const payload = Object.fromEntries(Object.entries(dados).filter(([campo]) => CAMPOS.includes(campo)).map(([campo, valor]) => [campo, LIMPAR(valor)]));
    if (!parcial) {
        const ausente = CAMPOS_OBRIGATORIOS.find(campo => payload[campo] === undefined || payload[campo] === null);
        if (ausente) throw new ErroApi(400, `O campo "${ausente}" e obrigatorio.`);
    }
    if (payload.nome !== undefined && (typeof payload.nome !== 'string' || payload.nome.trim().length < 2 || payload.nome.trim().length > 200)) throw new ErroApi(400, 'O nome deve ter entre 2 e 200 caracteres.');
    if (payload.categoria !== undefined && !CATEGORIAS_BLOCO.includes(payload.categoria)) throw new ErroApi(400, 'Categoria de bloco inv\u00e1lida.');
    if (payload.recorrencia !== undefined && !['semanal', 'quinzenal', 'a_cada_3_semanas', 'unico'].includes(payload.recorrencia)) throw new ErroApi(400, 'A recorr\u00eancia deve ser semanal, quinzenal, a cada 3 semanas ou \u00fanica.');
    if (payload.horaInicio !== undefined && (typeof payload.horaInicio !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(payload.horaInicio))) throw new ErroApi(400, 'Informe um hor\u00e1rio v\u00e1lido no formato HH:MM.');
    if (payload.duracaoMinutos !== undefined && (!Number.isInteger(payload.duracaoMinutos) || payload.duracaoMinutos < 15 || payload.duracaoMinutos > 1440)) throw new ErroApi(400, 'A dura\u00e7\u00e3o deve ser um n\u00famero inteiro entre 15 e 1440 minutos.');
    if (payload.prioridade !== undefined && (!Number.isInteger(payload.prioridade) || payload.prioridade < 1 || payload.prioridade > 10)) throw new ErroApi(400, 'A prioridade deve ser um n\u00famero inteiro entre 1 e 10.');
    if (payload.fixo !== undefined && typeof payload.fixo !== 'boolean') throw new ErroApi(400, 'O campo fixo deve ser verdadeiro ou falso.');
    if (payload.diasSemana !== undefined && (!Array.isArray(payload.diasSemana) || payload.diasSemana.some(dia => !Number.isInteger(dia) || dia < 0 || dia > 6) || new Set(payload.diasSemana).size !== payload.diasSemana.length)) throw new ErroApi(400, 'Os dias da semana devem ser \u00fanicos e estar entre 0 (segunda) e 6 (domingo).');
    if (payload.data !== undefined && payload.data !== null) {
        if (typeof payload.data !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(payload.data)) throw new ErroApi(400, 'Informe uma data v\u00e1lida no formato AAAA-MM-DD.');
        const data = new Date(`${payload.data}T00:00:00Z`);
        if (Number.isNaN(data.getTime()) || data.toISOString().slice(0, 10) !== payload.data) throw new ErroApi(400, 'Informe uma data v\u00e1lida no formato AAAA-MM-DD.');
        payload.data = data;
    }
    if (payload.inicioRecorrencia !== undefined && payload.inicioRecorrencia !== null) {
        if (typeof payload.inicioRecorrencia !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(payload.inicioRecorrencia)) throw new ErroApi(400, 'Informe uma semana inicial válida.');
        const inicioRecorrencia = new Date(`${payload.inicioRecorrencia}T00:00:00Z`);
        if (Number.isNaN(inicioRecorrencia.getTime()) || inicioRecorrencia.toISOString().slice(0, 10) !== payload.inicioRecorrencia) throw new ErroApi(400, 'Informe uma semana inicial válida.');
        payload.inicioRecorrencia = inicioRecorrencia;
    }
    if (payload.disciplinaId !== undefined && payload.disciplinaId !== null && !mongoose.isValidObjectId(payload.disciplinaId)) throw new ErroApi(400, 'ID de disciplina inv\u00e1lido.');
    if (payload.local !== undefined && payload.local !== null && (typeof payload.local !== 'string' || payload.local.trim().length > 120)) throw new ErroApi(400, 'O local deve ter no m\u00e1ximo 120 caracteres.');
    if (payload.nome) payload.nome = payload.nome.trim();
    if (payload.local) payload.local = payload.local.trim();
    return payload;
}
function validarConsistencia(bloco) {
    if (['semanal', 'quinzenal', 'a_cada_3_semanas'].includes(bloco.recorrencia) && (!bloco.diasSemana?.length || bloco.data)) throw new ErroApi(400, 'Blocos recorrentes precisam de ao menos um dia e n\u00e3o podem ter data \u00fanica.');
    if (['quinzenal', 'a_cada_3_semanas'].includes(bloco.recorrencia) && !bloco.inicioRecorrencia) throw new ErroApi(400, 'Informe a semana inicial da recorrência.');
    if (bloco.recorrencia === 'unico' && (!bloco.data || bloco.diasSemana?.length)) throw new ErroApi(400, 'Blocos de data \u00fanica precisam de uma data e n\u00e3o usam dias da semana.');
    if (bloco.duracaoMinutos > 1440) throw new ErroApi(400, 'A duração máxima é 24 horas.');
}

function minutosHorario(hora) {
    return String(hora).split(':').map(Number).reduce((h, m) => h * 60 + m);
}

function ocorreNoDia(bloco, data) {
    if (bloco.recorrencia === 'unico') {
        return Boolean(bloco.data) && bloco.data.toISOString().slice(0, 10) === data.toISOString().slice(0, 10);
    }
    return recorrenteNaData(bloco, data);
}

function fatiasNoDia(bloco, data) {
    const fatias = [];
    const inicio = minutosHorario(bloco.horaInicio);
    const duracao = Number(bloco.duracaoMinutos) || 0;
    if (ocorreNoDia(bloco, data)) fatias.push([inicio, Math.min(1440, inicio + duracao)]);
    const ontem = new Date(data);
    ontem.setUTCDate(ontem.getUTCDate() - 1);
    if (inicio + duracao > 1440 && ocorreNoDia(bloco, ontem)) fatias.push([0, inicio + duracao - 1440]);
    return fatias;
}

function fatiasConflitam(a, b) {
    return a.some(([a1, a2]) => b.some(([b1, b2]) => a1 < b2 && b1 < a2));
}
async function validarDisciplinaDoUsuario(usuarioId, disciplinaId) {
    if (disciplinaId && !await Disciplina.exists({ _id: disciplinaId, usuarioId })) {
        throw new ErroApi(400, 'A disciplina selecionada n\u00e3o existe ou n\u00e3o pertence a esta conta.');
    }
}
function validarDisciplinaDaCategoria(categoria, disciplinaId) {
    if (categoria === 'aulas' && !disciplinaId) {
        throw new ErroApi(400, 'Escolha a matéria deste horário de aula.');
    }
}
const INTERVALO_SEMANAS = { semanal: 1, quinzenal: 2, a_cada_3_semanas: 3 };
function recorrenteNaData(bloco, data) {
    if (!INTERVALO_SEMANAS[bloco.recorrencia] || !bloco.diasSemana.includes((data.getUTCDay() + 6) % 7)) return false;
    const criado = bloco.inicioRecorrencia || (bloco.criadoEm ? new Date(bloco.criadoEm) : new Date(0));
    const inicio = new Date(Date.UTC(criado.getUTCFullYear(), criado.getUTCMonth(), criado.getUTCDate()));
    inicio.setUTCDate(inicio.getUTCDate() - ((inicio.getUTCDay() + 6) % 7));
    const semana = Math.floor((data.getTime() - inicio.getTime()) / 604800000);
    return semana >= 0 && semana % INTERVALO_SEMANAS[bloco.recorrencia] === 0;
}
async function validarConflito(usuarioId, bloco, ignorarId = null) {
    const consulta = { usuarioId, _id: { $ne: ignorarId || new mongoose.Types.ObjectId() } };
    const existentes = await BlocoFixo.find(consulta).select('recorrencia diasSemana data inicioRecorrencia criadoEm horaInicio duracaoMinutos');
    const inicio = new Date();
    inicio.setUTCHours(0, 0, 0, 0);
    const choque = existentes.some((outro) => {
        const existente = outro.toObject();
        for (let i = 0; i < 42; i += 1) {
            const data = new Date(inicio);
            data.setUTCDate(data.getUTCDate() + i);
            if (fatiasConflitam(fatiasNoDia(bloco, data), fatiasNoDia(existente, data))) return true;
        }
        return false;
    });
    if (choque) throw new ErroApi(409, 'Este hor\u00e1rio se sobrep\u00f5e a outro bloco cadastrado nos mesmos dias.');
}
function idValido(id) { if (!mongoose.isValidObjectId(id)) throw new ErroApi(400, 'ID de bloco inv\u00e1lido.'); }
export function listar(usuarioId) { return BlocoFixo.find({ usuarioId }).sort({ criadoEm: -1 }); }
export async function buscarPorId(usuarioId, id) {
    idValido(id);
    const bloco = await BlocoFixo.findOne({ _id: id, usuarioId });
    if (!bloco) throw new ErroApi(404, 'Bloco fixo n\u00e3o encontrado.');
    return bloco;
}
export async function criar(usuarioId, dados) {
    const payload = validarPayload(dados);
    if (['quinzenal', 'a_cada_3_semanas'].includes(payload.recorrencia) && !payload.inicioRecorrencia) throw new ErroApi(400, 'Informe a semana inicial da recorrência.');
    validarDisciplinaDaCategoria(payload.categoria, payload.disciplinaId);
    await validarDisciplinaDoUsuario(usuarioId, payload.disciplinaId);
    const bloco = new BlocoFixo({ ...payload, usuarioId, criadoEm: new Date(), diasSemana: payload.diasSemana || [], data: payload.data || null });
    validarConsistencia(bloco);
    await validarConflito(usuarioId, bloco.toObject());
    await bloco.save();
    return bloco;
}
export async function atualizar(usuarioId, id, dados) {
    const bloco = await buscarPorId(usuarioId, id);
    const payload = validarPayload(dados, true);
    if (!Object.keys(payload).length) throw new ErroApi(400, 'Informe ao menos um campo para atualizar.');
    if (['quinzenal', 'a_cada_3_semanas'].includes(payload.recorrencia ?? bloco.recorrencia)
        && !payload.inicioRecorrencia && !bloco.inicioRecorrencia) {
        payload.inicioRecorrencia = bloco.criadoEm || new Date();
    }
    const categoria = payload.categoria ?? bloco.categoria;
    if (categoria !== 'aulas') payload.disciplinaId = null;
    const disciplinaId = Object.hasOwn(payload, 'disciplinaId') ? payload.disciplinaId : bloco.disciplinaId;
    validarDisciplinaDaCategoria(categoria, disciplinaId);
    await validarDisciplinaDoUsuario(usuarioId, payload.disciplinaId);
    bloco.set(payload);
    validarConsistencia(bloco);
    await validarConflito(usuarioId, bloco.toObject(), bloco._id);
    await bloco.save();
    return bloco;
}
export async function excluir(usuarioId, id) {
    idValido(id);
    const bloco = await BlocoFixo.findOneAndDelete({ _id: id, usuarioId });
    if (!bloco) throw new ErroApi(404, 'Bloco fixo n\u00e3o encontrado.');
}
