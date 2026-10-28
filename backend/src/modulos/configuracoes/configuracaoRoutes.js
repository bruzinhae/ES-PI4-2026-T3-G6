/**
 * configuracoes/configuracaoRoutes.js — URLs de /api/configuracoes.
 */

import { Router } from 'express';
import { exigirAutenticacao } from '../../middlewares/autenticacao.js';
import * as controller from './configuracaoController.js';

export const configuracaoRoutes = Router();

configuracaoRoutes.use(exigirAutenticacao);
configuracaoRoutes.get('/', controller.obter);
configuracaoRoutes.patch('/', controller.salvar);
