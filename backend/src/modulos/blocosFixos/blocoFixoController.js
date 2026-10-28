import * as service from './blocoFixoService.js';
export async function listar(req, res) { res.json({ blocos: await service.listar(req.usuario._id) }); }
export async function buscarPorId(req, res) { res.json({ bloco: await service.buscarPorId(req.usuario._id, req.params.id) }); }
export async function criar(req, res) { res.status(201).json({ bloco: await service.criar(req.usuario._id, req.body) }); }
export async function atualizar(req, res) { res.json({ bloco: await service.atualizar(req.usuario._id, req.params.id, req.body) }); }
export async function excluir(req, res) { await service.excluir(req.usuario._id, req.params.id); res.status(204).end(); }
