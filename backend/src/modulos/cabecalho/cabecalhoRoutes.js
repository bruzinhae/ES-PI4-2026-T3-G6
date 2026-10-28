import { Router } from 'express';
import { exigirAutenticacao } from '../../middlewares/autenticacao.js';
import * as controller from './cabecalhoController.js';

export const cabecalhoRoutes = Router();

cabecalhoRoutes.use(exigirAutenticacao);
cabecalhoRoutes.get('/', controller.obter);
