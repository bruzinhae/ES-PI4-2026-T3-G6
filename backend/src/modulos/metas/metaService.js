/**
 * metas/metaService.js — CRUD das metas e o painel da tela.
 * O progresso vem dos marcos; em hábito sem marcos, das horas estudadas na semana.
 */

import mongoose from 'mongoose';
import { ErroApi } from '../../utils/ErroApi.js';
import { selecionarCampos } from '../../utils/validacoes.js';
import { Disciplina } from '../disciplinas/Disciplina.js';
import { SessaoEstudo } from '../sessoesEstudo/SessaoEstudo.js';
import { Meta, PRIORIDADES_META, SITUACOES_META, TIPOS_META } from './Meta.js';

const CAMPOS = ['titulo', 'tipo', 'prioridade', 'prazo', 'situacao', 'disciplinaId', 'metaSemanalHoras', 'marcos'];

function idValido(id, rotulo = 'meta') {
    if (!mongoose.isValidObjectId(id)) {
        throw new ErroApi(400, `ID de ${rotulo} inválido.`);
    }
}

function limparVazio(valor) {
    return valor === '' ? null : valor;
}

function inicioDoDia(data) {
    return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

function inicioDaSemana(data) {
    const inicio = inicioDoDia(data);
    inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7));
    return inicio;
}

function somarDias(data, dias) {
    const copia = new Date(data);
    copia.setDate(copia.getDate() + dias);
    return copia;
}

function diferencaDias(agora, prazo) {
    const ms = inicioDoDia(prazo).getTime() - inicioDoDia(agora).getTime();
    return Math.round(ms / 86400000);
}

function lerData(valor, rotulo) {
    if (valor === null || valor === undefined) {
        return null;
    }

    if (typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
        const [ano, mes, dia] = valor.split('-').map(Number);
        const data = new Date(ano, mes - 1, dia);
        if (Number.isNaN(data.getTime()) || data.getDate() !== dia) {
            throw new ErroApi(400, `${rotulo} inválida.`);
        }
        return data;
    }

    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) {
        throw new ErroApi(400, `${rotulo} inválida.`);
    }
    return data;
}

function validarMarcos(marcos) {
    if (marcos === undefined) {
        return undefined;
    }
    if (!Array.isArray(marcos)) {
        throw new ErroApi(400, 'Os marcos devem ser uma lista.');
    }
    if (marcos.length > 30) {
        throw new ErroApi(400, 'Uma meta pode ter no máximo 30 marcos.');
    }

    return marcos.map((item, indice) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
            throw new ErroApi(400, `Marco inválido na posição ${indice + 1}.`);
        }

        const titulo = typeof item.titulo === 'string' ? item.titulo.trim() : '';
        if (titulo.length < 2) {
            throw new ErroApi(400, `Informe o título do marco na posição ${indice + 1}.`);
        }

        const atingido = item.atingido === true;
        let nota = item.nota === undefined || item.nota === null || item.nota === '' ? null : Number(item.nota);
        if (nota !== null && (Number.isNaN(nota) || nota < 0 || nota > 10)) {
            throw new ErroApi(400, `A nota do marco "${titulo}" deve ficar entre 0 e 10.`);
        }

        return {
            ...(item.id && mongoose.isValidObjectId(item.id) ? { _id: item.id } : {}),
            titulo,
            atingido,
            atingidoEm: atingido ? (item.atingidoEm ? lerData(item.atingidoEm, 'A data do marco') : new Date()) : null,
            nota,
        };
    });
}

