// Guilherme Domingues de Sousa - 22013871
import { ErroApi } from '../../utils/ErroApi.js';
import { DIA, MINUTO, chaveDoDia, dataValida, formatarISO, inicioDaSemana, instanteLocal } from '../../utils/fuso.js';
import { pedirRanking } from '../../servicos/clienteRanking.js';
import { CONFIGURACAO_PADRAO } from '../configuracoes/configuracaoService.js';
import { Disciplina } from '../disciplinas/Disciplina.js';
import { SessaoEstudo } from '../sessoesEstudo/SessaoEstudo.js';
import { Tarefa } from '../tarefas/Tarefa.js';
import { Usuario } from '../usuarios/Usuario.js';
import { registrar as registrarPlano } from '../planosIa/planoIaService.js';
import { ocupacoesDoPeriodo } from './ocupacao.js';

// A grade cobre a janela da noite (até 22:30) e o começo da manhã.
const JANELA_DO_DIA = { inicio: '06:00', fim: '23:00' };
// Máximo de sessões sugeridas por semana, conforme a rigidez escolhida pelo usuário.
const LIMITE_POR_RIGIDEZ = { flexivel: 4, equilibrado: 8, intensivo: 40 };
// Espaço livre menor que isso é descartado.
const MINUTOS_MINIMOS_DO_ESPACO = 15;
// Duração mínima e máxima (em minutos) de uma sessão que a API aceita gravar.
const DURACAO_MINIMA = 15;
const DURACAO_MAXIMA = 480;
// O instante atual é arredondado para cima de 5 em 5 minutos antes de abrir espaços.
const ARREDONDAMENTO = 5 * MINUTO;

// Início da semana pedida (AAAA-MM-DD) ou da semana atual, se nada for informado.
function resolverSemana(semana, agora) {
    if (semana === undefined) return inicioDaSemana(agora);
    if (!dataValida(semana)) throw new ErroApi(400, 'Informe a semana no formato AAAA-MM-DD.');
    return inicioDaSemana(instanteLocal(semana));
}

/**
 * Espaços livres da semana: a janela de cada dia menos as ocupações, só do instante atual em diante
 * e com pelo menos 15 minutos.
 */
function espacosLivres(ocupacoes, inicioSemana, agora) {
    const espacos = [];
    const piso = Math.ceil(agora / ARREDONDAMENTO) * ARREDONDAMENTO;

    const registrar = (inicio, fim) => {
        if (fim - inicio >= MINUTOS_MINIMOS_DO_ESPACO * MINUTO) {
            espacos.push({ id: `e${espacos.length + 1}`, inicio: formatarISO(inicio), fim: formatarISO(fim) });
        }
    };

    for (let dia = inicioSemana; dia < inicioSemana + 7 * DIA; dia += DIA) {
        const chave = chaveDoDia(dia);
        const fimDoDia = instanteLocal(chave, JANELA_DO_DIA.fim);
        let cursor = Math.max(instanteLocal(chave, JANELA_DO_DIA.inicio), piso);

        const doDia = ocupacoes
            .filter((ocupacao) => ocupacao.fim > cursor && ocupacao.inicio < fimDoDia)
            .sort((a, b) => a.inicio - b.inicio);

        for (const ocupacao of doDia) {
            if (ocupacao.inicio > cursor) registrar(cursor, Math.min(ocupacao.inicio, fimDoDia));
            cursor = Math.max(cursor, ocupacao.fim);
        }
        if (cursor < fimDoDia) registrar(cursor, fimDoDia);
    }

    return espacos;
}

// Preferências de estudo do usuário, completando o que falta com a configuração padrão.
function preferenciasDoUsuario(usuario) {
    const atual = usuario.configuracao?.toObject?.() || usuario.configuracao || {};
    const { janelaFoco, focoMatinal, duracaoMinutos, antifadiga, rigidez, ajusteDinamico, repeticaoEspacada } = { ...CONFIGURACAO_PADRAO, ...atual };
    return { janelaFoco, focoMatinal, duracaoMinutos, antifadiga, rigidez, ajusteDinamico, repeticaoEspacada };
}

