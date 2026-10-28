/**
 * canvas/canvasController.js — camada HTTP de /api/canvas.
 */

import { env } from '../../config/env.js';
import * as service from './canvasService.js';

export async function obter(req, res) {
    res.json({ conexao: await service.obter(req.usuario._id) });
}

export async function conectar(req, res) {
    res.json(await service.conectarComToken(req.usuario._id, req.body));
}

export async function oauth(req, res) {
    res.json({ url: service.urlDeAutorizacao(req.usuario._id) });
}

export async function retorno(req, res) {
    const destino = `${env.frontendUrl}/index_configuracoes.html`;
    try {
        if (req.query.error) {
            res.redirect(`${destino}?canvas=recusado`);
            return;
        }
        await service.concluirOauth(req.query.code, req.query.state);
        res.redirect(`${destino}?canvas=conectado`);
    } catch {
        res.redirect(`${destino}?canvas=falhou`);
    }
}

export async function sincronizar(req, res) {
    res.json(await service.sincronizar(req.usuario._id));
}

export async function desconectar(req, res) {
    res.json({ conexao: await service.desconectar(req.usuario._id) });
}
