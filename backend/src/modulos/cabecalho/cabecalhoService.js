/**
 * cabecalho/cabecalhoService.js — resumo do header (tarefas e avisos).
 *
 * Não existe coleção de notificações: os avisos saem do que já está no banco
 * (prazos de tarefas, conteúdos atrasados e sessões de hoje).
 */

import { Disciplina } from '../disciplinas/Disciplina.js';
import { SessaoEstudo } from '../sessoesEstudo/SessaoEstudo.js';
import { Tarefa } from '../tarefas/Tarefa.js';

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

function quandoRelativo(data, agora) {
    const diffMs = data.getTime() - agora.getTime();
    const dias = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
    if (dias < 0) return 'Atrasada';
    if (dias === 0) return 'Hoje';
    if (dias === 1) return 'Amanhã';
    return `Em ${dias} dias`;
}

function progresso(conteudos = []) {
    if (!conteudos.length) return 100;
    const concluidos = conteudos.filter((item) => item.situacao === 'concluido').length;
    return Math.round((concluidos / conteudos.length) * 100);
}

export async function montarCabecalho(usuarioId) {
    const agora = new Date();
    const inicioHoje = inicioDoDia(agora);
    const fimHoje = somarDias(inicioHoje, 1);
    const limite = somarDias(agora, 7);

    const [tarefas, disciplinas, sessoesHoje] = await Promise.all([
        Tarefa.find({ usuarioId }).select('titulo situacao prazo').lean(),
        Disciplina.find({ usuarioId, situacao: 'ativa' }).select('nome conteudos').lean(),
        SessaoEstudo.find({
            usuarioId,
            inicio: { $gte: inicioHoje, $lt: fimHoje },
            situacao: { $ne: 'cancelada' },
        }).select('situacao').lean(),
    ]);

    const total = tarefas.length;
    const concluidas = tarefas.filter((tarefa) => tarefa.situacao === 'concluida').length;
    const notificacoes = [];

    for (const tarefa of tarefas) {
        if (!tarefa.prazo || tarefa.situacao === 'concluida') continue;
        const prazo = new Date(tarefa.prazo);
        if (prazo > limite) continue;
        const atrasada = prazo < agora;
        notificacoes.push({
            id: `tarefa-${tarefa._id}`,
            texto: atrasada
                ? `O prazo de ${tarefa.titulo} já passou.`
                : `Prazo de ${tarefa.titulo} ${quandoRelativo(prazo, agora).toLowerCase()}.`,
            quando: quandoRelativo(prazo, agora),
            href: 'index_metas.html',
        });
    }

    for (const disciplina of disciplinas) {
        const conteudos = disciplina.conteudos || [];
        const percentual = progresso(conteudos);
        const pendentes = conteudos.filter((item) => item.situacao !== 'concluido').length;
        if (!pendentes || percentual >= 60) continue;
        notificacoes.push({
            id: `disciplina-${disciplina._id}`,
            texto: `${disciplina.nome} está com ${percentual}% do conteúdo concluído.`,
            quando: `${pendentes} em aberto`,
            href: 'index_disciplinas.html',
        });
    }

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
        tarefas: {
            concluidas,
            total,
            percentual: total ? Math.round((concluidas / total) * 100) : 0,
        },
        notificacoes: notificacoes.slice(0, LIMITE_AVISOS),
    };
}
