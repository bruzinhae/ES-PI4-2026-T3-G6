/**
 * sessoesEstudo/sessaoEstudoService.js — registro do foco concluído no Pomodoro.
 * O relatório lê essas sessões para o foco médio diário.
 */

import mongoose from 'mongoose';
import { ErroApi } from '../../utils/ErroApi.js';
import { DIA, MINUTO, dataValida, inicioDaSemana, instanteLocal } from '../../utils/fuso.js';
import { Disciplina } from '../disciplinas/Disciplina.js';
import { conflitoCom, ocupacoesDoPeriodo } from '../grade/ocupacao.js';
import { Tarefa } from '../tarefas/Tarefa.js';
import { SessaoEstudo, ORIGENS_SESSAO, SITUACOES_SESSAO, TIPOS_FOCO } from './SessaoEstudo.js';

const LIMITE_ATRASO_MS = 14 * 24 * 60 * 60 * 1000;
const CAMPOS_DE_CRIACAO = ['titulo', 'tarefaId', 'disciplinaId', 'inicio', 'fim', 'origem', 'tipoFoco', 'revisaoEspacada'];
const CAMPOS_DE_ATUALIZACAO = ['titulo', 'inicio', 'fim', 'situacao', 'tipoFoco'];
const DURACAO_MINIMA_MIN = 15;
const DURACAO_MAXIMA_MIN = 480;
const PERIODO_MAXIMO_DIAS = 62;

function idValido(id, rotulo = 'sessão') {
    if (!mongoose.isValidObjectId(id)) throw new ErroApi(400, `ID de ${rotulo} inválido.`);
}

function lerData(valor, rotulo) {
    const data = new Date(valor);
    if (valor === undefined || valor === null || Number.isNaN(data.getTime())) {
        throw new ErroApi(400, `Informe ${rotulo} válido.`);
    }
    return data;
}

function validarPeriodo(inicio, fim) {
    const minutos = (fim - inicio) / MINUTO;
    if (minutos <= 0) throw new ErroApi(400, 'O fim da sessão deve ser depois do início.');
    if (minutos < DURACAO_MINIMA_MIN || minutos > DURACAO_MAXIMA_MIN) {
        throw new ErroApi(400, `A sessão deve durar entre ${DURACAO_MINIMA_MIN} e ${DURACAO_MAXIMA_MIN} minutos.`);
    }
}

function lerCorpo(dados, permitidos) {
    if (!dados || typeof dados !== 'object' || Array.isArray(dados)) throw new ErroApi(400, 'Envie os dados da sessão em formato JSON.');
    const desconhecido = Object.keys(dados).find((campo) => !permitidos.includes(campo));
    if (desconhecido) throw new ErroApi(400, `Campo não permitido: ${desconhecido}.`);
    return dados;
}

function validarTitulo(titulo) {
    if (typeof titulo !== 'string' || titulo.trim().length < 2 || titulo.trim().length > 160) {
        throw new ErroApi(400, 'O título deve ter entre 2 e 160 caracteres.');
    }
    return titulo.trim();
}

async function garantirHorarioLivre(usuarioId, inicio, fim, ignorarSessaoId = null) {
    const ocupacoes = await ocupacoesDoPeriodo(usuarioId, inicio.getTime(), fim.getTime(), { ignorarSessaoId });
    const conflito = conflitoCom(ocupacoes, inicio.getTime(), fim.getTime());
    if (conflito) throw new ErroApi(409, `Este horário já está ocupado por "${conflito.titulo}".`);
}

// 'AAAA-MM-DD' (dia local) ou data/hora ISO.
function lerLimite(valor, rotulo) {
    if (dataValida(valor)) return instanteLocal(valor);
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) throw new ErroApi(400, `Informe ${rotulo} como AAAA-MM-DD ou data e hora ISO.`);
    return data.getTime();
}

// Sessões do período [de, ate), por padrão a semana atual. As canceladas ficam de fora, a menos que se filtre por situação.
export async function listar(usuarioId, { de, ate, situacao } = {}) {
    const inicio = de === undefined ? inicioDaSemana(Date.now()) : lerLimite(de, '"de"');
    const fim = ate === undefined ? inicio + 7 * DIA : lerLimite(ate, '"ate"');
    if (fim <= inicio) throw new ErroApi(400, 'O fim do período deve ser depois do início.');
    if (fim - inicio > PERIODO_MAXIMO_DIAS * DIA) throw new ErroApi(400, `O período pode ter no máximo ${PERIODO_MAXIMO_DIAS} dias.`);
    if (situacao !== undefined && !SITUACOES_SESSAO.includes(situacao)) throw new ErroApi(400, 'Situação de sessão inválida.');

    return SessaoEstudo.find({
        usuarioId,
        inicio: { $lt: new Date(fim) },
        fim: { $gt: new Date(inicio) },
        situacao: situacao ?? { $ne: 'cancelada' },
    }).sort({ inicio: 1 });
}