// Tarefas abertas (de estudo e pessoais), já descontando o que está agendado em sessões futuras.
// paraRanking: tarefas no formato do servidor Java; detalhes: dados extras para mostrar na resposta.
async function tarefasParaRanking(usuarioId, preferencias, agora) {
    const [tarefas, sessoes] = await Promise.all([
        Tarefa.find({ usuarioId, situacao: { $ne: 'concluida' } }).lean(),
        SessaoEstudo.find({ usuarioId, situacao: 'agendada', tarefaId: { $ne: null }, fim: { $gt: new Date(agora) } }).select('tarefaId inicio fim').lean(),
    ]);

    // Minutos que cada tarefa já tem em sessões agendadas.
    const planejados = new Map();
    for (const sessao of sessoes) {
        const minutos = (sessao.fim - sessao.inicio) / MINUTO;
        planejados.set(String(sessao.tarefaId), (planejados.get(String(sessao.tarefaId)) || 0) + minutos);
    }

    const idsDisciplina = [...new Set(tarefas.map((tarefa) => tarefa.disciplinaId).filter(Boolean).map(String))];
    const disciplinas = idsDisciplina.length
        ? await Disciplina.find({ _id: { $in: idsDisciplina }, usuarioId }).select('nome dificuldade peso').lean()
        : [];
    const porDisciplina = new Map(disciplinas.map((disciplina) => [String(disciplina._id), disciplina]));
    const detalhes = new Map();

    // Para cada tarefa, calcula quanto ainda falta estudar; se nada falta, ela fica de fora.
    const paraRanking = tarefas.flatMap((tarefa) => {
        const id = String(tarefa._id);
        const falta = (tarefa.minutosEstimados ?? preferencias.duracaoMinutos) - (planejados.get(id) || 0);
        if (falta <= 0) return [];

        const disciplina = porDisciplina.get(String(tarefa.disciplinaId));
        detalhes.set(id, {
            titulo: tarefa.titulo,
            categoria: tarefa.categoria || 'estudos',
            tipo: tarefa.tipo || 'outro',
            etiqueta: tarefa.etiqueta || null,
            disciplina: disciplina?.nome || null,
            prazo: tarefa.prazo ? tarefa.prazo.toISOString() : null,
            local: tarefa.local || null,
            observacoes: tarefa.observacoes || null,
            prioridade: tarefa.prioridade ?? null,
            minutosEstimados: tarefa.minutosEstimados ?? null,
        });
        return [{
            id,
            titulo: tarefa.titulo, // só para mostrar na resposta; o servidor não usa
            categoria: tarefa.categoria,
            tipo: tarefa.tipo,
            prioridade: tarefa.prioridade,
            prazo: tarefa.prazo ? tarefa.prazo.toISOString() : null,
            minutosEstimados: Math.max(15, Math.round(falta)),
            situacao: 'pendente',
            ...(disciplina && { disciplina: { dificuldade: disciplina.dificuldade ?? null, peso: disciplina.peso ?? null } }),
        }];
    });

    return { paraRanking, detalhes };
}

// A API só grava sessões de 15 a 480 minutos. Uma sugestão maior vira blocos seguidos.
function fatiasValidas(sessao) {
    const inicioMs = Date.parse(sessao.inicio);
    const fimMs = Date.parse(sessao.fim);
    const restanteDepois = Number(sessao.minutosRestantes) || 0;
    const fatias = [];
    let cursor = inicioMs;

    while (fimMs - cursor >= DURACAO_MINIMA * MINUTO) {
        const minutos = Math.min(DURACAO_MAXIMA, Math.round((fimMs - cursor) / MINUTO));
        if (minutos < DURACAO_MINIMA) break;
        const termino = cursor + minutos * MINUTO;
        fatias.push({
            ...sessao,
            inicio: formatarISO(cursor),
            fim: formatarISO(termino),
            minutos,
            minutosRestantes: Math.max(0, Math.round((fimMs - termino) / MINUTO) + restanteDepois),
        });
        cursor = termino;
    }

    return fatias;
}

// ALTO, MEDIO ou BAIXO a partir do encaixe da sessão (tamanho e janela de foco).
function nivelDeFoco(encaixe) {
    if (encaixe >= 0.8) return 'ALTO';
    return encaixe >= 0.6 ? 'MEDIO' : 'BAIXO';
}

/**
 * Sugestões de estudo para a semana do usuário: monta os espaços livres (grade menos blocos fixos e sessões),
 * pede a alocação ao servidor Java e devolve as sessões sugeridas. Não grava nada.
 */
