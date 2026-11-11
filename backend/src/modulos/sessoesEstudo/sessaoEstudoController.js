import * as service from './sessaoEstudoService.js';

// POST /api/sessoes-estudo/pomodoro — grava um bloco de foco do Pomodoro.
export async function registrarPomodoro(req, res) {
    const sessao = await service.registrarPomodoro(req.usuario._id, req.body);
    res.status(201).json({ sessao });
}
