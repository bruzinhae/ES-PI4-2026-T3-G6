import * as service from './cabecalhoService.js';

// GET /api/cabecalho — rotina da semana sobre a meta de horas e avisos do usuário logado.
export async function obter(req, res) {
    const cabecalho = await service.montarCabecalho(req.usuario._id);
    res.json({ cabecalho });
}