export async function sugerir(usuarioId, semana) {
    // 1) Descobre a semana e as preferências do usuário.
    const agora = Date.now();
    const inicioSemana = resolverSemana(semana, agora);
    const fimSemana = inicioSemana + 7 * DIA;

    const usuario = await Usuario.findById(usuarioId).select('configuracao');
    if (!usuario) throw new ErroApi(404, 'Usuário não encontrado.');
    const preferencias = preferenciasDoUsuario(usuario);

    // Ajuste dinâmico: sessões agendadas que já passaram viram "não realizadas", e o tempo volta para a fila.
    if (preferencias.ajusteDinamico !== false) {
        await SessaoEstudo.updateMany(
            { usuarioId, situacao: 'agendada', fim: { $lte: new Date(agora) } },
            { $set: { situacao: 'nao_realizada' } },
        );
    }

    // 2) Em paralelo: o que ocupa a grade (blocos fixos e sessões) e as tarefas que precisam de tempo.
    const [ocupacoes, preparo] = await Promise.all([
        ocupacoesDoPeriodo(usuarioId, inicioSemana, fimSemana),
        tarefasParaRanking(usuarioId, preferencias, agora),
    ]);
    const tarefas = preparo.paraRanking;
    const detalhes = preparo.detalhes;
    // 3) Os espaços livres são a janela do dia menos as ocupações.
    const espacos = espacosLivres(ocupacoes, inicioSemana, agora);
    const minutosLivres = espacos.reduce((soma, espaco) => soma + (Date.parse(espaco.fim) - Date.parse(espaco.inicio)) / MINUTO, 0);

    const resposta = {
        semana: { inicio: formatarISO(inicioSemana), fim: formatarISO(fimSemana) },
        geradoEm: formatarISO(agora),
        espacosLivres: espacos.length,
        minutosLivres,
        motivo: null,
        sugestoes: [],
        semAlocacao: [],
    };

    // Sem o que alocar ou onde alocar, não vale chamar o servidor Java.
    if (!tarefas.length || !espacos.length) {
        resposta.motivo = tarefas.length ? 'sem_espacos' : 'sem_tarefas';
        return resposta;
    }

    // 4) Pede ao servidor Java a alocação: ele escolhe a tarefa de cada espaço (ranking) e monta as sessões.
    const ranking = await pedirRanking({
        agora: formatarISO(agora),
        preferencias,
        limite: 1,
        alocar: true,
        espacos,
        tarefas,
    });

    // 5) Transforma a alocação em sugestões, respeitando o limite da rigidez.
    const limite = LIMITE_POR_RIGIDEZ[preferencias.rigidez] || LIMITE_POR_RIGIDEZ.equilibrado;
    const ficha = (tarefaId) => detalhes.get(tarefaId) || { titulo: 'Atividade' };
    resposta.sugestoes = (ranking.alocacao || []).slice(0, limite).flatMap((sessao) => fatiasValidas({
        ...ficha(sessao.tarefaId),
        tarefaId: sessao.tarefaId,
        inicio: sessao.inicio,
        fim: sessao.fim,
        minutos: sessao.minutos,
        minutosRestantes: sessao.minutosRestantes,
        nota: sessao.nota,
        foco: nivelDeFoco(sessao.composicao.encaixe),
        composicao: sessao.composicao,
    }));
    // Tarefas que não couberam (ou couberam só em parte) e o motivo.
    resposta.semAlocacao = (ranking.semAlocacao || []).map((item) => ({
        ...ficha(item.tarefaId),
        tarefaId: item.tarefaId,
        motivo: item.motivo,
        minutosRestantes: item.minutosRestantes,
    }));
    if (ranking.alocacaoTruncada) resposta.alocacaoTruncada = true;

    // 6) Guarda um plano da IA com as sugestões, para o usuário aceitar ou recusar depois.
    if (resposta.sugestoes.length) {
        const plano = await registrarPlano(usuarioId, {
            inicioSemana,
            sugestoes: resposta.sugestoes,
            mensagem: `${resposta.sugestoes.length} sessão(ões) sugeridas para a semana.`,
        });
        resposta.planoId = plano ? String(plano._id) : null;
    }

    return resposta;
}