// Cria uma sessão agendada (manual ou aceita de uma sugestão). Recusa horário que choque com bloco fixo ou outra sessão.
export async function criar(usuarioId, dados) {
    const corpo = lerCorpo(dados, CAMPOS_DE_CRIACAO);
    const inicio = lerData(corpo.inicio, 'o início da sessão');
    const fim = lerData(corpo.fim, 'o fim da sessão');
    validarPeriodo(inicio, fim);

    let tarefa = null;
    if (corpo.tarefaId !== undefined && corpo.tarefaId !== null) {
        idValido(corpo.tarefaId, 'tarefa');
        tarefa = await Tarefa.findOne({ _id: corpo.tarefaId, usuarioId });
        if (!tarefa) throw new ErroApi(400, 'A tarefa selecionada não existe ou não pertence a esta conta.');
        const jaAgendada = await SessaoEstudo.exists({ usuarioId, tarefaId: tarefa._id, situacao: 'agendada' });
        if (jaAgendada) throw new ErroApi(409, 'Esta tarefa já está agendada. Remova a sessão atual antes de agendá-la novamente.');
    }

    let disciplinaId = corpo.disciplinaId ?? tarefa?.disciplinaId ?? null;
    if (disciplinaId) {
        idValido(disciplinaId, 'disciplina');
        if (!await Disciplina.exists({ _id: disciplinaId, usuarioId })) {
            throw new ErroApi(400, 'A disciplina selecionada não existe ou não pertence a esta conta.');
        }
    } else {
        disciplinaId = null;
    }

    const titulo = validarTitulo(corpo.titulo ?? tarefa?.titulo);
    const origem = corpo.origem ?? 'manual';
    if (!ORIGENS_SESSAO.includes(origem)) throw new ErroApi(400, 'Origem de sessão inválida.');
    const tipoFoco = corpo.tipoFoco ?? 'teorico';
    if (!TIPOS_FOCO.includes(tipoFoco)) throw new ErroApi(400, 'Tipo de foco inválido.');

    await garantirHorarioLivre(usuarioId, inicio, fim);

    return SessaoEstudo.create({
        usuarioId,
        tarefaId: tarefa?._id ?? null,
        disciplinaId,
        titulo,
        inicio,
        fim,
        origem,
        tipoFoco,
        revisaoEspacada: corpo.revisaoEspacada === true,
        situacao: 'agendada',
    });
}

// Move ou ajusta uma sessão (início, fim, título, situação, tipo de foco). Se ela continua ocupando horário, revalida o conflito.
export async function atualizar(usuarioId, id, dados) {
    idValido(id);
    const corpo = lerCorpo(dados, CAMPOS_DE_ATUALIZACAO);
    if (!Object.keys(corpo).length) throw new ErroApi(400, 'Informe ao menos um campo para atualizar.');

    const sessao = await SessaoEstudo.findOne({ _id: id, usuarioId });
    if (!sessao) throw new ErroApi(404, 'Sessão não encontrada.');

    const inicio = corpo.inicio !== undefined ? lerData(corpo.inicio, 'o início da sessão') : sessao.inicio;
    const fim = corpo.fim !== undefined ? lerData(corpo.fim, 'o fim da sessão') : sessao.fim;
    if (corpo.situacao !== undefined && !SITUACOES_SESSAO.includes(corpo.situacao)) throw new ErroApi(400, 'Situação de sessão inválida.');
    if (corpo.tipoFoco !== undefined && !TIPOS_FOCO.includes(corpo.tipoFoco)) throw new ErroApi(400, 'Tipo de foco inválido.');

    const situacao = corpo.situacao ?? sessao.situacao;
    const mudouHorario = corpo.inicio !== undefined || corpo.fim !== undefined;
    if (mudouHorario) validarPeriodo(inicio, fim);
    if (['agendada', 'concluida'].includes(situacao) && (mudouHorario || corpo.situacao !== undefined)) {
        await garantirHorarioLivre(usuarioId, inicio, fim, sessao._id);
    }

    if (corpo.titulo !== undefined) sessao.titulo = validarTitulo(corpo.titulo);
    sessao.inicio = inicio;
    sessao.fim = fim;
    sessao.situacao = situacao;
    if (corpo.tipoFoco !== undefined) sessao.tipoFoco = corpo.tipoFoco;
    await sessao.save();
    return sessao;
}

export async function excluir(usuarioId, id) {
    idValido(id);
    const { deletedCount } = await SessaoEstudo.deleteOne({ _id: id, usuarioId });
    if (!deletedCount) throw new ErroApi(404, 'Sessão não encontrada.');
}

export async function registrarPomodoro(usuarioId, dados = {}) {
    const minutos = Number(dados.minutos);
    if (!Number.isInteger(minutos) || minutos < 1 || minutos > 180) {
        throw new ErroApi(400, 'Informe os minutos de foco entre 1 e 180.');
    }

    const fim = dados.fim ? new Date(dados.fim) : new Date();
    if (Number.isNaN(fim.getTime())) {
        throw new ErroApi(400, 'Informe o fim do foco.');
    }

    const agora = Date.now();
    if (fim.getTime() > agora + 60_000 || agora - fim.getTime() > LIMITE_ATRASO_MS) {
        throw new ErroApi(400, 'O fim do foco precisa estar nas últimas duas semanas.');
    }

    const completo = dados.completo !== false;
    const sessao = await SessaoEstudo.create({
        usuarioId,
        titulo: 'Foco Pomodoro',
        inicio: new Date(fim.getTime() - minutos * 60_000),
        fim,
        origem: 'manual',
        situacao: 'concluida',
        tipoFoco: 'teorico',
        minutosRealizados: minutos,
        pomodorosPlanejados: 1,
        pomodorosConcluidos: completo ? 1 : 0,
    });

    return sessao;
}
