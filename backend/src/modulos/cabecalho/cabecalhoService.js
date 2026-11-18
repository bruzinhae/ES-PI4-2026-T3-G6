/**
 * cabecalho/cabecalhoService.js — gauge da rotina e avisos do header.
 *
 * O gauge é as horas dos blocos semanais sobre a meta de horas da conta.
 * Avisos de sessão continuam; a contagem de tarefas por disciplina fica na grade.
 */

import { DIA, chaveDoDia, inicioDoDia } from '../../utils/fuso.js';
import { minutosDeEstudo, resumoRotina } from '../../utils/rotinaSemanal.js';
import { BlocoFixo } from '../blocosFixos/BlocoFixo.js';
import { SessaoEstudo } from '../sessoesEstudo/SessaoEstudo.js';
import { Tarefa } from '../tarefas/Tarefa.js';
import { Usuario } from '../usuarios/Usuario.js';

const LIMITE_AVISOS = 8;

export async function montarCabecalho(usuarioId) {
    const agora = Date.now();
    const inicioHoje = inicioDoDia(agora);
    const fimHoje = inicioHoje + DIA;
    const hoje = new Date(inicioHoje);
    const amanha = new Date(fimHoje);

    const [blocos, usuario, sessoesHoje, tarefasPrazo] = await Promise.all([
        BlocoFixo.find({ usuarioId, recorrencia: { $in: ['semanal', 'quinzenal', 'a_cada_3_semanas'] } }).select('categoria disciplinaId duracaoMinutos diasSemana recorrencia').lean(),
        Usuario.findById(usuarioId).select('metaSemanalHoras').lean(),
        SessaoEstudo.find({
            usuarioId,
            inicio: { $gte: hoje, $lt: amanha },
            situacao: { $ne: 'cancelada' },
        }).select('situacao').lean(),
        Tarefa.find({
            usuarioId,
            situacao: { $ne: 'concluida' },
            prazo: { $ne: null, $lt: amanha },
        }).select('titulo prazo').sort({ prazo: 1 }).limit(5).lean(),
    ]);

    const notificacoes = [];
    const chave = chaveDoDia(inicioHoje);

    if (sessoesHoje.length) {
        const feitas = sessoesHoje.filter((sessao) => sessao.situacao === 'concluida').length;
        notificacoes.push({
            id: `sessoes-${chave}`,
            texto: `Você concluiu ${feitas}/${sessoesHoje.length} sessões de hoje.`,
            quando: 'Hoje',
            href: 'index_calendario.html',
        });
    }

    const atrasadas = tarefasPrazo.filter((tarefa) => tarefa.prazo < hoje);
    const vencemHoje = tarefasPrazo.length - atrasadas.length;
    if (atrasadas.length) {
        notificacoes.push({
            id: `tarefas-atraso-${chave}`,
            texto: `${atrasadas.length} ${atrasadas.length === 1 ? 'tarefa passou' : 'tarefas passaram'} do prazo.`,
            quando: 'Agora',
            href: 'index_calendario.html',
        });
    }
    if (vencemHoje) {
        notificacoes.push({
            id: `tarefas-hoje-${chave}`,
            texto: `${vencemHoje} ${vencemHoje === 1 ? 'tarefa vence' : 'tarefas vencem'} hoje.`,
            quando: 'Hoje',
            href: 'index_calendario.html',
        });
    }

    return {
        rotina: resumoRotina(minutosDeEstudo(blocos), usuario?.metaSemanalHoras),
        notificacoes: notificacoes.slice(0, LIMITE_AVISOS),
    };
}
