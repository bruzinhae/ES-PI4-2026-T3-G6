import { Router } from 'express';
import { exigirAutenticacao } from '../../middlewares/autenticacao.js';
import * as controller from './sessaoEstudoController.js';

export const sessaoEstudoRoutes = Router();

sessaoEstudoRoutes.use(exigirAutenticacao);
sessaoEstudoRoutes.post('/pomodoro', controller.registrarPomodoro);
