/**
 * disciplinas/disciplinaService.js — regras de CRUD das disciplinas do usuário.
 */

import mongoose from 'mongoose';
import { ErroApi } from '../../utils/ErroApi.js';
import { selecionarCampos } from '../../utils/validacoes.js';
import { BlocoFixo } from '../blocosFixos/BlocoFixo.js';
import {
    CORES_DISCIPLINA,
    Disciplina,
    SITUACOES_CONTEUDO,
    SITUACOES_DISCIPLINA,
} from './Disciplina.js';

const CAMPOS = [
    'nome',
    'area',
    'professor',
    'local',
    'creditos',
    'peso',
    'media',
    'dificuldade',
    'cor',
    'periodoLetivo',
    'situacao',
    'conteudos',
];

const CAMPOS_OBRIGATORIOS = ['nome', 'area'];

function limparVazio(valor) {
    return valor === '' ? null : valor;
}

function idValido(id, rotulo = 'disciplina') {
    if (!mongoose.isValidObjectId(id)) {
        throw new ErroApi(400, `ID de ${rotulo} inválido.`);
    }
}

function progressoDosConteudos(conteudos = []) {
    if (!conteudos.length) {
        return 0;
    }

    const concluidos = conteudos.filter((item) => item.situacao === 'concluido').length;
    return Math.round((concluidos / conteudos.length) * 100);
}

function validarConteudos(conteudos) {
    if (conteudos === undefined) {
        return undefined;
    }

    if (!Array.isArray(conteudos)) {
        throw new ErroApi(400, 'Os conteúdos devem ser uma lista.');
    }

    return conteudos.map((item, indice) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
            throw new ErroApi(400, `Conteúdo inválido na posição ${indice + 1}.`);
        }

        const titulo = typeof item.titulo === 'string' ? item.titulo.trim() : '';
        if (titulo.length < 2) {
            throw new ErroApi(400, `Informe o título do conteúdo na posição ${indice + 1}.`);
        }

        const situacao = item.situacao || 'pendente';
        if (!SITUACOES_CONTEUDO.includes(situacao)) {
            throw new ErroApi(400, `Situação de conteúdo inválida: ${situacao}.`);
        }

        const ordem = item.ordem === undefined ? indice + 1 : Number(item.ordem);
        if (!Number.isInteger(ordem) || ordem < 1) {
            throw new ErroApi(400, `Ordem inválida no conteúdo "${titulo}".`);
        }

        const dificuldade = item.dificuldade === undefined || item.dificuldade === null || item.dificuldade === ''
            ? null
            : Number(item.dificuldade);
        if (dificuldade !== null && (!Number.isInteger(dificuldade) || dificuldade < 1 || dificuldade > 5)) {
            throw new ErroApi(400, `Dificuldade inválida no conteúdo "${titulo}".`);
        }

        const minutosEstimados = item.minutosEstimados === undefined || item.minutosEstimados === null || item.minutosEstimados === ''
            ? null
            : Number(item.minutosEstimados);
        if (minutosEstimados !== null && (!Number.isInteger(minutosEstimados) || minutosEstimados < 15)) {
            throw new ErroApi(400, `Minutos estimados inválidos no conteúdo "${titulo}".`);
        }

        return {
            ...(item.id && mongoose.isValidObjectId(item.id) ? { _id: item.id } : {}),
            titulo,
            dificuldade,
            situacao,
            ordem,
            minutosEstimados,
            concluidoEm: situacao === 'concluido'
                ? (item.concluidoEm ? new Date(item.concluidoEm) : new Date())
                : null,
        };
    });
}

