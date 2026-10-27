/**
 * app.js — CONFIGURAÇÃO DO EXPRESS (middlewares e rotas).
 *
 * O Express é o framework que recebe as requisições HTTP e decide qual código responde
 * cada uma. Aqui montamos a "esteira" pela qual toda requisição passa, NA ORDEM em que
 * os `app.use`/`app.get` aparecem:
 *
 *   requisição → CORS → leitura do JSON → rotas → 404 (se nenhuma rota respondeu) → tratamento de erros
 *
 * Este arquivo não abre porta nem conecta no banco (isso é papel do server.js); ele só
 * exporta o `app` pronto.
 */

import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { rotaNaoEncontrada, tratarErros } from './middlewares/tratarErros.js';
import { authRoutes } from './modulos/auth/authRoutes.js';
import { usuarioRoutes } from './modulos/usuarios/usuarioRoutes.js';

export const app = express();

// CORS (Cross-Origin Resource Sharing): o navegador bloqueia, por segurança, chamadas de uma
// página (ex.: Live Server em http://127.0.0.1:5500) para outro endereço (http://localhost:3001).
// Este middleware adiciona os cabeçalhos que dizem ao navegador "pode deixar, esta origem é permitida".
//   - CORS_ORIGIN="*"  → `origin: true` libera qualquer origem (prático em desenvolvimento);
//   - CORS_ORIGIN="http://a.com,http://b.com" → libera só essas origens (vira uma lista).
app.use(cors({
    origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(',').map((origem) => origem.trim()),
}));

// Lê o corpo das requisições com Content-Type: application/json e coloca o resultado em `req.body`.
// O limite de 100kb evita que alguém mande um corpo gigante para travar/encher a memória do servidor
// (um cadastro de usuário nunca chega perto disso).
app.use(express.json({ limit: '100kb' }));

// Health check ("checagem de saúde"): rota simples para saber se a API está no ar,
// sem tocar no banco. Útil para testar rapidamente: `curl http://localhost:3001/api/saude`.
app.get('/api/saude', (_req, res) => {
    res.json({ status: 'ok' });
});

// Todas as URLs que começam com /api/usuarios são repassadas para o roteador de usuários
// (modulos/usuarios/usuarioRoutes.js), que cuida do resto do caminho (/, /:id, ...).
app.use('/api/usuarios', usuarioRoutes);

// /api/auth: login, logout e consulta da sessão atual (modulos/auth/authRoutes.js).
app.use('/api/auth', authRoutes);

// Estes dois precisam ficar POR ÚLTIMO:
// - rotaNaoEncontrada: só é alcançado se nenhuma rota acima respondeu → gera um 404.
// - tratarErros: middleware de erro (tem 4 parâmetros); recebe qualquer erro lançado
//   nas rotas e transforma numa resposta JSON padronizada { mensagem }.
app.use(rotaNaoEncontrada);
app.use(tratarErros);
