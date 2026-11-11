import mongoose from 'mongoose';
import { ErroApi } from '../../utils/ErroApi.js';
import { Tarefa, CATEGORIAS_TAREFA, TIPOS_TAREFA } from './Tarefa.js';

const CAMPOS = ['titulo', 'categoria', 'tipo', 'etiqueta', 'prazo', 'minutosEstimados', 'prioridade', 'local', 'observacoes'];

function idValido(id) {
    if (!mongoose.isValidObjectId(id)) throw new ErroApi(400, 'ID de tarefa inválido.');
}

function validar(dados, parcial = false) {
    if (!dados || typeof dados !== 'object' || Array.isArray(dados)) throw new ErroApi(400, 'Envie os dados da tarefa em formato JSON.');
    const desconhecido = Object.keys(dados).find(campo => !CAMPOS.includes(campo));
    if (desconhecido) throw new ErroApi(400, `Campo não permitido: ${desconhecido}.`);
    const payload = Object.fromEntries(Object.entries(dados).map(([campo, valor]) => [campo, valor === '' ? null : valor]));
    if (!parcial && (!payload.titulo || typeof payload.titulo !== 'string' || payload.titulo.trim().length < 2)) throw new ErroApi(400, 'O título deve ter ao menos 2 caracteres.');
    if (payload.titulo !== undefined) {
        if (typeof payload.titulo !== 'string' || payload.titulo.trim().length < 2 || payload.titulo.trim().length > 80) throw new ErroApi(400, 'O título deve ter entre 2 e 80 caracteres.');
        payload.titulo = payload.titulo.trim();
    }
    if (payload.categoria !== undefined && !CATEGORIAS_TAREFA.includes(payload.categoria)) throw new ErroApi(400, 'Categoria de tarefa inválida.');
    if (payload.tipo !== undefined && !TIPOS_TAREFA.includes(payload.tipo)) throw new ErroApi(400, 'Tipo de tarefa inválido.');
    for (const campo of ['etiqueta', 'local', 'observacoes']) {
        if (payload[campo] !== undefined && payload[campo] !== null) {
            if (typeof payload[campo] !== 'string') throw new ErroApi(400, `O campo "${campo}" deve ser texto.`);
            payload[campo] = payload[campo].trim();
        }
    }
    if (payload.prazo !== undefined) {
        if (payload.prazo === null) payload.prazo = null;
        else {
            const data = new Date(payload.prazo);
            if (Number.isNaN(data.getTime())) throw new ErroApi(400, 'Informe um prazo válido.');
            payload.prazo = data;
        }
    }
    if (payload.minutosEstimados !== undefined && payload.minutosEstimados !== null) {
        payload.minutosEstimados = Number(payload.minutosEstimados);
        if (!Number.isInteger(payload.minutosEstimados) || payload.minutosEstimados < 15 || payload.minutosEstimados > 240) throw new ErroApi(400, 'A duração deve ser um número inteiro entre 15 e 240 minutos.');
    }
    if (payload.prioridade !== undefined) {
        payload.prioridade = Number(payload.prioridade);
        if (!Number.isInteger(payload.prioridade) || payload.prioridade < 1 || payload.prioridade > 10) throw new ErroApi(400, 'A prioridade deve ser um número inteiro entre 1 e 10.');
    }
    return payload;
}

export function listar(usuarioId) {
    return Tarefa.find({ usuarioId, situacao: { $ne: 'concluida' } }).sort({ prazo: 1, criadoEm: -1 });
}

export async function criar(usuarioId, dados) {
    const payload = validar(dados);
    const tarefa = new Tarefa({ ...payload, usuarioId, categoria: payload.categoria || 'estudos', tipo: payload.tipo || 'outro', situacao: 'pendente' });
    await tarefa.save();
    return tarefa;
}

export async function atualizar(usuarioId, id, dados) {
    idValido(id);
    const payload = validar(dados, true);
    if (!Object.keys(payload).length) throw new ErroApi(400, 'Informe ao menos um campo para atualizar.');
    const tarefa = await Tarefa.findOneAndUpdate({ _id: id, usuarioId }, { $set: payload }, { new: true, runValidators: true });
    if (!tarefa) throw new ErroApi(404, 'Tarefa não encontrada.');
    return tarefa;
}

export async function excluir(usuarioId, id) {
    idValido(id);
    const tarefa = await Tarefa.findOneAndDelete({ _id: id, usuarioId });
    if (!tarefa) throw new ErroApi(404, 'Tarefa não encontrada.');
}
