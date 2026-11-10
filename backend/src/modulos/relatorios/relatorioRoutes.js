import { Router } from 'express';
import { exigirAutenticacao } from '../../middlewares/autenticacao.js';
import * as controller from './relatorioController.js';

export const relatorioRoutes = Router();

relatorioRoutes.use(exigirAutenticacao);
relatorioRoutes.get('/', controller.obter);
relatorioRoutes.get('/sofia/conversa', controller.listarConversa);
relatorioRoutes.post('/sofia/conversa/abrir', controller.abrirConversa);
relatorioRoutes.post('/sofia/conversa', controller.enviarConversa);
relatorioRoutes.get('/sofia', controller.sofia);
