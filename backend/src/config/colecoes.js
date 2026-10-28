/**
 * config/colecoes.js — Garante que as coleções do dicionário existam no MongoDB.
 *
 * No MongoDB a coleção só aparece depois do primeiro documento (ou createCollection).
 * Aqui importamos todos os models e chamamos createCollection + syncIndexes na subida,
 * para o Compass já listar disciplinas, tarefas, metas etc. mesmo vazias.
 */

import { Sessao } from '../modulos/auth/Sessao.js';
import { RecuperacaoSenha } from '../modulos/auth/RecuperacaoSenha.js';
import { Usuario } from '../modulos/usuarios/Usuario.js';
import { Disciplina } from '../modulos/disciplinas/Disciplina.js';
import { BlocoFixo } from '../modulos/blocosFixos/BlocoFixo.js';
import { Tarefa } from '../modulos/tarefas/Tarefa.js';
import { Meta } from '../modulos/metas/Meta.js';
import { SessaoEstudo } from '../modulos/sessoesEstudo/SessaoEstudo.js';
import { PlanoIa } from '../modulos/planosIa/PlanoIa.js';

const MODELS = [
    Usuario,
    Sessao,
    RecuperacaoSenha,
    Disciplina,
    BlocoFixo,
    Tarefa,
    Meta,
    SessaoEstudo,
    PlanoIa,
];

export async function garantirColecoes() {
    const nomes = [];

    for (const Model of MODELS) {
        try {
            await Model.createCollection();
        } catch (erro) {
            // 48 = NamespaceExists — a coleção já estava no banco.
            if (erro?.code !== 48 && erro?.codeName !== 'NamespaceExists') {
                throw erro;
            }
        }

        await Model.syncIndexes();
        nomes.push(Model.collection.collectionName);
    }

    return nomes;
}
