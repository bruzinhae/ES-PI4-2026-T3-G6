/**
 * canvas/canvasService.js — conexão com o Canvas LMS e importação de cursos e atividades.
 * O token fica cifrado no usuário e não é devolvido pela API.
 */

import crypto from 'node:crypto';
import { isIP } from 'node:net';
import { env } from '../../config/env.js';
import { ErroApi } from '../../utils/ErroApi.js';
import { Disciplina } from '../disciplinas/Disciplina.js';
import { Tarefa } from '../tarefas/Tarefa.js';
import { Usuario } from '../usuarios/Usuario.js';

const CORES = ['roxo', 'azul', 'verde', 'ambar'];
const ESCOPOS = [
    'url:GET|/api/v1/users/:user_id',
    'url:GET|/api/v1/courses',
    'url:GET|/api/v1/courses/:course_id/assignments',
];
const HOSTS_BLOQUEADOS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);

let chaveCache;

function chaveDoToken() {
    if (!chaveCache) {
        chaveCache = crypto.scryptSync(env.mongodbUri, 'acaistudy-canvas-v1', 32);
    }
    return chaveCache;
}

function selar(texto) {
    const iv = crypto.randomBytes(12);
    const cifra = crypto.createCipheriv('aes-256-gcm', chaveDoToken(), iv);
    const cifrado = Buffer.concat([cifra.update(String(texto), 'utf8'), cifra.final()]);
    const tag = cifra.getAuthTag();
    return ['v1', iv.toString('base64url'), tag.toString('base64url'), cifrado.toString('base64url')].join('.');
}

function abrir(selo) {
    const partes = String(selo || '').split('.');
    if (partes.length !== 4 || partes[0] !== 'v1') {
        throw new ErroApi(401, 'O acesso ao Canvas expirou. Conecte de novo.');
    }
    try {
        const decifra = crypto.createDecipheriv('aes-256-gcm', chaveDoToken(), Buffer.from(partes[1], 'base64url'));
        decifra.setAuthTag(Buffer.from(partes[2], 'base64url'));
        return Buffer.concat([
            decifra.update(Buffer.from(partes[3], 'base64url')),
            decifra.final(),
        ]).toString('utf8');
    } catch {
        throw new ErroApi(401, 'O acesso ao Canvas expirou. Conecte de novo.');
    }
}

export function oauthDisponivel() {
    return Boolean(env.canvas.baseUrl && env.canvas.clientId && env.canvas.clientSecret);
}

export function validarInstancia(texto) {
    let url;
    try {
        url = new URL(String(texto || '').trim());
    } catch {
        throw new ErroApi(400, 'Informe a URL do Canvas, começando com https://.');
    }

    if (url.username || url.password) {
        throw new ErroApi(400, 'A URL do Canvas não pode trazer usuário ou senha.');
    }

    const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
    const bloqueado = HOSTS_BLOQUEADOS.has(host)
        || host.endsWith('.local')
        || host.endsWith('.internal')
        || isIP(host);

    if (url.protocol !== 'https:' || bloqueado) {
        throw new ErroApi(400, 'Use o endereço https público do Canvas da sua instituição.');
    }

    if (env.canvas.baseUrl) {
        let fixa;
        try {
            fixa = new URL(env.canvas.baseUrl);
        } catch {
            throw new ErroApi(503, 'A URL do Canvas configurada no servidor é inválida.');
        }
        if (url.origin !== fixa.origin) {
            throw new ErroApi(400, 'Este servidor só aceita o Canvas configurado da instituição.');
        }
    }

    return url.origin;
}

function validarToken(token) {
    const limpo = String(token || '').trim();
    if (limpo.length < 20 || limpo.length > 2000 || /\s/.test(limpo)) {
        throw new ErroApi(400, 'Cole o token de acesso gerado no Canvas, sem espaços.');
    }
    return limpo;
}

function recortar(valor, maximo, minimo = 2) {
    const texto = String(valor || '').replace(/\s+/g, ' ').trim().slice(0, maximo);
    return texto.length >= minimo ? texto : null;
}

function uriDeRetorno() {
    return `${env.frontendUrl}/api/canvas/retorno`;
}

function criarState(usuarioId) {
    const corpo = Buffer.from(JSON.stringify({
        usuarioId: String(usuarioId),
        expira: Date.now() + 10 * 60 * 1000,
    })).toString('base64url');
    const assinatura = crypto
        .createHmac('sha256', env.canvas.clientSecret)
        .update(corpo)
        .digest('base64url');
    return `${corpo}.${assinatura}`;
}

