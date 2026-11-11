import * as service from './sessaoEstudoService.js';

// POST /api/sessoes-estudo/pomodoro — grava um bloco de foco do Pomodoro.
export async function listar(req, res) {
    const sessoes = await service.listar(req.usuario._id, req.query);
    res.json({ sessoes });
}

export async function criar(req, res) {
    const sessao = await service.criar(req.usuario._id, req.body);
    res.status(201).json({ sessao });
}

export async function atualizar(req, res) {
    const sessao = await service.atualizar(req.usuario._id, req.params.id, req.body);
    res.json({ sessao });
}

export async function excluir(req, res) {
    await service.excluir(req.usuario._id, req.params.id);
    res.status(204).end();
}

export async function registrarPomodoro(req, res) {
    const sessao = await service.registrarPomodoro(req.usuario._id, req.body);
    res.status(201).json({ sessao });
}
