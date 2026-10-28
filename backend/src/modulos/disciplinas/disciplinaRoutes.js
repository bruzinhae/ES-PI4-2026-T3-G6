/**
 * disciplinas/disciplinaRoutes.js — URLs de /api/disciplinas.
 */

import { Router } from 'express';
import { exigirAutenticacao } from '../../middlewares/autenticacao.js';
import * as controller from './disciplinaController.js';

export const disciplinaRoutes = Router();

disciplinaRoutes.use(exigirAutenticacao);

disciplinaRoutes.get('/', controller.listar);
disciplinaRoutes.get('/ativas', controller.listarAtivas);
disciplinaRoutes.post('/', controller.criar);
disciplinaRoutes.get('/:id', controller.buscarPorId);
disciplinaRoutes.patch('/:id', controller.atualizar);
disciplinaRoutes.delete('/:id', controller.excluir);