function validarPayload(dados, parcial = false) {
    if (!dados || typeof dados !== 'object' || Array.isArray(dados)) {
        throw new ErroApi(400, 'Envie os dados da meta em formato JSON.');
    }

    const desconhecido = Object.keys(dados).find((campo) => !CAMPOS.includes(campo));
    if (desconhecido) {
        throw new ErroApi(400, `Campo não permitido: ${desconhecido}.`);
    }

    const bruto = selecionarCampos(dados, CAMPOS);
    const payload = Object.fromEntries(
        Object.entries(bruto).map(([campo, valor]) => [campo, limparVazio(valor)])
    );

    if (!parcial && !payload.titulo) {
        throw new ErroApi(400, 'O campo "titulo" é obrigatório.');
    }

    if (payload.titulo !== undefined) {
        if (typeof payload.titulo !== 'string' || payload.titulo.trim().length < 2 || payload.titulo.trim().length > 200) {
            throw new ErroApi(400, 'O título deve ter entre 2 e 200 caracteres.');
        }
        payload.titulo = payload.titulo.trim();
    }

    if (payload.tipo !== undefined && !TIPOS_META.includes(payload.tipo)) {
        throw new ErroApi(400, 'Tipo de meta inválido.');
    }

    if (payload.prioridade !== undefined && !PRIORIDADES_META.includes(payload.prioridade)) {
        throw new ErroApi(400, 'Prioridade inválida.');
    }

    if (payload.situacao !== undefined && !SITUACOES_META.includes(payload.situacao)) {
        throw new ErroApi(400, 'Situação de meta inválida.');
    }

    if ('prazo' in payload) {
        payload.prazo = lerData(payload.prazo, 'A data do prazo');
    }

    if ('disciplinaId' in payload) {
        if (payload.disciplinaId === null) {
            payload.disciplinaId = null;
        } else {
            idValido(payload.disciplinaId, 'disciplina');
        }
    }

    if ('metaSemanalHoras' in payload && payload.metaSemanalHoras !== null) {
        payload.metaSemanalHoras = Number(payload.metaSemanalHoras);
        if (!Number.isInteger(payload.metaSemanalHoras) || payload.metaSemanalHoras < 1 || payload.metaSemanalHoras > 168) {
            throw new ErroApi(400, 'A meta semanal deve ser um número inteiro entre 1 e 168.');
        }
    }

    if ('marcos' in payload) {
        payload.marcos = validarMarcos(payload.marcos);
    }

    return payload;
}

async function conferirDisciplina(usuarioId, disciplinaId) {
    if (!disciplinaId) {
        return;
    }
    const existe = await Disciplina.exists({ _id: disciplinaId, usuarioId });
    if (!existe) {
        throw new ErroApi(400, 'Disciplina não encontrada.');
    }
}

function ajustarTipo(payload, atual = {}) {
    const tipo = payload.tipo ?? atual.tipo ?? 'geral';
    if (tipo !== 'disciplina' && payload.tipo && payload.tipo !== 'disciplina') {
        payload.disciplinaId = null;
    }
    if (tipo === 'habito') {
        const horas = payload.metaSemanalHoras !== undefined ? payload.metaSemanalHoras : atual.metaSemanalHoras;
        if (!horas) {
            throw new ErroApi(400, 'Informe quantas horas por semana esse hábito pede.');
        }
    }
}

async function carregarContexto(usuarioId) {
    const agora = new Date();
    const inicio = inicioDaSemana(agora);
    const fim = somarDias(inicio, 7);
    const [sessoes, disciplinas] = await Promise.all([
        SessaoEstudo.find({
            usuarioId,
            inicio: { $gte: inicio, $lt: fim },
            situacao: { $ne: 'cancelada' },
        }).select('disciplinaId situacao fim minutosRealizados').lean(),
        Disciplina.find({ usuarioId }).select('nome').lean(),
    ]);

    const minutosPorDisciplina = new Map();
    let minutosTotais = 0;
    let cumpridas = 0;
    let previstas = 0;

    for (const sessao of sessoes) {
        const encerrada = sessao.situacao === 'concluida'
            || sessao.situacao === 'nao_realizada'
            || new Date(sessao.fim) <= agora;
        if (encerrada) {
            previstas += 1;
        }
        if (sessao.situacao !== 'concluida') {
            continue;
        }
        cumpridas += 1;
        const minutos = Number(sessao.minutosRealizados) || 0;
        minutosTotais += minutos;
        if (sessao.disciplinaId) {
            const chave = String(sessao.disciplinaId);
            minutosPorDisciplina.set(chave, (minutosPorDisciplina.get(chave) || 0) + minutos);
        }
    }

    return {
        agora,
        minutosTotais,
        minutosPorDisciplina,
        cumpridas,
        previstas,
        disciplinas: new Map(disciplinas.map((item) => [String(item._id), item.nome])),
    };
}

