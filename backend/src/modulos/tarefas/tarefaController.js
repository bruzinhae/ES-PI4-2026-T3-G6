import * as service from './tarefaService.js';

export async function listar(req, res) {
    const tarefas = await service.listar(req.usuario._id);
    res.json({ tarefas });
}

export async function criar(req, res) {
    const tarefa = await service.criar(req.usuario._id, req.body);
    res.status(201).json({ tarefa });
}

export async function atualizar(req, res) {
    const tarefa = await service.atualizar(req.usuario._id, req.params.id, req.body);
    res.json({ tarefa });
}

export async function excluir(req, res) {
    await service.excluir(req.usuario._id, req.params.id);
    res.status(204).end();
}
