import net from 'node:net';
import { env } from '../config/env.js';
import { ErroApi } from '../utils/ErroApi.js';
import { EscritorJava, FaltamBytes, LeitorJava } from './serializacaoJava.js';

const TAMANHO_MAXIMO = 2_000_000;
const MAXIMO_DE_ITENS = 2000;
const MAXIMO_DE_METAS = 200;
const LIMITE_PADRAO = 10;
const JANELAS_DE_FOCO = ['manha', 'tarde', 'noite'];
const CATEGORIAS = ['estudos', 'pessoal'];
const MARCOS_PADRAO = 3;
const FORMATO_DA_DATA = '2026-10-27T09:00:00-03:00';
const FUSO_PADRAO = -3 * 3600;

/**
 * Cliente do servidor Java (servidor/). Fala o protocolo do Fazedor de Continhas: o pedido e a resposta são
 * objetos Java serializados (ver serializacaoJava.js). Este arquivo transforma o pedido em JSON que o resto do
 * backend monta (datas em ISO-8601 com fuso) nos comunicados do servidor, e a resposta nos mesmos objetos
 * JSON de antes, para que as rotas e a grade não precisem saber do formato.
 */

// ------------------------------------------------------------------------------------------- datas

const DATA_ISO = /^(\d{4})-(\d{2})-(\d{2})[Tt](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{0,9}))?)?(?:[Zz]|([+-])(\d{2})(?::(\d{2})(?::(\d{2}))?)?)$/;

const bissexto = (ano) => ano % 4 === 0 && (ano % 100 !== 0 || ano % 400 === 0);

function diasDoMes(ano, mes) {
  if (mes === 2) return bissexto(ano) ? 29 : 28;
  return [4, 6, 9, 11].includes(mes) ? 30 : 31;
}

// Dias desde 1970-01-01 até a data (calendário gregoriano).
function diaDaEpoca(ano, mes, dia) {
  const y = mes <= 2 ? ano - 1 : ano;
  const era = Math.floor(y / 400);
  const yoe = y - era * 400;
  const doy = Math.floor((153 * (mes + (mes > 2 ? -3 : 9)) + 2) / 5) + dia - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

function dataDoDia(diaDaEpocaLocal) {
  const z = diaDaEpocaLocal + 719468;
  const era = Math.floor(z / 146097);
  const doe = z - era * 146097;
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const dia = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const mes = mp < 10 ? mp + 3 : mp - 9;
  const ano = yoe + era * 400 + (mes <= 2 ? 1 : 0);
  return { ano, mes, dia };
}

const preencher = (valor, tamanho) => String(valor).padStart(tamanho, '0');

/** ISO-8601 com fuso → { segundos, nanos, deslocamento }, ou null se não estiver no formato ou a data não existir. */
export function lerDataHora(texto) {
  const m = DATA_ISO.exec(texto);
  if (!m) return null;

  const [ano, mes, dia, hora, minuto] = [m[1], m[2], m[3], m[4], m[5]].map(Number);
  const segundo = m[6] === undefined ? 0 : Number(m[6]);
  const nanos = m[7] === undefined || m[7] === '' ? 0 : Number(m[7].padEnd(9, '0'));

  if (mes < 1 || mes > 12 || dia < 1 || dia > diasDoMes(ano, mes)) return null;
  if (hora > 23 || minuto > 59 || segundo > 59) return null;

  let deslocamento = 0;
  if (m[8] !== undefined) {
    const minutosDoFuso = m[10] === undefined ? 0 : Number(m[10]);
    const segundosDoFuso = m[11] === undefined ? 0 : Number(m[11]);
    if (minutosDoFuso > 59 || segundosDoFuso > 59) return null;
    deslocamento = (m[8] === '-' ? -1 : 1) * (Number(m[9]) * 3600 + minutosDoFuso * 60 + segundosDoFuso);
    if (Math.abs(deslocamento) > 18 * 3600) return null;
  }

  const segundos = diaDaEpoca(ano, mes, dia) * 86400 + hora * 3600 + minuto * 60 + segundo - deslocamento;
  return { segundos, nanos, deslocamento };
}

/** { segundos, nanos, deslocamento } → ISO-8601 com fuso (o mesmo texto que o servidor Java escrevia). */
export function formatarDataHora({ segundos, nanos, deslocamento }) {
  const local = segundos + deslocamento;
  const dia = Math.floor(local / 86400);
  const segundoDoDia = local - dia * 86400;
  const { ano, mes, dia: diaDoMes } = dataDoDia(dia);

  let texto = `${preencher(ano, 4)}-${preencher(mes, 2)}-${preencher(diaDoMes, 2)}T`
    + `${preencher(Math.floor(segundoDoDia / 3600), 2)}:${preencher(Math.floor(segundoDoDia / 60) % 60, 2)}:${preencher(segundoDoDia % 60, 2)}`;

  if (nanos !== 0) texto += `.${preencher(nanos, 9).replace(/0+$/, '')}`;
  if (deslocamento === 0) return `${texto}Z`;

  const absoluto = Math.abs(deslocamento);
  texto += `${deslocamento < 0 ? '-' : '+'}${preencher(Math.floor(absoluto / 3600), 2)}:${preencher(Math.floor(absoluto / 60) % 60, 2)}`;
  if (absoluto % 60 !== 0) texto += `:${preencher(absoluto % 60, 2)}`;
  return texto;
}

const comoDataHora = (valor) => (valor ? { _c: 'DataHora', ...valor } : null);

// ------------------------------------------------------------------------------- leitura dos campos

const ehObjeto = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor);

