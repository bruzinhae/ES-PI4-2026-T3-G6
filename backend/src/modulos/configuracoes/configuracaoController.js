/**
 * configuracoes/configuracaoController.js — camada HTTP de /api/configuracoes.
 */

import * as service from './configuracaoService.js';

export async function obter(req, res) {
    const resultado = await service.obter(req.usuario._id);
    res.json(resultado);
}

export async function salvar(req, res) {
    const resultado = await service.salvar(req.usuario._id, req.body?.configuracao || req.body);
    res.json(resultado);
}
