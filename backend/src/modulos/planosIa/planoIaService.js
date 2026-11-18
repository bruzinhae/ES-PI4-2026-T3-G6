import mongoose from 'mongoose';
import { ErroApi } from '../../utils/ErroApi.js';
import { criar as criarSessao } from '../sessoesEstudo/sessaoEstudoService.js';
import { PlanoIa, SITUACOES_PLANO_IA } from './PlanoIa.js';

export async function registrar(usuarioId, { inicioSemana, sugestoes, mensagem }) {
    if (!sugestoes?.length) return null;
    return PlanoIa.create({
        usuarioId,
        tipo: 'plano_semanal',
        inicioSemana: new Date(inicioSemana),
        situacao: 'pendente',
        mensagem: mensagem || 'Sugestões da grade para esta semana.',
        sessoesPropostas: sugestoes.map((sessao) => ({
            tarefaId: sessao.tarefaId || null,
            titulo: sessao.titulo,
            inicio: new Date(sessao.inicio),
            fim: new Date(sessao.fim),
        })),
        modelo: 'alocadora-java',
        versaoPrompt: '1',
    });
}

export function listar(usuarioId) {
    return PlanoIa.find({ usuarioId }).sort({ criadoEm: -1 }).limit(20);
}

export async function decidir(usuarioId, id, situacao) {
    if (!mongoose.isValidObjectId(id)) throw new ErroApi(400, 'ID de plano inválido.');
    if (!['aprovada', 'recusada'].includes(situacao) || !SITUACOES_PLANO_IA.includes(situacao)) {
        throw new ErroApi(400, 'A decisão deve ser aprovada ou recusada.');
    }
    const plano = await PlanoIa.findOne({ _id: id, usuarioId });
    if (!plano) throw new ErroApi(404, 'Plano não encontrado.');
    if (plano.situacao !== 'pendente') throw new ErroApi(409, 'Este plano já foi decidido.');

    const avisos = [];
    if (situacao === 'aprovada') {
        for (const sessao of plano.sessoesPropostas) {
            try {
                await criarSessao(usuarioId, {
                    titulo: sessao.titulo,
                    tarefaId: sessao.tarefaId,
                    disciplinaId: sessao.disciplinaId,
                    inicio: sessao.inicio,
                    fim: sessao.fim,
                    origem: 'ia',
                });
            } catch (erro) {
                avisos.push(erro.message || `Não foi possível gravar "${sessao.titulo}".`);
            }
        }
    }

    plano.situacao = situacao;
    plano.decididoEm = new Date();
    plano.avisos = avisos;
    await plano.save();
    return plano;
}
