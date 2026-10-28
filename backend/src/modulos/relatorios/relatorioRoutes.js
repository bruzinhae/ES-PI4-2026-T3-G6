import { Router } from 'express';
import { exigirAutenticacao } from '../../middlewares/autenticacao.js';
import * as controller from './relatorioController.js';

export const relatorioRoutes = Router();

relatorioRoutes.use(exigirAutenticacao);
relatorioRoutes.get('/', controller.obter);