function objeto(valor, nome) {
  if (!ehObjeto(valor)) throw new ErroApi(400, `"${nome}" deve ser um objeto`);
  return valor;
}

function lista(pedido, nome, maximo) {
  const valor = pedido[nome];
  if (!Array.isArray(valor)) throw new ErroApi(400, `"${nome}" deve ser uma lista`);
  if (valor.length > maximo) throw new ErroApi(400, `"${nome}" aceita no máximo ${maximo} itens`);
  return valor;
}

function texto(pedido, nome, padrao = null) {
  const valor = pedido[nome];
  if (valor === undefined || valor === null) return padrao;
  if (typeof valor !== 'string') throw new ErroApi(400, `"${nome}" deve ser um texto`);
  return valor;
}

// Como o servidor antigo lia: (int) Math.round(double). Valores enormes dão voltas, e o servidor recusa o que ficar fora do intervalo.
function comoInt(valor) {
  const longo = BigInt.asIntN(64, BigInt(valor) > 2n ** 63n - 1n ? 2n ** 63n - 1n : BigInt(valor) < -(2n ** 63n) ? -(2n ** 63n) : BigInt(valor));
  return Number(BigInt.asIntN(32, longo));
}

function inteiro(pedido, nome) {
  const valor = pedido[nome];
  if (valor === undefined || valor === null) return null;
  if (typeof valor !== 'number' || !Number.isInteger(valor)) throw new ErroApi(400, `"${nome}" deve ser um número inteiro`);
  return comoInt(valor);
}

function logico(pedido, nome, padrao) {
  const valor = pedido[nome];
  if (valor === undefined || valor === null) return padrao;
  if (typeof valor !== 'boolean') throw new ErroApi(400, `"${nome}" deve ser verdadeiro ou falso`);
  return valor;
}

function dataHora(pedido, nome, obrigatorio) {
  const valor = pedido[nome];
  if (valor === undefined || valor === null) {
    if (obrigatorio) throw new ErroApi(400, `"${nome}" é obrigatório`);
    return null;
  }
  if (typeof valor !== 'string') throw new ErroApi(400, `"${nome}" deve ser uma data e hora em texto`);
  const lida = lerDataHora(valor);
  if (!lida) throw new ErroApi(400, `"${nome}" deve estar no formato ${FORMATO_DA_DATA}`);
  return lida;
}

const comoInteger = (valor) => (valor === null ? null : { _c: 'java.lang.Integer', value: valor });

// O servidor confia no que recebe (como o do Fazedor de Continhas); quem confere os intervalos é o cliente.
function entre(valor, nome, minimo, maximo) {
  if (valor !== null && (valor < minimo || valor > maximo)) throw new ErroApi(400, `"${nome}" deve estar entre ${minimo} e ${maximo}`);
  return valor;
}

function idObrigatorio(id) {
  if (id === null) throw new ErroApi(400, '"id" é obrigatório');
  if (id.length === 0) throw new ErroApi(400, '"id" não pode ser vazio');
  return id;
}

