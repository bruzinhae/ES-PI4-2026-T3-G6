import { Router } from 'express';
import { exigirAutenticacao } from '../../middlewares/autenticacao.js';
import * as controller from './gradeController.js';

export const gradeRoutes = Router();

gradeRoutes.use(exigirAutenticacao);
gradeRoutes.get('/sugestoes', controller.sugerir);