function lerState(state) {
    const [corpo, assinatura] = String(state || '').split('.');
    if (!corpo || !assinatura) {
        throw new ErroApi(400, 'A volta do Canvas não é válida.');
    }
    const esperada = crypto.createHmac('sha256', env.canvas.clientSecret).update(corpo).digest('base64url');
    const recebida = Buffer.from(assinatura);
    const confere = Buffer.from(esperada);
    if (recebida.length !== confere.length || !crypto.timingSafeEqual(recebida, confere)) {
        throw new ErroApi(400, 'A volta do Canvas não é válida.');
    }
    let dados;
    try {
        dados = JSON.parse(Buffer.from(corpo, 'base64url').toString('utf8'));
    } catch {
        throw new ErroApi(400, 'A volta do Canvas não é válida.');
    }
    if (!dados?.usuarioId || !dados.expira || dados.expira < Date.now()) {
        throw new ErroApi(400, 'A autorização do Canvas expirou. Tente de novo.');
    }
    return dados.usuarioId;
}

export function descrever(usuario) {
    const canvas = usuario?.canvas;
    let host = null;
    if (canvas?.instanciaUrl) {
        host = new URL(canvas.instanciaUrl).host;
    } else if (env.canvas.baseUrl) {
        try {
            host = new URL(env.canvas.baseUrl).host;
        } catch {
            host = null;
        }
    }
    return {
        oauthDisponivel: oauthDisponivel(),
        instanciaFixa: env.canvas.baseUrl ? host : null,
        conectado: Boolean(canvas?.canvasUserId && canvas?.conectadoEm),
        nome: canvas?.nome || null,
        instancia: canvas?.instanciaUrl ? host : null,
        conectadoEm: canvas?.conectadoEm || null,
        sincronizadoEm: canvas?.sincronizadoEm || null,
    };
}

async function carregarUsuario(usuarioId) {
    const usuario = await Usuario.findById(usuarioId).select('+canvas.accessToken +canvas.refreshToken');
    if (!usuario) {
        throw new ErroApi(404, 'Usuário não encontrado.');
    }
    return usuario;
}

function proximaPagina(link, origem) {
    if (!link) return null;
    const trecho = link.split(',').find((parte) => parte.includes('rel="next"'));
    const encontrado = trecho?.match(/<([^>]+)>/);
    if (!encontrado) return null;
    const url = new URL(encontrado[1]);
    if (url.origin !== origem) return null;
    return url;
}

async function pedir(origem, caminhoOuUrl, token, { paginas = 1 } = {}) {
    const itens = [];
    let url = caminhoOuUrl instanceof URL
        ? caminhoOuUrl
        : new URL(`/api/v1${caminhoOuUrl}`, origem);
    if (!(caminhoOuUrl instanceof URL)) {
        url.searchParams.set('per_page', '50');
    }

    for (let pagina = 0; pagina < paginas && url; pagina += 1) {
        if (url.origin !== origem) break;
        let resposta;
        try {
            resposta = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
                signal: AbortSignal.timeout(12000),
            });
        } catch {
            throw new ErroApi(502, 'Não foi possível falar com o Canvas.');
        }

        if (resposta.status === 401) {
            throw new ErroApi(401, 'O Canvas não aceitou esse acesso. Conecte de novo.');
        }
        if (!resposta.ok) {
            throw new ErroApi(502, 'O Canvas não respondeu como esperado.');
        }

        const dados = await resposta.json().catch(() => null);
        if (!Array.isArray(dados)) return dados;
        itens.push(...dados);
        url = proximaPagina(resposta.headers.get('link'), origem);
    }

    return itens;
}

async function trocarCodigo(origem, corpo) {
    let resposta;
    try {
        resposta = await fetch(new URL('/login/oauth2/token', origem), {
            method: 'POST',
            headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(corpo),
            signal: AbortSignal.timeout(12000),
        });
    } catch {
        throw new ErroApi(502, 'Não foi possível falar com o Canvas.');
    }
    const dados = await resposta.json().catch(() => ({}));
    if (!resposta.ok || !dados.access_token) {
        throw new ErroApi(401, 'O Canvas não autorizou a conexão.');
    }
    return dados;
}

async function gravarAcesso(usuario, origem, tokenCanvas, perfil) {
    const expiraEm = tokenCanvas.expires_in
        ? new Date(Date.now() + Number(tokenCanvas.expires_in) * 1000)
        : null;
    usuario.canvas = {
        instanciaUrl: origem,
        accessToken: selar(tokenCanvas.access_token),
        refreshToken: tokenCanvas.refresh_token ? selar(tokenCanvas.refresh_token) : usuario.canvas?.refreshToken || null,
        expiraEm,
        canvasUserId: String(perfil.id),
        nome: recortar(perfil.name || perfil.short_name, 120) || 'Conta Canvas',
        conectadoEm: usuario.canvas?.conectadoEm || new Date(),
        sincronizadoEm: usuario.canvas?.sincronizadoEm || null,
    };
    await usuario.save();
}

