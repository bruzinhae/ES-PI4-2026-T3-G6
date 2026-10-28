/**
 * disciplinas/disciplinaController.js — camada HTTP de /api/disciplinas.
 */

import * as service from './disciplinaService.js';

// GET /api/disciplinas — lista completa (com progresso e horas). ?situacao=ativa filtra.
export async function listar(req, res) {
    const disciplinas = await service.listar(req.usuario._id, {
        situacao: typeof req.query.situacao === 'string' ? req.query.situacao : undefined,
    });
    res.json({ disciplinas });
}

// GET /api/disciplinas/ativas — resumo para selects (id, nome, cor).
export async function listarAtivas(req, res) {
    const disciplinas = await service.listarAtivasResumo(req.usuario._id);
    res.json({ disciplinas });
}

export async function buscarPorId(req, res) {
    const disciplina = await service.buscarPorId(req.usuario._id, req.params.id);
    res.json({ disciplina });
}

export async function criar(req, res) {
    const disciplina = await service.criar(req.usuario._id, req.body);
    res.status(201).json({ disciplina });
}

export async function atualizar(req, res) {
    const disciplina = await service.atualizar(req.usuario._id, req.params.id, req.body);
    res.json({ disciplina });
}

export async function excluir(req, res) {
    await service.excluir(req.usuario._id, req.params.id);
    res.status(204).end();
}
