/**
 * sessoesEstudo/sessaoEstudoService.js — registro do foco concluído no Pomodoro.
 * O relatório lê essas sessões para o foco médio diário.
 */

import { ErroApi } from '../../utils/ErroApi.js';
import { SessaoEstudo } from './SessaoEstudo.js';

const LIMITE_ATRASO_MS = 14 * 24 * 60 * 60 * 1000;

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
