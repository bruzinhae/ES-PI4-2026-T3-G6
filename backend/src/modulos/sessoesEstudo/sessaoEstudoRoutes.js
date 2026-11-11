import { Router } from 'express';
import { exigirAutenticacao } from '../../middlewares/autenticacao.js';
import * as controller from './sessaoEstudoController.js';

export const sessaoEstudoRoutes = Router();

sessaoEstudoRoutes.use(exigirAutenticacao);
sessaoEstudoRoutes.get('/', controller.listar);
sessaoEstudoRoutes.post('/', controller.criar);
sessaoEstudoRoutes.post('/pomodoro', controller.registrarPomodoro);
sessaoEstudoRoutes.patch('/:id', controller.atualizar);
sessaoEstudoRoutes.delete('/:id', controller.excluir);