const depoisDe = (a, b) => a.segundos > b.segundos || (a.segundos === b.segundos && a.nanos > b.nanos);

// ------------------------------------------------------------------------ pedidos → comunicados

const agora = () => ({ segundos: Math.floor(Date.now() / 1000), nanos: (Date.now() % 1000) * 1_000_000, deslocamento: FUSO_PADRAO });

function pedidoDeRanking(pedido) {
  const quando = dataHora(pedido, 'agora', false) || agora();

  let preferencias = { _c: 'Preferencias', janelaFoco: 'manha', focoMatinal: true, duracaoMinutos: 50, antifadiga: true };
  if (pedido.preferencias !== undefined && pedido.preferencias !== null) {
    const p = objeto(pedido.preferencias, 'preferencias');
    const janelaFoco = texto(p, 'janelaFoco', 'manha');
    if (!JANELAS_DE_FOCO.includes(janelaFoco)) throw new ErroApi(400, '"janelaFoco" deve ser manha, tarde ou noite');
    const duracao = entre(inteiro(p, 'duracaoMinutos'), 'duracaoMinutos', 10, 240);
    preferencias = {
      _c: 'Preferencias',
      janelaFoco,
      focoMatinal: logico(p, 'focoMatinal', true),
      duracaoMinutos: duracao === null ? 50 : duracao,
      antifadiga: logico(p, 'antifadiga', true),
    };
  }

  const espacos = lista(pedido, 'espacos', MAXIMO_DE_ITENS).map((item) => {
    const e = objeto(item, 'espacos[]');
    const inicio = dataHora(e, 'inicio', true);
    const fim = dataHora(e, 'fim', true);
    if (!depoisDe(fim, inicio)) throw new ErroApi(400, 'Em "espacos", o "fim" deve ser depois do "inicio"');
    return { _c: 'EspacoLivre', id: idObrigatorio(texto(e, 'id')), inicio: comoDataHora(inicio), fim: comoDataHora(fim) };
  });

  const tarefas = lista(pedido, 'tarefas', MAXIMO_DE_ITENS).map((item) => {
    const t = objeto(item, 'tarefas[]');
    const prazo = dataHora(t, 'prazo', false);
    const prioridade = entre(inteiro(t, 'prioridade'), 'prioridade', 1, 10);

    let dificuldade = null;
    let peso = null;
    if (t.disciplina !== undefined && t.disciplina !== null) {
      const d = objeto(t.disciplina, 'disciplina');
      dificuldade = entre(inteiro(d, 'dificuldade'), 'dificuldade', 1, 5);
      peso = entre(inteiro(d, 'peso'), 'peso', 1, 5);
    }

    const categoria = texto(t, 'categoria', 'estudos');
    if (!CATEGORIAS.includes(categoria)) throw new ErroApi(400, '"categoria" deve ser "estudos" ou "pessoal"');

    const id = idObrigatorio(texto(t, 'id'));
    const tipo = texto(t, 'tipo', 'outro');
    const minutosEstimados = entre(inteiro(t, 'minutosEstimados'), 'minutosEstimados', 15, 1440);
    return {
      _c: 'Tarefa',
      id,
      categoria,
      tipo,
      prioridade: prioridade === null ? 5 : prioridade,
      prazo: comoDataHora(prazo),
      minutosEstimados: comoInteger(minutosEstimados),
      dificuldade: comoInteger(dificuldade),
      peso: comoInteger(peso),
      situacao: texto(t, 'situacao', 'pendente'),
    };
  });

  const limite = entre(inteiro(pedido, 'limite'), 'limite', 1, 100);
  return {
    _c: 'PedidoDeRanking',
    agora: comoDataHora(quando),
    preferencias,
    espacos,
    tarefas,
    limite: limite === null ? LIMITE_PADRAO : limite,
    alocar: logico(pedido, 'alocar', false),
  };
}

const TIPOS_DE_META = ['geral', 'disciplina', 'habito', 'projeto'];
const PRIORIDADES_DE_META = ['baixa', 'media', 'alta'];

