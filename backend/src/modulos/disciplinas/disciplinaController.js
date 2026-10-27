import { Disciplina } from './Disciplina.js';

export async function listarAtivasDoUsuario(req, res) {
    const disciplinas = await Disciplina.find({ usuarioId: req.usuario._id, situacao: 'ativa' })
        .select('_id nome')
        .sort({ nome: 1 })
        .lean();
    res.json({ disciplinas });
}