function validarPayload(dados, parcial = false) {
    if (!dados || typeof dados !== 'object' || Array.isArray(dados)) {
        throw new ErroApi(400, 'Envie os dados da disciplina em formato JSON.');
    }

    const desconhecido = Object.keys(dados).find((campo) => !CAMPOS.includes(campo));
    if (desconhecido) {
        throw new ErroApi(400, `Campo não permitido: ${desconhecido}.`);
    }

    const bruto = selecionarCampos(dados, CAMPOS);
    const payload = Object.fromEntries(
        Object.entries(bruto).map(([campo, valor]) => [campo, limparVazio(valor)])
    );

    if (!parcial) {
        const ausente = CAMPOS_OBRIGATORIOS.find((campo) => !payload[campo]);
        if (ausente) {
            throw new ErroApi(400, `O campo "${ausente}" é obrigatório.`);
        }
    }

    if (payload.nome !== undefined) {
        if (typeof payload.nome !== 'string' || payload.nome.trim().length < 2 || payload.nome.trim().length > 120) {
            throw new ErroApi(400, 'O nome deve ter entre 2 e 120 caracteres.');
        }
        payload.nome = payload.nome.trim();
    }

    if (payload.area !== undefined) {
        if (typeof payload.area !== 'string' || payload.area.trim().length < 2 || payload.area.trim().length > 80) {
            throw new ErroApi(400, 'A área deve ter entre 2 e 80 caracteres.');
        }
        payload.area = payload.area.trim();
    }

    if (payload.professor !== undefined && payload.professor !== null) {
        if (typeof payload.professor !== 'string' || payload.professor.trim().length > 120) {
            throw new ErroApi(400, 'O nome do professor deve ter no máximo 120 caracteres.');
        }
        payload.professor = payload.professor.trim();
    }

    if (payload.local !== undefined && payload.local !== null) {
        if (typeof payload.local !== 'string' || payload.local.trim().length > 120) {
            throw new ErroApi(400, 'O local deve ter no máximo 120 caracteres.');
        }
        payload.local = payload.local.trim();
    }

    if (payload.creditos !== undefined && payload.creditos !== null) {
        payload.creditos = Number(payload.creditos);
        if (!Number.isInteger(payload.creditos) || payload.creditos < 1 || payload.creditos > 20) {
            throw new ErroApi(400, 'Os créditos devem ser um número inteiro entre 1 e 20.');
        }
    }

    if ('media' in payload) {
        if (payload.media === null) {
            payload.media = null;
        } else {
            payload.media = Number(payload.media);
            if (Number.isNaN(payload.media) || payload.media < 0 || payload.media > 10) {
                throw new ErroApi(400, 'A média desta disciplina deve ficar entre 0 e 10.');
            }
            payload.media = Math.round(payload.media * 10) / 10;
        }
    }

    for (const campo of ['peso', 'dificuldade']) {
        if (payload[campo] !== undefined && payload[campo] !== null) {
            payload[campo] = Number(payload[campo]);
            if (!Number.isInteger(payload[campo]) || payload[campo] < 1 || payload[campo] > 5) {
                throw new ErroApi(400, `O campo "${campo}" deve ser um número inteiro entre 1 e 5.`);
            }
        }
    }

    if (payload.cor !== undefined && !CORES_DISCIPLINA.includes(payload.cor)) {
        throw new ErroApi(400, 'Cor de disciplina inválida.');
    }

    if (payload.situacao !== undefined && !SITUACOES_DISCIPLINA.includes(payload.situacao)) {
        throw new ErroApi(400, 'Situação de disciplina inválida.');
    }

    if (payload.periodoLetivo !== undefined && payload.periodoLetivo !== null) {
        if (typeof payload.periodoLetivo !== 'string' || payload.periodoLetivo.trim().length > 20) {
            throw new ErroApi(400, 'O período letivo deve ter no máximo 20 caracteres.');
        }
        payload.periodoLetivo = payload.periodoLetivo.trim();
    }

    if ('conteudos' in payload) {
        payload.conteudos = validarConteudos(payload.conteudos);
    }

    return payload;
}

