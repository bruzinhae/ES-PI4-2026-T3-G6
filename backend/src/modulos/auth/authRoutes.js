/**
 * auth/authRoutes.js — MAPA DAS URLs de autenticação (montado em /api/auth no app.js).
 */

import { Router } from 'express';
import * as controller from './authController.js';
import { exigirAutenticacao } from '../../middlewares/autenticacao.js';

export const authRoutes = Router();

authRoutes.post('/login', controller.entrar);                         // POST /api/auth/login  → e-mail + senha → token
authRoutes.post('/logout', exigirAutenticacao, controller.sair);      // POST /api/auth/logout → encerra a sessão atual
authRoutes.get('/eu', exigirAutenticacao, controller.eu);             // GET  /api/auth/eu     → usuário da sessão
