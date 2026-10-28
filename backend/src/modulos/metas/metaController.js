/**
 * metas/metaController.js — camada HTTP de /api/metas.
 */

import * as service from './metaService.js';

export async function listar(req, res) {
    const situacao = typeof req.query.situacao === 'string' && req.query.situacao
        ? req.query.situacao
        : undefined;
    const resultado = await service.listar(req.usuario._id, { situacao });
    res.json(resultado);
}

export async function buscarPorId(req, res) {
    const meta = await service.buscarPorId(req.usuario._id, req.params.id);
    res.json({ meta });
}

export async function criar(req, res) {
    const meta = await service.criar(req.usuario._id, req.body);
    res.status(201).json({ meta });
}

export async function atualizar(req, res) {
    const meta = await service.atualizar(req.usuario._id, req.params.id, req.body);
    res.json({ meta });
}

export async function excluir(req, res) {
    await service.excluir(req.usuario._id, req.params.id);
    res.status(204).end();
}
