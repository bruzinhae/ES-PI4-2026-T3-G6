/**
 * Cliente da API de usuários (backend/users) — CRUD em /api/usuarios.
 * Uso: AcaiApi.criarUsuario({ ... }), AcaiApi.obterUsuarioAtual(), ...
 */

const AcaiApi = (function () {
    const URL_BASE = window.ACAISTUDY_API_URL || 'http://localhost:3001/api';
    const CHAVE_ID = 'acaistudy-usuario-id';
    const CHAVE_USUARIO = 'acaistudy-usuario';

    function obterIdAtual() {
        return localStorage.getItem(CHAVE_ID);
    }

    function guardarUsuario(usuario) {
        localStorage.setItem(CHAVE_ID, usuario.id);
        localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));

        return usuario;
    }

    function esquecerUsuario() {
        localStorage.removeItem(CHAVE_ID);
        localStorage.removeItem(CHAVE_USUARIO);
    }

    async function requisitar(caminho, { metodo = 'GET', corpo } = {}) {
        let resposta;

        try {
            resposta = await fetch(`${URL_BASE}${caminho}`, {
                method: metodo,
                headers: { 'Content-Type': 'application/json' },
                body: corpo === undefined ? undefined : JSON.stringify(corpo),
            });
        } catch {
            throw new Error('Não foi possível conectar ao servidor. Verifique se a API está rodando.');
        }

        if (resposta.status === 204) {
            return null;
        }

        const dados = await resposta.json().catch(() => ({}));

        if (!resposta.ok) {
            const erro = new Error(dados.mensagem || 'Erro inesperado. Tente novamente.');
            erro.status = resposta.status;
            throw erro;
        }

        return dados;
    }

    // ----- CRUD -----

    async function criarUsuario(dados) {
        const { usuario } = await requisitar('/usuarios', { metodo: 'POST', corpo: dados });

        return guardarUsuario(usuario);
    }

    // Login: confere e-mail e senha no banco e passa a usar esse usuário nesta máquina.
    async function entrar(email, senha) {
        const { usuario } = await requisitar('/usuarios/login', { metodo: 'POST', corpo: { email, senha } });

        return guardarUsuario(usuario);
    }

    async function listarUsuarios() {
        const { usuarios } = await requisitar('/usuarios');

        return usuarios;
    }

    async function obterUsuario(id) {
        const { usuario } = await requisitar(`/usuarios/${id}`);

        return usuario;
    }

    async function atualizarUsuario(id, alteracoes) {
        const { usuario } = await requisitar(`/usuarios/${id}`, { metodo: 'PATCH', corpo: alteracoes });

        if (id === obterIdAtual()) {
            guardarUsuario(usuario);
        }

        return usuario;
    }

    async function excluirUsuario(id) {
        await requisitar(`/usuarios/${id}`, { metodo: 'DELETE' });

        if (id === obterIdAtual()) {
            esquecerUsuario();
        }
    }

    // ----- Usuário desta máquina (último cadastrado) -----

    async function obterUsuarioAtual() {
        return guardarUsuario(await obterUsuario(obterIdAtual()));
    }

    function atualizarUsuarioAtual(alteracoes) {
        return atualizarUsuario(obterIdAtual(), alteracoes);
    }

    function excluirUsuarioAtual() {
        return excluirUsuario(obterIdAtual());
    }

    function temUsuarioAtual() {
        return Boolean(obterIdAtual());
    }

    // Consulta o banco: true se o usuário atual já concluiu o onboarding.
    // Sem usuário ou sem API, assume false (o onboarding é mostrado).
    async function onboardingConcluido() {
        if (!temUsuarioAtual()) {
            return false;
        }

        try {
            const usuario = await obterUsuarioAtual();

            return usuario.onboardingConcluido === true;
        } catch {
            return false;
        }
    }

    // Página para onde o usuário vai depois de entrar: grade normal ou onboarding.
    async function paginaInicial() {
        return (await onboardingConcluido()) ? 'index_calendario.html' : 'index_onboarding_horarios.html';
    }

    return {
        criarUsuario,
        entrar,
        listarUsuarios,
        obterUsuario,
        atualizarUsuario,
        excluirUsuario,
        obterUsuarioAtual,
        atualizarUsuarioAtual,
        excluirUsuarioAtual,
        temUsuarioAtual,
        onboardingConcluido,
        paginaInicial,
        esquecerUsuario,
    };
})();

window.AcaiApi = AcaiApi;