function pedidoDeMetas(pedido) {
  const quando = dataHora(pedido, 'agora', false) || agora();

  const metas = [];
  for (const item of lista(pedido, 'metas', MAXIMO_DE_METAS)) {
    const m = objeto(item, 'metas[]');

    const tipo = texto(m, 'tipo', 'geral');
    if (!TIPOS_DE_META.includes(tipo)) throw new ErroApi(400, '"tipo" da meta deve ser geral, disciplina, habito ou projeto');

    const prioridade = texto(m, 'prioridade', 'media');
    if (!PRIORIDADES_DE_META.includes(prioridade)) throw new ErroApi(400, '"prioridade" da meta deve ser baixa, media ou alta');

    // Só metas ativas entram na disputa; concluídas e canceladas são ignoradas.
    if (texto(m, 'situacao', 'ativa') !== 'ativa') continue;

    const progresso = entre(inteiro(m, 'progresso'), 'progresso', 0, 100);
    const prazo = dataHora(m, 'prazo', false);
    metas.push({
      _c: 'Meta',
      id: idObrigatorio(texto(m, 'id')),
      tipo,
      prioridade,
      progresso: progresso === null ? 0 : progresso,
      prazo: comoDataHora(prazo),
    });
  }

  const marcos = entre(inteiro(pedido, 'quantidadeDeMarcos'), 'quantidadeDeMarcos', 1, 5);
  return { _c: 'PedidoDeMetas', agora: comoDataHora(quando), metas, quantidadeDeMarcos: marcos === null ? MARCOS_PADRAO : marcos };
}

// ------------------------------------------------------------------------ comunicados → respostas

const sessao = (s) => ({
  espacoId: s.espacoId,
  tarefaId: s.tarefaId,
  inicio: formatarDataHora(s.inicio),
  fim: formatarDataHora(s.fim),
  minutos: s.minutos,
  minutosRestantes: s.minutosRestantes,
  nota: s.nota,
  composicao: { urgencia: s.urgencia, importancia: s.importancia, encaixe: s.encaixe },
});

function respostaDeRanking(r) {
  const resposta = {
    tipo: 'ranking',
    porEspaco: r.porEspaco.map((e) => ({
      espacoId: e.espacoId,
      candidatos: e.candidatos.map((c) => ({
        tarefaId: c.tarefaId,
        nota: c.nota,
        minutosNoEspaco: c.minutosNoEspaco,
        parcial: c.parcial,
        composicao: { urgencia: c.urgencia, importancia: c.importancia, encaixe: c.encaixe },
      })),
    })),
    semEspaco: r.semEspaco.map((t) => ({ tarefaId: t.tarefaId, motivo: t.motivo })),
  };

  if (r.alocacao) {
    resposta.alocacao = r.alocacao.sessoes.map(sessao);
    resposta.semAlocacao = r.alocacao.semAlocacao.map((t) => ({ tarefaId: t.tarefaId, motivo: t.motivo, minutosRestantes: t.minutosRestantes }));
    if (r.alocacao.truncada) resposta.alocacaoTruncada = true;
  }

  return resposta;
}

const MS_POR_DIA = 24 * 60 * 60 * 1000;

// O servidor devolve cada marco como o número do dia (dias desde 1970-01-01, no fuso de `agora`).
const textoDoDia = (dia) => new Date(dia * MS_POR_DIA).toISOString().slice(0, 10);

const respostaDeMetas = (r) => ({
  tipo: 'prioridadeDeMetas',
  ranking: r.ranking.map((n) => ({
    metaId: n.metaId,
    nota: n.nota,
    atrasada: n.atrasada,
    composicao: { urgencia: n.urgencia, lacuna: n.lacuna, importancia: n.importancia },
  })),
  foco: r.foco,
  datasDosMarcos: r.diasDosMarcos.map(textoDoDia),
});

// --------------------------------------------------------------------------------------- modelos

const PEDIDO_DE_RANKING = {
  camposPermitidos: ['agora', 'preferencias', 'limite', 'alocar', 'espacos', 'tarefas'],
  descricao: 'de ranking',
  montar: pedidoDeRanking,
  classeDaResposta: 'Ranking',
  converter: respostaDeRanking,
  prefixoDeErroDeCalculo: 'Nao foi possivel calcular o ranking:',
};

const PEDIDO_DE_METAS = {
  camposPermitidos: ['agora', 'metas', 'quantidadeDeMarcos'],
  descricao: 'de metas',
  montar: pedidoDeMetas,
  classeDaResposta: 'PrioridadeDeMetas',
  converter: respostaDeMetas,
  prefixoDeErroDeCalculo: 'Nao foi possivel priorizar as metas:',
};