async function tokenAtual(usuario) {
    if (!usuario.canvas?.accessToken || !usuario.canvas.instanciaUrl) {
        throw new ErroApi(400, 'Conecte o Canvas antes de sincronizar.');
    }
    const origem = usuario.canvas.instanciaUrl;
    const vencido = usuario.canvas.expiraEm && new Date(usuario.canvas.expiraEm).getTime() < Date.now() + 60_000;
    if (!vencido) {
        return { origem, token: abrir(usuario.canvas.accessToken) };
    }
    if (!usuario.canvas.refreshToken || !oauthDisponivel()) {
        throw new ErroApi(401, 'O acesso ao Canvas expirou. Conecte de novo.');
    }
    const renovado = await trocarCodigo(origem, {
        grant_type: 'refresh_token',
        client_id: env.canvas.clientId,
        client_secret: env.canvas.clientSecret,
        refresh_token: abrir(usuario.canvas.refreshToken),
    });
    const perfil = { id: usuario.canvas.canvasUserId, name: usuario.canvas.nome };
    await gravarAcesso(usuario, origem, renovado, perfil);
    return { origem, token: renovado.access_token };
}

function cursoDoAluno(curso) {
    if (!curso?.id || curso.access_restricted_by_date) return false;
    if (curso.workflow_state && !['available', 'completed'].includes(curso.workflow_state)) return false;
    return Boolean(recortar(curso.name, 120));
}

export function classificarAtividade(atividade) {
    const tipos = atividade.submission_types || [];
    const nome = String(atividade.name || '').toLowerCase();
    if (tipos.includes('online_quiz') || /prova|exame|\bquiz\b|\bteste\b/.test(nome)) return 'prova';
    if (tipos.includes('online_upload') || /trabalho|projeto|relat[oó]rio/.test(nome)) return 'trabalho';
    if (/leitura|cap[ií]tulo|artigo/.test(nome)) return 'leitura';
    if (tipos.includes('discussion_topic')) return 'outro';
    return 'exercicio';
}

function situacaoDaAtividade(atividade) {
    const estado = atividade.submission?.workflow_state;
    if (estado === 'graded' || estado === 'submitted' || estado === 'pending_review') return 'concluida';
    return 'pendente';
}

function prioridadeDa(atividade, tipo) {
    let prioridade = 5;
    if (tipo === 'prova') prioridade += 3;
    else if (tipo === 'trabalho') prioridade += 2;
    if (atividade.due_at) {
        const dias = (new Date(atividade.due_at).getTime() - Date.now()) / 86_400_000;
        if (dias <= 3) prioridade += 2;
        else if (dias <= 7) prioridade += 1;
    }
    return Math.max(1, Math.min(10, prioridade));
}

function atividadeUtil(atividade) {
    if (!atividade?.id || atividade.published === false) return false;
    if (!recortar(atividade.name, 160)) return false;
    if (!atividade.due_at) return false;
    const prazo = new Date(atividade.due_at);
    if (Number.isNaN(prazo.getTime())) return false;
    const limite = Date.now() - 60 * 86_400_000;
    return prazo.getTime() >= limite;
}

async function importar(usuario, origem, token) {
    const cursos = await pedir(
        origem,
        '/courses?enrollment_state=active&enrollment_type=student&include[]=term&include[]=teachers',
        token,
        { paginas: 4 },
    );
    const resultado = {
        disciplinasNovas: 0,
        disciplinasAtualizadas: 0,
        tarefasNovas: 0,
        tarefasAtualizadas: 0,
    };

    let indice = 0;
    for (const curso of cursos.filter(cursoDoAluno)) {
        const idExterno = `canvas:curso:${curso.id}`;
        const nome = recortar(curso.name, 120);
        const professor = recortar(curso.teachers?.[0]?.display_name, 120, 2);
        const periodo = recortar(curso.term?.name, 20, 1);
        let disciplina = await Disciplina.findOne({ usuarioId: usuario._id, idExterno });
        if (!disciplina) {
            disciplina = await Disciplina.create({
                usuarioId: usuario._id,
                nome,
                area: recortar(curso.course_code, 80) || 'Canvas',
                professor,
                periodoLetivo: periodo,
                cor: CORES[indice % CORES.length],
                situacao: curso.workflow_state === 'completed' ? 'concluida' : 'ativa',
                origem: 'canvas',
                idExterno,
            });
            resultado.disciplinasNovas += 1;
        } else {
            disciplina.nome = nome;
            if (professor) disciplina.professor = professor;
            if (periodo) disciplina.periodoLetivo = periodo;
            disciplina.situacao = curso.workflow_state === 'completed' ? 'concluida' : 'ativa';
            await disciplina.save();
            resultado.disciplinasAtualizadas += 1;
        }
        indice += 1;

        const atividades = await pedir(
            origem,
            `/courses/${curso.id}/assignments?include[]=submission&order_by=due_at`,
            token,
            { paginas: 2 },
        );
        for (const atividade of atividades.filter(atividadeUtil).slice(0, 40)) {
            const idTarefa = `canvas:tarefa:${atividade.id}`;
            const titulo = recortar(atividade.name, 160);
            const tipo = classificarAtividade(atividade);
            const prazo = new Date(atividade.due_at);
            const vinda = situacaoDaAtividade(atividade);
            let tarefa = await Tarefa.findOne({ usuarioId: usuario._id, idExterno: idTarefa });
            if (!tarefa) {
                await Tarefa.create({
                    usuarioId: usuario._id,
                    disciplinaId: disciplina._id,
                    titulo,
                    categoria: 'estudos',
                    tipo,
                    etiqueta: 'Canvas',
                    prazo,
                    prioridade: prioridadeDa(atividade, tipo),
                    situacao: vinda,
                    concluidoEm: vinda === 'concluida' ? new Date() : null,
                    origem: 'canvas',
                    idExterno: idTarefa,
                });
                resultado.tarefasNovas += 1;
            } else {
                tarefa.titulo = titulo;
                tarefa.disciplinaId = disciplina._id;
                tarefa.tipo = tipo;
                tarefa.prazo = prazo;
                if (vinda === 'concluida' && tarefa.situacao !== 'concluida') {
                    tarefa.situacao = 'concluida';
                    tarefa.concluidoEm = tarefa.concluidoEm || new Date();
                }
                await tarefa.save();
                resultado.tarefasAtualizadas += 1;
            }
        }
    }

    usuario.canvas.sincronizadoEm = new Date();
    await usuario.save();
    return resultado;
}

