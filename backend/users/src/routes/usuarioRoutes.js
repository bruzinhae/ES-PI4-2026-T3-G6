/**
 * routes/usuarioRoutes.js — MAPA DAS URLs de usuários.
 *
 * Liga cada combinação MÉTODO HTTP + CAMINHO a uma função do controller.
 * Este roteador é montado no app.js em '/api/usuarios', então os caminhos abaixo são
 * relativos a ele: '/' vira /api/usuarios e '/:id' vira /api/usuarios/<id>.
 *
 * `:id` é um parâmetro de rota: o valor que vier na URL fica disponível em `req.params.id`.
 *
 * Os métodos seguem a convenção REST para um CRUD:
 *   POST   = Create (criar)       GET   = Read (ler)
 *   PATCH  = Update (atualizar só os campos enviados)
 *   DELETE = Delete (excluir)
 */

import { Router } from 'express';
import * as controller from '../controllers/usuarioController.js';

export const usuarioRoutes = Router();

usuarioRoutes.post('/', controller.criar);              // POST   /api/usuarios      → cria conta (tela "Criar Nova Conta")
usuarioRoutes.get('/', controller.listar);              // GET    /api/usuarios      → lista todos os usuários
usuarioRoutes.get('/:id', controller.buscarPorId);      // GET    /api/usuarios/:id  → busca um usuário (tela de perfil)
usuarioRoutes.patch('/:id', controller.atualizar);      // PATCH  /api/usuarios/:id  → altera dados do perfil e/ou senha
usuarioRoutes.delete('/:id', controller.excluir);       // DELETE /api/usuarios/:id  → exclui a conta
