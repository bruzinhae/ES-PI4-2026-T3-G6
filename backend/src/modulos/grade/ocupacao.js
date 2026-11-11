import { BlocoFixo } from '../blocosFixos/BlocoFixo.js';
import { SessaoEstudo } from '../sessoesEstudo/SessaoEstudo.js';
import { DIA, MINUTO, chaveDoDia, diaDaSemana, inicioDoDia, instanteLocal } from '../../utils/fuso.js';

// Sessões que ocupam horário na agenda (as canceladas e não realizadas liberam o horário).
const SITUACOES_QUE_OCUPAM = ['agendada', 'concluida'];
const INTERVALO_SEMANAS = { semanal: 1, quinzenal: 2, a_cada_3_semanas: 3 };

function blocoRecorrenteNaData(bloco, dia) {
    const intervalo = INTERVALO_SEMANAS[bloco.recorrencia];
    if (!intervalo || !bloco.diasSemana.includes(diaDaSemana(dia))) return false;
    const criado = new Date(bloco.inicioRecorrencia || bloco.criadoEm || 0);
    const inicio = new Date(Date.UTC(criado.getUTCFullYear(), criado.getUTCMonth(), criado.getUTCDate()));
    inicio.setUTCDate(inicio.getUTCDate() - ((inicio.getUTCDay() + 6) % 7));
    const data = new Date(dia);
    data.setUTCHours(0, 0, 0, 0);
    const semana = Math.floor((data.getTime() - inicio.getTime()) / (7 * DIA));
    return semana >= 0 && semana % intervalo === 0;
}

/**
 * Intervalos ocupados do usuário entre `de` e `ate` (milissegundos): blocos fixos (semanais e únicos,
 * já expandidos nas datas do período) e sessões de estudo.
 */
export async function ocupacoesDoPeriodo(usuarioId, de, ate, { ignorarSessaoId = null } = {}) {
    const [blocos, sessoes] = await Promise.all([
        BlocoFixo.find({ usuarioId }).lean(),
        SessaoEstudo.find({
            usuarioId,
            situacao: { $in: SITUACOES_QUE_OCUPAM },
            inicio: { $lt: new Date(ate) },
            fim: { $gt: new Date(de) },
            ...(ignorarSessaoId && { _id: { $ne: ignorarSessaoId } }),
        }).lean(),
    ]);

    const ocupacoes = [];

    for (let dia = inicioDoDia(de); dia < ate; dia += DIA) {
        const chave = chaveDoDia(dia);

        for (const bloco of blocos) {
            const cai = INTERVALO_SEMANAS[bloco.recorrencia]
                ? blocoRecorrenteNaData(bloco, dia)
                : bloco.data && bloco.data.toISOString().slice(0, 10) === chave;
            if (!cai) continue;

            const inicio = instanteLocal(chave, bloco.horaInicio);
            ocupacoes.push({ tipo: 'bloco', titulo: bloco.nome, inicio, fim: inicio + bloco.duracaoMinutos * MINUTO });
        }
    }

    for (const sessao of sessoes) {
        ocupacoes.push({ tipo: 'sessao', id: String(sessao._id), titulo: sessao.titulo, inicio: sessao.inicio.getTime(), fim: sessao.fim.getTime() });
    }

    return ocupacoes.filter((ocupacao) => ocupacao.fim > de && ocupacao.inicio < ate);
}

// Primeira ocupação que se sobrepõe ao intervalo, ou undefined.
export function conflitoCom(ocupacoes, inicio, fim) {
    return ocupacoes.find((ocupacao) => ocupacao.inicio < fim && ocupacao.fim > inicio);
}
