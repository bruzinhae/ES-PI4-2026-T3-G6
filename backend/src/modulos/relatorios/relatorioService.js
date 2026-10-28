/**
 * relatorios/relatorioService.js — painel da tela de relatórios.
 *
 * Junta, para uma semana, o que já está no banco:
 * sessões de estudo (horas, pomodoro, consistência), disciplinas (progresso e pendências)
 * e metas (marcos cumpridos).
 */

import { ErroApi } from '../../utils/ErroApi.js';
import { Disciplina } from '../disciplinas/Disciplina.js';
import { Meta } from '../metas/Meta.js';
import { SessaoEstudo } from '../sessoesEstudo/SessaoEstudo.js';
import { Usuario } from '../usuarios/Usuario.js';

const ROTULOS_DIA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function inicioDaSemana(data) {
    const inicio = new Date(data.getFullYear(), data.getMonth(), data.getDate());
    inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7));
    inicio.setHours(0, 0, 0, 0);
    return inicio;
}

function somarDias(data, dias) {
    const copia = new Date(data);
    copia.setDate(copia.getDate() + dias);
    return copia;
}

function chaveData(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

function rotuloPeriodo(inicio, fimExclusivo) {
    const ultimo = somarDias(fimExclusivo, -1);
    const formato = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' });
    const limpar = (data) => formato.format(data).replace('.', '');
    return `${limpar(inicio)} – ${limpar(ultimo)}`;
}

function indiceSegunda(data) {
    return (data.getDay() + 6) % 7;
}

function progressoConteudos(conteudos = []) {
    if (!conteudos.length) {
        return 0;
    }
    const concluidos = conteudos.filter((item) => item.situacao === 'concluido').length;
    return Math.round((concluidos / conteudos.length) * 100);
}

function minutosPendentes(conteudos = []) {
    return conteudos
        .filter((item) => item.situacao !== 'concluido')
        .reduce((soma, item) => soma + (Number(item.minutosEstimados) || 0), 0);
}

function percentualGrupo(metas) {
    const marcos = metas.flatMap((meta) => meta.marcos || []);
    if (marcos.length) {
        const atingidos = marcos.filter((marco) => marco.atingido).length;
        return Math.round((atingidos / marcos.length) * 100);
    }
    if (!metas.length) {
        return 0;
    }
    const concluidas = metas.filter((meta) => meta.situacao === 'concluida').length;
    return Math.round((concluidas / metas.length) * 100);
}

function resumirSessoes(sessoes, agora) {
    const concluidas = sessoes.filter((sessao) => sessao.situacao === 'concluida');
    const dias = Array.from({ length: 7 }, () => ({ teoricoMin: 0, praticaMin: 0 }));
    const porHora = new Map();
    let minutos = 0;
    let pomodorosConcluidos = 0;
    let pomodorosPlanejados = 0;
    const diasComEstudo = new Set();

    for (const sessao of concluidas) {
        const inicio = new Date(sessao.inicio);
        const realizados = Number(sessao.minutosRealizados) || 0;
        const indice = indiceSegunda(inicio);
        const pratica = sessao.tipoFoco === 'pratica';
        if (pratica) {
            dias[indice].praticaMin += realizados;
        } else {
            dias[indice].teoricoMin += realizados;
        }
        minutos += realizados;
        pomodorosConcluidos += Number(sessao.pomodorosConcluidos) || 0;
        pomodorosPlanejados += Number(sessao.pomodorosPlanejados) || 0;
        diasComEstudo.add(chaveData(inicio));
        const hora = inicio.getHours();
        porHora.set(hora, (porHora.get(hora) || 0) + realizados);
    }

    const encerradas = sessoes.filter((sessao) => (
        sessao.situacao === 'concluida'
        || sessao.situacao === 'nao_realizada'
        || new Date(sessao.fim) <= agora
    ));

    let picoHora = null;
    let picoMinutos = 0;
    for (const [hora, total] of porHora) {
        if (total > picoMinutos) {
            picoHora = hora;
            picoMinutos = total;
        }
    }

    const diaPico = dias.reduce((melhor, dia, indice) => {
        const total = dia.teoricoMin + dia.praticaMin;
        if (total > melhor.total) {
            return { indice, total };
        }
        return melhor;
    }, { indice: -1, total: 0 });

    return {
        dias,
        minutos,
        diasComEstudo: diasComEstudo.size,
        pomodorosConcluidos,
        pomodorosPlanejados,
        cumpridas: concluidas.length,
        previstas: encerradas.length,
        picoHora,
        diaPico: diaPico.total > 0 ? diaPico.indice : null,
    };
}

function resolverInicio(inicioQuery) {
    if (!inicioQuery) {
        return inicioDaSemana(new Date());
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(inicioQuery)) {
        throw new ErroApi(400, 'Informe a semana no formato AAAA-MM-DD.');
    }
    const [ano, mes, dia] = inicioQuery.split('-').map(Number);
    const data = new Date(ano, mes - 1, dia);
    if (Number.isNaN(data.getTime()) || data.getDate() !== dia) {
        throw new ErroApi(400, 'Informe uma data válida.');
    }
    return inicioDaSemana(data);
}

export async function montarRelatorio(usuarioId, inicioQuery) {
    const inicio = resolverInicio(inicioQuery);
    const fim = somarDias(inicio, 7);
    const anterior = somarDias(inicio, -7);
    const agora = new Date();

    const [sessoes, sessoesAnteriores, disciplinas, metas, usuario] = await Promise.all([
        SessaoEstudo.find({
            usuarioId,
            inicio: { $gte: inicio, $lt: fim },
            situacao: { $ne: 'cancelada' },
        }).lean(),
        SessaoEstudo.find({
            usuarioId,
            inicio: { $gte: anterior, $lt: inicio },
            situacao: 'concluida',
        }).select('minutosRealizados inicio').lean(),
        Disciplina.find({ usuarioId, situacao: 'ativa' }).sort({ nome: 1 }).lean(),
        Meta.find({ usuarioId, situacao: { $ne: 'cancelada' } }).lean(),
        Usuario.findById(usuarioId).select('metaSemanalHoras'),
    ]);

    const atual = resumirSessoes(sessoes, agora);
    const minutosAnteriores = sessoesAnteriores.reduce((soma, sessao) => soma + (Number(sessao.minutosRealizados) || 0), 0);
    const diasAnteriores = new Set(sessoesAnteriores.map((sessao) => chaveData(new Date(sessao.inicio)))).size;
    const mediaAtual = atual.diasComEstudo ? atual.minutos / atual.diasComEstudo : 0;
    const mediaAnterior = diasAnteriores ? minutosAnteriores / diasAnteriores : 0;
    const variacao = mediaAnterior > 0
        ? Math.round(((mediaAtual - mediaAnterior) / mediaAnterior) * 100)
        : null;

    const maxMinutosDia = Math.max(0, ...atual.dias.map((dia) => dia.teoricoMin + dia.praticaMin));
    const eixoMaxHoras = Math.max(2, Math.ceil(maxMinutosDia / 60) || 2);

    const linhas = disciplinas.map((disciplina) => {
        const conteudos = disciplina.conteudos || [];
        const progresso = progressoConteudos(conteudos);
        const pendenteMin = minutosPendentes(conteudos);
        const pendentes = conteudos.filter((item) => item.situacao !== 'concluido').length;
        const emDia = progresso >= 60 || pendenteMin === 0;
        return {
            id: String(disciplina._id),
            nome: disciplina.nome,
            progresso,
            pendenteMin,
            pendentes,
            emDia,
        };
    }).sort((a, b) => a.progresso - b.progresso || b.pendenteMin - a.pendenteMin);

    const foco = linhas.find((linha) => !linha.emDia) || linhas[0] || null;
    const metaHoras = usuario?.metaSemanalHoras || null;
    const horasEstudadas = Math.round((atual.minutos / 60) * 10) / 10;

    let notaFoco = 'Nenhuma sessão concluída nesta semana.';
    if (atual.minutos > 0 && metaHoras) {
        notaFoco = `${horasEstudadas}h estudadas · meta da conta: ${metaHoras}h/semana`;
    } else if (atual.minutos > 0 && variacao !== null) {
        notaFoco = variacao >= 0
            ? `${variacao}% acima da média diária da semana anterior`
            : `${Math.abs(variacao)}% abaixo da média diária da semana anterior`;
    } else if (atual.minutos > 0) {
        notaFoco = 'Primeira semana com sessões registradas.';
    }

    let notaGrafico = 'Ainda não há sessões concluídas nesta semana.';
    if (atual.diaPico !== null) {
        const dia = ROTULOS_DIA[atual.diaPico];
        notaGrafico = atual.picoHora !== null
            ? `Maior volume em ${dia}. Pico de estudo por volta das ${String(atual.picoHora).padStart(2, '0')}h.`
            : `Maior volume em ${dia}.`;
    }

    const porPrioridade = {
        alta: percentualGrupo(metas.filter((meta) => meta.prioridade === 'alta')),
        media: percentualGrupo(metas.filter((meta) => meta.prioridade === 'media')),
        baixa: percentualGrupo(metas.filter((meta) => meta.prioridade === 'baixa')),
    };
    const criticas = metas.filter((meta) => meta.prioridade === 'alta' && meta.situacao === 'ativa').length;

    return {
        periodo: {
            inicio: chaveData(inicio),
            fim: chaveData(somarDias(fim, -1)),
            rotulo: rotuloPeriodo(inicio, fim),
        },
        foco: {
            minutosMedios: Math.round(mediaAtual),
            variacaoPercentual: variacao,
            nota: notaFoco,
        },
        consistencia: {
            percentual: atual.previstas ? Math.round((atual.cumpridas / atual.previstas) * 100) : 0,
            cumpridas: atual.cumpridas,
            previstas: atual.previstas,
        },
        pomodoro: {
            concluidos: atual.pomodorosConcluidos,
            planejados: atual.pomodorosPlanejados,
            percentual: atual.pomodorosPlanejados
                ? Math.round((atual.pomodorosConcluidos / atual.pomodorosPlanejados) * 100)
                : 0,
        },
        destaque: foco
            ? {
                nome: foco.nome,
                status: foco.emDia ? 'No ritmo' : 'Atenção',
                emDia: foco.emDia,
                nota: foco.pendentes
                    ? `${foco.pendentes} conteúdo(s) ainda em aberto`
                    : 'Conteúdos desta matéria acompanhados',
            }
            : {
                nome: 'Sem disciplinas',
                status: '—',
                emDia: true,
                nota: 'Cadastre uma disciplina para acompanhar o semestre.',
            },
        horasSemana: {
            eixoMaxHoras,
            dias: atual.dias.map((dia, indice) => ({
                rotulo: ROTULOS_DIA[indice],
                teoricoMin: dia.teoricoMin,
                praticaMin: dia.praticaMin,
            })),
            nota: notaGrafico,
        },
        metas: {
            percentual: percentualGrupo(metas),
            criticas,
            porPrioridade,
            total: metas.length,
        },
        disciplinas: linhas,
    };
}
