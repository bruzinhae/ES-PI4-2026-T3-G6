/**
 * cabecalho/cabecalhoService.js — gauge da rotina e avisos do header.
 *
 * O gauge é as horas dos blocos semanais sobre a meta de horas da conta.
 * Avisos de sessão continuam; a contagem de tarefas por disciplina fica na grade.
 */

import { BlocoFixo } from '../blocosFixos/BlocoFixo.js';
import { SessaoEstudo } from '../sessoesEstudo/SessaoEstudo.js';
import { Usuario } from '../usuarios/Usuario.js';
import { minutosDaSemana, resumoRotina } from '../../utils/rotinaSemanal.js';

const LIMITE_AVISOS = 8;

function inicioDoDia(data) {
    return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

function somarDias(data, dias) {
    const copia = new Date(data);
    copia.setDate(copia.getDate() + dias);
    return copia;
}

function chaveData(data) {
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${data.getFullYear()}-${mes}-${dia}`;
}

export async function montarCabecalho(usuarioId) {
    const agora = new Date();
    const inicioHoje = inicioDoDia(agora);
    const fimHoje = somarDias(inicioHoje, 1);

    const [blocos, usuario, sessoesHoje] = await Promise.all([
        BlocoFixo.find({ usuarioId, recorrencia: 'semanal' }).select('duracaoMinutos diasSemana').lean(),
        Usuario.findById(usuarioId).select('metaSemanalHoras').lean(),
        SessaoEstudo.find({
            usuarioId,
            inicio: { $gte: inicioHoje, $lt: fimHoje },
            situacao: { $ne: 'cancelada' },
        }).select('situacao').lean(),
    ]);

    const notificacoes = [];

    if (sessoesHoje.length) {
        const feitas = sessoesHoje.filter((sessao) => sessao.situacao === 'concluida').length;
        notificacoes.push({
            id: `sessoes-${chaveData(inicioHoje)}`,
            texto: `Você concluiu ${feitas}/${sessoesHoje.length} sessões de hoje.`,
            quando: 'Hoje',
            href: 'index_calendario.html',
        });
    }

    return {
        rotina: resumoRotina(minutosDaSemana(blocos), usuario?.metaSemanalHoras),
        notificacoes: notificacoes.slice(0, LIMITE_AVISOS),
    };
}