export async function obter(usuarioId) {
    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) throw new ErroApi(404, 'Usuário não encontrado.');
    return descrever(usuario);
}

export function urlDeAutorizacao(usuarioId) {
    if (!oauthDisponivel()) {
        throw new ErroApi(503, 'A entrada oficial do Canvas não está habilitada neste servidor. Use um token de acesso.');
    }
    const origem = validarInstancia(env.canvas.baseUrl);
    const url = new URL('/login/oauth2/auth', origem);
    url.searchParams.set('client_id', env.canvas.clientId);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('redirect_uri', uriDeRetorno());
    url.searchParams.set('state', criarState(usuarioId));
    url.searchParams.set('scope', ESCOPOS.join(' '));
    return url.toString();
}

export async function concluirOauth(code, state) {
    if (!oauthDisponivel()) {
        throw new ErroApi(503, 'A entrada oficial do Canvas não está habilitada neste servidor.');
    }
    if (!code) throw new ErroApi(400, 'O Canvas não devolveu o código de autorização.');
    const usuarioId = lerState(state);
    const origem = validarInstancia(env.canvas.baseUrl);
    const tokenCanvas = await trocarCodigo(origem, {
        grant_type: 'authorization_code',
        client_id: env.canvas.clientId,
        client_secret: env.canvas.clientSecret,
        redirect_uri: uriDeRetorno(),
        code,
    });
    const usuario = await carregarUsuario(usuarioId);
    const perfil = await pedir(origem, '/users/self', tokenCanvas.access_token);
    if (!perfil?.id) throw new ErroApi(502, 'O Canvas não informou a conta conectada.');
    await gravarAcesso(usuario, origem, tokenCanvas, perfil);
    return finalizarConexao(usuario, origem, tokenCanvas.access_token);
}

export async function conectarComToken(usuarioId, dados) {
    const token = validarToken(dados?.token);
    const origem = validarInstancia(dados?.instanciaUrl || env.canvas.baseUrl);
    const perfil = await pedir(origem, '/users/self', token);
    if (!perfil?.id) throw new ErroApi(502, 'O Canvas não informou a conta conectada.');
    const usuario = await carregarUsuario(usuarioId);
    await gravarAcesso(usuario, origem, { access_token: token }, perfil);
    return finalizarConexao(usuario, origem, token);
}

async function finalizarConexao(usuario, origem, token) {
    try {
        const resultado = await importar(usuario, origem, token);
        return { conexao: descrever(usuario), resultado };
    } catch (erro) {
        return {
            conexao: descrever(usuario),
            resultado: null,
            aviso: erro instanceof ErroApi ? erro.message : 'A conta conectou, mas a importação não terminou.',
        };
    }
}

export async function sincronizar(usuarioId) {
    const usuario = await carregarUsuario(usuarioId);
    const { origem, token } = await tokenAtual(usuario);
    const resultado = await importar(usuario, origem, token);
    return { conexao: descrever(usuario), resultado };
}

export async function desconectar(usuarioId) {
    const usuario = await carregarUsuario(usuarioId);
    usuario.canvas = null;
    await usuario.save();
    return descrever(usuario);
}
