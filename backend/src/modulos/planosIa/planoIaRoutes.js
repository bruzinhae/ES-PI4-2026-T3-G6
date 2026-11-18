import { Router } from 'express';
import { exigirAutenticacao } from '../../middlewares/autenticacao.js';
import * as controller from './planoIaController.js';

export const planoIaRoutes = Router();

planoIaRoutes.use(exigirAutenticacao);
planoIaRoutes.get('/', controller.listar);
planoIaRoutes.post('/:id/decidir', controller.decidir);
