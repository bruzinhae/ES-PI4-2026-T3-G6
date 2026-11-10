import * as service from './relatorioService.js';
import * as sofiaService from './sofiaService.js';

// GET /api/relatorios?inicio=AAAA-MM-DD — semana que contém a data (padrão: semana atual).
export async function obter(req, res) {
    const relatorio = await service.montarRelatorio(req.usuario._id, req.query.inicio);
    res.json({ relatorio });
}

// GET /api/relatorios/sofia/conversa?inicio=AAAA-MM-DD — conversa já salva, sem chamar a Sofia.
export async function listarConversa(req, res) {
    const conversa = await sofiaService.listarConversa(req.usuario._id, req.query.inicio);
    res.json({ conversa });
}

// POST /api/relatorios/sofia/conversa/abrir?inicio=AAAA-MM-DD — grava a análise da semana.
export async function abrirConversa(req, res) {
    const conversa = await sofiaService.abrirConversa(req.usuario._id, req.query.inicio);
    res.json({ conversa });
}

// POST /api/relatorios/sofia/conversa — continua a conversa da semana do usuário logado.
export async function enviarConversa(req, res) {
    const conversa = await sofiaService.enviarMensagem(
        req.usuario._id,
        req.body?.inicio,
        req.body?.texto,
    );
    res.json({ conversa });
}

// GET /api/relatorios/sofia?inicio=AAAA-MM-DD — leitura da rotina e do aproveitamento.
export async function sofia(req, res) {
    const sugestoes = await sofiaService.obterSugestoes(req.usuario._id, req.query.inicio);
    res.json({ sofia: sugestoes });
}
