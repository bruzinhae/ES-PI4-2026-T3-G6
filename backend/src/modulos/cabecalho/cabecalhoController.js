import * as service from './cabecalhoService.js';

// GET /api/cabecalho — progresso de tarefas e avisos do usuário logado.
export async function obter(req, res) {
    const cabecalho = await service.montarCabecalho(req.usuario._id);
    res.json({ cabecalho });
}
