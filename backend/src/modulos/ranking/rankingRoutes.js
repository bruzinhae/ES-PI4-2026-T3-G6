// Bernardo Alberto Amaro - 25015832
import { Router } from 'express';
import { exigirAutenticacao } from '../../middlewares/autenticacao.js';
import * as controller from './rankingController.js';

export const rankingRoutes = Router();

rankingRoutes.use(exigirAutenticacao);
rankingRoutes.post('/', controller.calcular);