/** Pede ao servidor Java o ranking de tarefas por espaço livre (e, com `alocar`, a alocação). */
export function pedirRanking(pedido, configuracao = env.rankingJava) {
  return enviarPedido(pedido, PEDIDO_DE_RANKING, configuracao);
}

/** Pede ao servidor Java a prioridade das metas, a meta foco e as datas sugeridas para os marcos. */
export function pedirPrioridadeDeMetas(pedido, configuracao = env.rankingJava) {
  return enviarPedido(pedido, PEDIDO_DE_METAS, configuracao);
}

function montarMensagem(pedido, modelo) {
  if (!pedido || typeof pedido !== 'object' || Array.isArray(pedido)) {
    throw new ErroApi(400, `Envie o pedido ${modelo.descricao} em formato JSON.`);
  }

  const desconhecido = Object.keys(pedido).find((campo) => !modelo.camposPermitidos.includes(campo));
  if (desconhecido) throw new ErroApi(400, `Campo não permitido no pedido ${modelo.descricao}: ${desconhecido}.`);

  const comunicado = modelo.montar(pedido);

  const escritor = new EscritorJava();
  escritor.cabecalho();
  escritor.objeto(comunicado);
  escritor.objeto({ _c: 'PedidoParaSair' }); // depois da resposta o servidor fecha a conexão
  return escritor.buffer();
}

/**
 * Encaminha um pedido ao servidor Java. As opções de conexão podem ser substituídas em testes; em produção
 * usam o .env.
 */
async function enviarPedido(pedido, modelo, configuracao) {
  const mensagem = montarMensagem(pedido, modelo);
  if (mensagem.length > TAMANHO_MAXIMO) {
    throw new ErroApi(413, 'O pedido de ranking excede o limite de 2 MB.');
  }

  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: configuracao.host, port: configuracao.port });
    let recebido = Buffer.alloc(0);
    let finalizado = false;

    function encerrar(erro, resultado) {
      if (finalizado) return;
      finalizado = true;
      socket.destroy();
      if (erro) reject(erro);
      else resolve(resultado);
    }

    socket.setTimeout(configuracao.timeoutMs, () => {
      encerrar(new ErroApi(504, 'O servidor Java de ranking demorou para responder.'));
    });

    socket.on('connect', () => {
      socket.write(mensagem, (erro) => {
        if (erro) encerrar(new ErroApi(503, 'Não foi possível enviar o pedido ao servidor Java de ranking.'));
      });
    });

    socket.on('data', (parte) => {
      recebido = Buffer.concat([recebido, parte]);
      if (recebido.length > TAMANHO_MAXIMO) {
        encerrar(new ErroApi(502, 'A resposta do servidor Java de ranking excede o limite de 2 MB.'));
        return;
      }

      let resposta;
      try {
        const leitor = new LeitorJava(recebido);
        if (!leitor.cabecalho()) return;
        resposta = leitor.objeto();
      } catch (erro) {
        if (erro instanceof FaltamBytes) return; // a resposta ainda não chegou inteira
        encerrar(new ErroApi(502, 'O servidor Java de ranking devolveu uma resposta inválida.'));
        return;
      }

      if (resposta?._c === 'Erro') {
        const erroDeCalculo = typeof resposta.mensagem === 'string' && resposta.mensagem.startsWith(modelo.prefixoDeErroDeCalculo);
        encerrar(new ErroApi(
          erroDeCalculo ? 502 : 400,
          resposta.mensagem || `O servidor Java rejeitou o pedido ${modelo.descricao}.`,
        ));
        return;
      }
      if (resposta?._c !== modelo.classeDaResposta) {
        encerrar(new ErroApi(502, 'O servidor Java devolveu um tipo de resposta inesperado.'));
        return;
      }

      let convertida;
      try {
        convertida = modelo.converter(resposta);
      } catch {
        encerrar(new ErroApi(502, 'O servidor Java de ranking devolveu uma resposta inválida.'));
        return;
      }

      encerrar(null, convertida);
    });

    socket.on('error', () => {
      encerrar(new ErroApi(503, 'Servidor Java de ranking indisponível.'));
    });

    socket.on('close', () => {
      if (!finalizado) {
        encerrar(new ErroApi(503, 'O servidor Java encerrou a conexão sem responder.'));
      }
    });
  });
}
