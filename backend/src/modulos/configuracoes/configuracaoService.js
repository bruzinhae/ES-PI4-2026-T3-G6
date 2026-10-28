/**
 * configuracoes/configuracaoService.js — preferências da Sofia e o resumo real da conta.
 * As preferências ficam no documento do usuário. O resumo usa sessões e blocos já salvos.
 */

import { ErroApi } from '../../utils/ErroApi.js';
import { BlocoFixo } from '../blocosFixos/BlocoFixo.js';
import { SessaoEstudo } from '../sessoesEstudo/SessaoEstudo.js';
import { Usuario } from '../usuarios/Usuario.js';

const RIGIDEZ = ['flexivel', 'equilibrado', 'intensivo'];
const JANELAS = ['manha', 'tarde', 'noite'];
const DURACOES = [25, 50, 90];
const CAMPOS = ['antifadiga', 'focoMatinal', 'repeticaoEspacada', 'ajusteDinamico', 'rigidez', 'janelaFoco', 'duracaoMinutos'];
const BOOLEANOS = ['antifadiga', 'focoMatinal', 'repeticaoEspacada', 'ajusteDinamico'];

export const CONFIGURACAO_PADRAO = {
    antifadiga: true,
    focoMatinal: true,
    repeticaoEspacada: true,
    ajusteDinamico: true,
    rigidez: 'equilibrado',
    janelaFoco: 'manha',
    duracaoMinutos: 50,
};

const ROTULO_JANELA = {
    manha: '08:30 – 12:00',
    tarde: '14:00 – 18:00',
    noite: '19:00 – 22:30',
};

function inicioDaSemana(data) {
    const inicio = new Date(data.getFullYear(), data.getMonth(), data.getDate());
    inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7));
    inicio.setHours(0, 0, 0, 0);
    return inicio;
}

function minutos(hora) {
    const [h, m] = String(hora || '00:00').split(':').map(Number);
    return h * 60 + m;
}

function sobrepoe(blocoA, blocoB) {
    if (blocoA.recorrencia !== 'semanal' || blocoB.recorrencia !== 'semanal') {
        return false;
    }
    const mesmoDia = (blocoA.diasSemana || []).some((dia) => (blocoB.diasSemana || []).includes(dia));
    if (!mesmoDia) {
        return false;
    }
    const inicioA = minutos(blocoA.horaInicio);
    const inicioB = minutos(blocoB.horaInicio);
    return inicioA < inicioB + blocoB.duracaoMinutos && inicioB < inicioA + blocoA.duracaoMinutos;
}

export function validarConfiguracao(dados) {
    if (!dados || typeof dados !== 'object' || Array.isArray(dados)) {
        throw new ErroApi(400, 'Envie as configurações em formato JSON.');
    }

    const desconhecido = Object.keys(dados).find((campo) => !CAMPOS.includes(campo));
    if (desconhecido) {
        throw new ErroApi(400, `Campo não permitido: ${desconhecido}.`);
    }

    const saida = {};
    for (const campo of BOOLEANOS) {
        if (campo in dados) {
            if (typeof dados[campo] !== 'boolean') {
                throw new ErroApi(400, `O campo "${campo}" deve ser verdadeiro ou falso.`);
            }
            saida[campo] = dados[campo];
        }
    }

    if ('rigidez' in dados) {
        if (!RIGIDEZ.includes(dados.rigidez)) {
            throw new ErroApi(400, 'A rigidez deve ser flexível, equilibrada ou intensiva.');
        }
        saida.rigidez = dados.rigidez;
    }

    if ('janelaFoco' in dados) {
        if (!JANELAS.includes(dados.janelaFoco)) {
            throw new ErroApi(400, 'A janela de foco deve ser manhã, tarde ou noite.');
        }
        saida.janelaFoco = dados.janelaFoco;
    }

    if ('duracaoMinutos' in dados) {
        const duracao = Number(dados.duracaoMinutos);
        if (!DURACOES.includes(duracao)) {
            throw new ErroApi(400, 'A duração do bloco deve ser 25, 50 ou 90 minutos.');
        }
        saida.duracaoMinutos = duracao;
    }

    if (!Object.keys(saida).length) {
        throw new ErroApi(400, 'Informe ao menos uma configuração para salvar.');
    }

    return saida;
}

function lerConfiguracao(usuario) {
    const atual = usuario.configuracao?.toObject?.() || usuario.configuracao || {};
    return { ...CONFIGURACAO_PADRAO, ...atual };
}

async function montarResumo(usuarioId, configuracao) {
    const inicio = inicioDaSemana(new Date());
    const fim = new Date(inicio);
    fim.setDate(fim.getDate() + 7);
    const agora = new Date();

    const [sessoes, blocos] = await Promise.all([
        SessaoEstudo.find({
            usuarioId,
            inicio: { $gte: inicio, $lt: fim },
            situacao: { $ne: 'cancelada' },
        }).select('situacao fim').lean(),
        BlocoFixo.find({ usuarioId, recorrencia: 'semanal' }).select('recorrencia diasSemana horaInicio duracaoMinutos').lean(),
    ]);

    const programadas = sessoes.length;
    const encerradas = sessoes.filter((sessao) => (
        sessao.situacao === 'concluida'
        || sessao.situacao === 'nao_realizada'
        || new Date(sessao.fim) <= agora
    ));
    const cumpridas = encerradas.filter((sessao) => sessao.situacao === 'concluida').length;
    const harmonia = encerradas.length ? Math.round((cumpridas / encerradas.length) * 100) : null;

    let conflitos = 0;
    for (let i = 0; i < blocos.length; i += 1) {
        for (let j = i + 1; j < blocos.length; j += 1) {
            if (sobrepoe(blocos[i], blocos[j])) conflitos += 1;
        }
    }

    let rotuloHarmonia = 'Sem base';
    if (harmonia !== null && harmonia >= 80) rotuloHarmonia = 'Em ritmo';
    else if (harmonia !== null && harmonia >= 50) rotuloHarmonia = 'Atenção';
    else if (harmonia !== null) rotuloHarmonia = 'Baixa';

    return {
        janela: configuracao.focoMatinal ? ROTULO_JANELA[configuracao.janelaFoco] : 'Desligada',
        pausa: configuracao.antifadiga ? 'A cada 90 min' : 'Desligada',
        sessoes: programadas,
        conflitos,
        blocos: blocos.length,
        harmonia,
        rotuloHarmonia,
    };
}

export async function obter(usuarioId) {
    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) {
        throw new ErroApi(404, 'Usuário não encontrado.');
    }
    const configuracao = lerConfiguracao(usuario);
    return {
        configuracao,
        resumo: await montarResumo(usuarioId, configuracao),
    };
}

export async function salvar(usuarioId, dados) {
    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) {
        throw new ErroApi(404, 'Usuário não encontrado.');
    }
    const alteracoes = validarConfiguracao(dados);
    usuario.configuracao = { ...lerConfiguracao(usuario), ...alteracoes };
    await usuario.save();
    const configuracao = lerConfiguracao(usuario);
    return {
        configuracao,
        resumo: await montarResumo(usuarioId, configuracao),
    };
}
