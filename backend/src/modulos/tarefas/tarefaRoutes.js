import { Router } from 'express';
import { exigirAutenticacao } from '../../middlewares/autenticacao.js';
import * as controller from './tarefaController.js';

export const tarefaRoutes = Router();
tarefaRoutes.use(exigirAutenticacao);
tarefaRoutes.get('/', controller.listar);
tarefaRoutes.post('/', controller.criar);
tarefaRoutes.patch('/:id', controller.atualizar);
tarefaRoutes.delete('/:id', controller.excluir);
