// Bernardo Alberto Amaro - 25015832
import { pedirRanking } from '../../servicos/clienteRanking.js';

export async function calcular(req, res) {
    res.json(await pedirRanking(req.body));
}
