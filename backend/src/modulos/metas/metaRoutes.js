/**
 * metas/metaRoutes.js — URLs de /api/metas.
 */

import { Router } from 'express';
import { exigirAutenticacao } from '../../middlewares/autenticacao.js';
import * as controller from './metaController.js';

export const metaRoutes = Router();

metaRoutes.use(exigirAutenticacao);

metaRoutes.get('/', controller.listar);
metaRoutes.post('/', controller.criar);
metaRoutes.get('/:id', controller.buscarPorId);
metaRoutes.patch('/:id', controller.atualizar);
metaRoutes.delete('/:id', controller.excluir);
