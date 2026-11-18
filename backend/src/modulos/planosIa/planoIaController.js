import * as planoIaService from './planoIaService.js';

export async function listar(req, res) {
    const planos = await planoIaService.listar(req.usuario._id);
    res.json({ planos });
}

export async function decidir(req, res) {
    const plano = await planoIaService.decidir(req.usuario._id, req.params.id, req.body?.situacao);
    res.json({ plano });
}