async function horasSemanaisPorDisciplina(usuarioId, disciplinaIds) {
    const blocos = await BlocoFixo.find({
        usuarioId,
        disciplinaId: { $in: disciplinaIds },
        recorrencia: 'semanal',
    }).select('disciplinaId duracaoMinutos diasSemana');

    const mapa = new Map(disciplinaIds.map((id) => [String(id), 0]));

    for (const bloco of blocos) {
        const chave = String(bloco.disciplinaId);
        const minutos = bloco.duracaoMinutos * (bloco.diasSemana?.length || 0);
        mapa.set(chave, (mapa.get(chave) || 0) + minutos);
    }

    return mapa;
}

function apresentar(disciplina, horasSemanaisMinutos = 0) {
    const json = disciplina.toJSON();
    const horas = Math.round((horasSemanaisMinutos / 60) * 10) / 10;

    return {
        ...json,
        horasSemanais: horas,
        progresso: progressoDosConteudos(disciplina.conteudos || []),
        totalConteudos: disciplina.conteudos?.length || 0,
        conteudosConcluidos: (disciplina.conteudos || []).filter((item) => item.situacao === 'concluido').length,
    };
}

export async function listar(usuarioId, { situacao } = {}) {
    const filtro = { usuarioId };
    if (situacao) {
        filtro.situacao = situacao;
    }

    const disciplinas = await Disciplina.find(filtro).sort({ nome: 1 });
    const horas = await horasSemanaisPorDisciplina(
        usuarioId,
        disciplinas.map((item) => item._id)
    );

    return disciplinas.map((disciplina) => apresentar(disciplina, horas.get(String(disciplina._id)) || 0));
}

export async function listarAtivasResumo(usuarioId) {
    const disciplinas = await Disciplina.find({ usuarioId, situacao: 'ativa' })
        .select('nome cor')
        .sort({ nome: 1 });

    return disciplinas.map((disciplina) => ({
        id: String(disciplina._id),
        nome: disciplina.nome,
        cor: disciplina.cor,
    }));
}

export async function buscarPorId(usuarioId, id) {
    idValido(id);
    const disciplina = await Disciplina.findOne({ _id: id, usuarioId });

    if (!disciplina) {
        throw new ErroApi(404, 'Disciplina não encontrada.');
    }

    const horas = await horasSemanaisPorDisciplina(usuarioId, [disciplina._id]);
    return apresentar(disciplina, horas.get(String(disciplina._id)) || 0);
}

export async function criar(usuarioId, dados) {
    const payload = validarPayload(dados);
    const disciplina = await Disciplina.create({
        ...payload,
        usuarioId,
        professor: payload.professor ?? null,
        local: payload.local ?? null,
        creditos: payload.creditos ?? null,
        periodoLetivo: payload.periodoLetivo ?? null,
        conteudos: payload.conteudos || [],
    });

    return apresentar(disciplina, 0);
}

export async function atualizar(usuarioId, id, dados) {
    idValido(id);
    const disciplina = await Disciplina.findOne({ _id: id, usuarioId });

    if (!disciplina) {
        throw new ErroApi(404, 'Disciplina não encontrada.');
    }

    const payload = validarPayload(dados, true);
    if (!Object.keys(payload).length) {
        throw new ErroApi(400, 'Informe ao menos um campo para atualizar.');
    }

    disciplina.set(payload);
    await disciplina.save();

    const horas = await horasSemanaisPorDisciplina(usuarioId, [disciplina._id]);
    return apresentar(disciplina, horas.get(String(disciplina._id)) || 0);
}

export async function excluir(usuarioId, id) {
    idValido(id);
    const disciplina = await Disciplina.findOneAndDelete({ _id: id, usuarioId });

    if (!disciplina) {
        throw new ErroApi(404, 'Disciplina não encontrada.');
    }

    // Remove o vínculo dos blocos; o compromisso em si permanece.
    await BlocoFixo.updateMany(
        { usuarioId, disciplinaId: id },
        { $set: { disciplinaId: null } }
    );
}