function apresentar(meta, contexto) {
    const json = typeof meta.toJSON === 'function' ? meta.toJSON() : { ...meta };
    const marcos = json.marcos || [];
    const atingidos = marcos.filter((marco) => marco.atingido).length;
    const minutos = json.disciplinaId
        ? (contexto.minutosPorDisciplina.get(String(json.disciplinaId)) || 0)
        : contexto.minutosTotais;
    const horasRealizadas = Math.round((minutos / 60) * 10) / 10;
    let progresso = 0;

    if (marcos.length) {
        progresso = Math.round((atingidos / marcos.length) * 100);
    } else if (json.metaSemanalHoras) {
        progresso = Math.min(100, Math.round((horasRealizadas / json.metaSemanalHoras) * 100));
    } else if (json.situacao === 'concluida') {
        progresso = 100;
    }

    const prazo = json.prazo ? new Date(json.prazo) : null;
    const diasParaPrazo = prazo ? diferencaDias(contexto.agora, prazo) : null;

    return {
        ...json,
        disciplinaNome: json.disciplinaId ? (contexto.disciplinas.get(String(json.disciplinaId)) || null) : null,
        progresso,
        atingidos,
        totalMarcos: marcos.length,
        horasRealizadas,
        diasParaPrazo,
        atrasada: json.situacao === 'ativa' && diasParaPrazo !== null && diasParaPrazo < 0,
        critica: json.situacao === 'ativa' && diasParaPrazo !== null && diasParaPrazo >= 0 && diasParaPrazo <= 7,
    };
}

function variacaoMensal(metas, agora) {
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const inicioAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
    let atual = 0;
    let anterior = 0;

    for (const meta of metas) {
        for (const marco of meta.marcos || []) {
            if (!marco.atingido || !marco.atingidoEm) {
                continue;
            }
            const quando = new Date(marco.atingidoEm);
            if (quando >= inicioMes) {
                atual += 1;
            } else if (quando >= inicioAnterior && quando < inicioMes) {
                anterior += 1;
            }
        }
    }

    if (!anterior) {
        return null;
    }
    return Math.round(((atual - anterior) / anterior) * 100);
}

function escolherFoco(ativas) {
    return ativas.slice().sort((a, b) => {
        if (a.atrasada !== b.atrasada) {
            return a.atrasada ? -1 : 1;
        }
        if (a.critica !== b.critica) {
            return a.critica ? -1 : 1;
        }
        if (a.progresso !== b.progresso) {
            return a.progresso - b.progresso;
        }
        return (a.diasParaPrazo ?? 9999) - (b.diasParaPrazo ?? 9999);
    })[0] || null;
}

function textoPrazo(meta) {
    if (meta.diasParaPrazo === null) {
        return '';
    }
    if (meta.diasParaPrazo === 0) {
        return ' O prazo é hoje.';
    }
    if (meta.diasParaPrazo < 0) {
        const dias = Math.abs(meta.diasParaPrazo);
        return ` O prazo venceu há ${dias} dia${dias === 1 ? '' : 's'}.`;
    }
    return ` O prazo é em ${meta.diasParaPrazo} dia${meta.diasParaPrazo === 1 ? '' : 's'}.`;
}

