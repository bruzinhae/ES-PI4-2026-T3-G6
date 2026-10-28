/**
 * app.js — CONFIGURAÇÃO DO EXPRESS (middlewares e rotas).
 *
 * O Express é o framework que recebe as requisições HTTP e decide qual código responde
 * cada uma. Aqui montamos a "esteira" pela qual toda requisição passa, NA ORDEM em que
 * os `app.use`/`app.get` aparecem:
 *
 *   requisição → CORS → leitura do JSON → rotas da API → páginas do site → 404 → tratamento de erros
 *
 * Este arquivo não abre porta nem conecta no banco (isso é papel do server.js); ele só
 * exporta o `app` pronto.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { rotaNaoEncontrada, tratarErros } from './middlewares/tratarErros.js';
import { authRoutes } from './modulos/auth/authRoutes.js';
import { PASTA_AVATARES } from './modulos/usuarios/avatarArquivo.js';
import { usuarioRoutes } from './modulos/usuarios/usuarioRoutes.js';
import { blocoFixoRoutes } from './modulos/blocosFixos/blocoFixoRoutes.js';
import { disciplinaRoutes } from './modulos/disciplinas/disciplinaRoutes.js';

// Pasta frontend/ na raiz do repositório (backend/src → sobe duas pastas).
const pastaFrontend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../frontend');

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

// Fotos de perfil enviadas pelo usuário. O <img> do frontend pede o arquivo direto,
// sem o token, por isso esta pasta é pública. O nome do arquivo é o id do usuário.
app.use('/uploads/avatares', express.static(PASTA_AVATARES, {
    index: false,
    dotfiles: 'deny',
}));

// Health check ("checagem de saúde"): rota simples para saber se a API está no ar,
// sem tocar no banco. Útil para testar rapidamente: `curl http://localhost:3001/api/saude`.
app.get('/api/saude', (_req, res) => {
    res.json({ status: 'ok' });
});

// Todas as URLs que começam com /api/usuarios são repassadas para o roteador de usuários
// (modulos/usuarios/usuarioRoutes.js), que cuida do resto do caminho (/, /:id, ...).
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/blocos-fixos', blocoFixoRoutes);
app.use('/api/disciplinas', disciplinaRoutes);

// /api/auth: login, logout e consulta da sessão atual (modulos/auth/authRoutes.js).
app.use('/api/auth', authRoutes);

// Páginas do site (HTML, CSS, JS). Fica depois das rotas /api para um arquivo
// estático nunca esconder um endpoint. A raiz (/) abre o index.html da plataforma.
app.use(express.static(pastaFrontend));

// Estes dois precisam ficar POR ÚLTIMO:
// - rotaNaoEncontrada: só é alcançado se nenhuma rota acima respondeu → gera um 404.
// - tratarErros: middleware de erro (tem 4 parâmetros); recebe qualquer erro lançado
//   nas rotas e transforma numa resposta JSON padronizada { mensagem }.
app.use(rotaNaoEncontrada);
app.use(tratarErros);
