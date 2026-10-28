/**
 * canvas/canvasRoutes.js — URLs de /api/canvas.
 * A volta do OAuth é pública: o Canvas redireciona o navegador sem o token da sessão.
 */

import { Router } from 'express';
import { exigirAutenticacao } from '../../middlewares/autenticacao.js';
import * as controller from './canvasController.js';

export const canvasRoutes = Router();

canvasRoutes.get('/retorno', controller.retorno);

canvasRoutes.use(exigirAutenticacao);
canvasRoutes.get('/', controller.obter);
canvasRoutes.post('/conectar', controller.conectar);
canvasRoutes.get('/oauth', controller.oauth);
canvasRoutes.post('/sincronizar', controller.sincronizar);
canvasRoutes.delete('/', controller.desconectar);