function montarInsight(foco) {
    if (!foco) {
        return {
            metaId: null,
            marcoId: null,
            texto: 'Cadastre uma meta para acompanhar prazos e marcos do semestre.',
        };
    }

    const pendente = (foco.marcos || []).find((marco) => !marco.atingido);
    let texto;

    if (foco.tipo === 'habito' && foco.metaSemanalHoras && !foco.totalMarcos) {
        const falta = Math.max(0, Math.round((foco.metaSemanalHoras - foco.horasRealizadas) * 10) / 10);
        texto = falta === 0
            ? `A meta “${foco.titulo}” já chegou nas ${foco.metaSemanalHoras}h desta semana.`
            : `Faltam ${falta}h para a meta “${foco.titulo}” nesta semana.`;
    } else if (foco.totalMarcos) {
        const faltam = foco.totalMarcos - foco.atingidos;
        texto = faltam === 0
            ? `Todos os marcos de “${foco.titulo}” foram atingidos.`
            : `“${foco.titulo}” está em ${foco.progresso}%. Falta${faltam === 1 ? '' : 'm'} ${faltam} marco${faltam === 1 ? '' : 's'}.${textoPrazo(foco)}`;
    } else {
        texto = `“${foco.titulo}” está ativa.${textoPrazo(foco)} Inclua marcos para medir o progresso.`;
    }

    return {
        metaId: foco.id,
        marcoId: pendente?.id || null,
        texto,
    };
}

function montarPainel(metas, contexto) {
    const relevantes = metas.filter((meta) => meta.situacao !== 'cancelada');
    const ativas = relevantes.filter((meta) => meta.situacao === 'ativa');
    const concluidas = relevantes.filter((meta) => meta.situacao === 'concluida').length;
    const total = relevantes.length;
    const variacao = variacaoMensal(metas, contexto.agora);
    const percentual = total ? Math.round((concluidas / total) * 100) : 0;
    const consistencia = contexto.previstas
        ? Math.round((contexto.cumpridas / contexto.previstas) * 100)
        : 0;

    const fim = relevantes.reduce((maior, meta) => {
        if (!meta.prazo) {
            return maior;
        }
        const instante = new Date(meta.prazo).getTime();
        return instante > maior ? instante : maior;
    }, 0);

    const proxima = ativas
        .filter((meta) => meta.diasParaPrazo !== null)
        .sort((a, b) => a.diasParaPrazo - b.diasParaPrazo)[0] || null;

    const media = ativas.length
        ? Math.round(ativas.reduce((soma, meta) => soma + meta.progresso, 0) / ativas.length)
        : 0;

    let previsaoRotulo = 'Sem base';
    if (ativas.length && media >= 80) {
        previsaoRotulo = 'Alto êxito';
    } else if (ativas.length && media >= 50) {
        previsaoRotulo = 'No caminho';
    } else if (ativas.length) {
        previsaoRotulo = 'Atenção';
    }

    const marcos = metas.flatMap((meta) => (meta.marcos || []).map((marco) => ({
        id: marco.id,
        metaId: meta.id,
        titulo: marco.titulo,
        nota: marco.nota,
        atingido: marco.atingido,
        atingidoEm: marco.atingidoEm,
    })));
    marcos.sort((a, b) => {
        if (a.atingido !== b.atingido) {
            return a.atingido ? -1 : 1;
        }
        return new Date(b.atingidoEm || 0) - new Date(a.atingidoEm || 0);
    });

    let notaProxima = 'Nenhum prazo definido nas metas ativas.';
    if (proxima) {
        if (proxima.diasParaPrazo < 0) {
            notaProxima = `Prazo vencido: ${proxima.titulo}.`;
        } else if (proxima.diasParaPrazo === 0) {
            notaProxima = `Próximo prazo: ${proxima.titulo}, hoje.`;
        } else {
            notaProxima = `Próximo prazo: ${proxima.titulo}, em ${proxima.diasParaPrazo} dia${proxima.diasParaPrazo === 1 ? '' : 's'}.`;
        }
    }

    return {
        semestre: {
            concluidas,
            total,
            percentual,
            pendentes: ativas.length,
            variacaoPercentual: variacao,
        },
        consistencia: {
            percentual: consistencia,
            cumpridas: contexto.cumpridas,
            previstas: contexto.previstas,
            nota: contexto.previstas
                ? `${contexto.cumpridas}/${contexto.previstas} sessões cumpridas nesta semana`
                : 'Nenhuma sessão de estudo encerrada nesta semana.',
        },
        prazo: {
            diasRestantes: fim ? diferencaDias(contexto.agora, new Date(fim)) : null,
            nota: notaProxima,
        },
        previsao: {
            rotulo: previsaoRotulo,
            percentual: media,
            nota: ativas.length
                ? `Progresso médio de ${media}% nas metas ativas.`
                : 'Cadastre metas ativas para estimar o ritmo.',
        },
        marcosRecentes: marcos.slice(0, 4),
        insight: montarInsight(escolherFoco(ativas)),
    };
}

