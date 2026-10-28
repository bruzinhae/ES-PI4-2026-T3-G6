import { Router } from 'express';
import { exigirAutenticacao } from '../../middlewares/autenticacao.js';
import { listarAtivasDoUsuario } from './disciplinaController.js';

export const disciplinaRoutes = Router();
disciplinaRoutes.get('/', exigirAutenticacao, listarAtivasDoUsuario);
