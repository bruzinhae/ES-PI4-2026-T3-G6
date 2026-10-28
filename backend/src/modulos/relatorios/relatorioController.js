import * as service from './relatorioService.js';

// GET /api/relatorios?inicio=AAAA-MM-DD — semana que contém a data (padrão: semana atual).
export async function obter(req, res) {
    const relatorio = await service.montarRelatorio(req.usuario._id, req.query.inicio);
    res.json({ relatorio });
}