async function apresentarUma(usuarioId, meta) {
    const contexto = await carregarContexto(usuarioId);
    return apresentar(meta, contexto);
}

export async function listar(usuarioId, { situacao } = {}) {
    if (situacao && !SITUACOES_META.includes(situacao)) {
        throw new ErroApi(400, 'Situação de meta inválida.');
    }

    const filtro = { usuarioId };
    if (situacao) {
        filtro.situacao = situacao;
    }

    const [filtradas, todas, contexto] = await Promise.all([
        Meta.find(filtro).sort({ criadoEm: -1 }),
        Meta.find({ usuarioId }),
        carregarContexto(usuarioId),
    ]);

    return {
        metas: filtradas.map((meta) => apresentar(meta, contexto)),
        painel: montarPainel(todas.map((meta) => apresentar(meta, contexto)), contexto),
    };
}

export async function buscarPorId(usuarioId, id) {
    idValido(id);
    const meta = await Meta.findOne({ _id: id, usuarioId });
    if (!meta) {
        throw new ErroApi(404, 'Meta não encontrada.');
    }
    return apresentarUma(usuarioId, meta);
}

export async function criar(usuarioId, dados) {
    const payload = validarPayload(dados);
    ajustarTipo(payload);
    await conferirDisciplina(usuarioId, payload.disciplinaId);

    const meta = await Meta.create({
        ...payload,
        usuarioId,
        tipo: payload.tipo || 'geral',
        prioridade: payload.prioridade || 'media',
        situacao: payload.situacao || 'ativa',
        prazo: payload.prazo ?? null,
        disciplinaId: payload.disciplinaId ?? null,
        metaSemanalHoras: payload.metaSemanalHoras ?? null,
        marcos: payload.marcos || [],
    });

    return apresentarUma(usuarioId, meta);
}

export async function atualizar(usuarioId, id, dados) {
    idValido(id);
    const meta = await Meta.findOne({ _id: id, usuarioId });
    if (!meta) {
        throw new ErroApi(404, 'Meta não encontrada.');
    }

    const payload = validarPayload(dados, true);
    if (!Object.keys(payload).length) {
        throw new ErroApi(400, 'Informe ao menos um campo para atualizar.');
    }

    ajustarTipo(payload, meta);
    if ('disciplinaId' in payload) {
        await conferirDisciplina(usuarioId, payload.disciplinaId);
    }

    meta.set(payload);
    await meta.save();
    return apresentarUma(usuarioId, meta);
}

export async function excluir(usuarioId, id) {
    idValido(id);
    const meta = await Meta.findOneAndDelete({ _id: id, usuarioId });
    if (!meta) {
        throw new ErroApi(404, 'Meta não encontrada.');
    }
}
