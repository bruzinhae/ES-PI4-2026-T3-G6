import * as service from './gradeService.js';

export async function sugerir(req, res) {
    res.json(await service.sugerir(req.usuario._id, req.query.semana));
}
