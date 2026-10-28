/**
 * Cliente da API (backend/) — usuários em /api/usuarios e autenticação em /api/auth.
 * Depois do login/cadastro a API devolve um token de sessão; ele é guardado aqui e enviado
 * em todas as requisições (Authorization: Bearer ...).
 * Uso: AcaiApi.criarUsuario({ ... }), AcaiApi.obterUsuarioAtual(), ...
 */

const AcaiApi = (function () {
    const URL_BASE = window.ACAISTUDY_API_URL || 'http://localhost:3001/api';
    const CHAVE_ID = 'acaistudy-usuario-id';
    const CHAVE_USUARIO = 'acaistudy-usuario';
    const CHAVE_TOKEN = 'acaistudy-token';
    const PAGINA_LOGIN = 'index_login.html';

    function obterIdAtual() {
        return localStorage.getItem(CHAVE_ID);
    }

    function obterToken() {
        return localStorage.getItem(CHAVE_TOKEN);
    }

    function guardarUsuario(usuario) {
        localStorage.setItem(CHAVE_ID, usuario.id);
        localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));

        return usuario;
    }

    function esquecerUsuario() {
        localStorage.removeItem(CHAVE_ID);
        localStorage.removeItem(CHAVE_USUARIO);
        localStorage.removeItem(CHAVE_TOKEN);
    }

    // Guarda o usuário e o token que a API devolveu no login/cadastro.
    function guardarSessao({ usuario, token }) {
        localStorage.setItem(CHAVE_TOKEN, token);

        return guardarUsuario(usuario);
    }

    // `publica: true` para login e cadastro: não enviam token e, se der 401, mostram o erro
    // na tela em vez de redirecionar.
    async function requisitar(caminho, { metodo = 'GET', corpo, publica = false, arquivo = false } = {}) {
        let resposta;
        const token = publica ? null : obterToken();

        try {
            resposta = await fetch(`${URL_BASE}${caminho}`, {
                method: metodo,
                // keepalive deixa o pedido terminar mesmo se a página navegar logo depois.
                // Não vale para arquivo: o navegador recusa corpo maior que 64 KB com essa opção
                // e a foto de perfil (até 5 MB) cairia como falha de conexão.
                keepalive: !arquivo,
                headers: {
                    ...(arquivo ? {} : { 'Content-Type': 'application/json' }),
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: arquivo ? corpo : (corpo === undefined ? undefined : JSON.stringify(corpo)),
            });
        } catch {
            throw new Error('Não foi possível conectar ao servidor. Verifique se a API está rodando.');
        }

        if (resposta.status === 204) {
            return null;
        }

        const dados = await resposta.json().catch(() => ({}));

        // Sessão inválida ou expirada: limpa o que está guardado e volta para o login.
        if (resposta.status === 401 && !publica) {
            esquecerUsuario();
            window.location.replace(PAGINA_LOGIN);
        }

        if (!resposta.ok) {
            const erro = new Error(dados.mensagem || 'Erro inesperado. Tente novamente.');
            erro.status = resposta.status;
            throw erro;
        }

        return dados;
    }

    // ----- CRUD -----

    async function criarUsuario(dados) {
        const resposta = await requisitar('/usuarios', { metodo: 'POST', corpo: dados, publica: true });

        return guardarSessao(resposta);
    }

    // Login: confere e-mail e senha na API, que abre uma sessão (token) para este navegador.
    async function entrar(email, senha) {
        const resposta = await requisitar('/auth/login', { metodo: 'POST', corpo: { email, senha }, publica: true });

        return guardarSessao(resposta);
    }

    // Esqueci minha senha: pede o link de recuperação. A API responde igual exista a conta ou não.
    function recuperarSenha(email) {
        return requisitar('/auth/recuperar-senha', { metodo: 'POST', corpo: { email }, publica: true });
    }

    // A tela de nova senha chama isso ao abrir, para saber se o link ainda vale.
    function conferirLinkRedefinicao(token) {
        const consulta = new URLSearchParams({ token });

        return requisitar(`/auth/redefinir-senha?${consulta}`, { publica: true });
    }

    // Define a senha nova com o token que veio no link (?token=...).
    function redefinirSenha(token, senha) {
        return requisitar('/auth/redefinir-senha', { metodo: 'POST', corpo: { token, senha }, publica: true });
    }

    // Logout: encerra a sessão na API e esquece o usuário neste navegador.
    // O pedido sai com o token atual; o estado local é limpo na hora (sem esperar a resposta),
    // porque a página costuma navegar para o login logo em seguida.
    async function sair() {
        const pedido = requisitar('/auth/logout', { metodo: 'POST' });

        esquecerUsuario();

        try {
            await pedido;
        } catch {
            // sem API ou sessão já inválida: o estado local já foi limpo
        }
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

    async function listarBlocosFixos() {
        const { blocos } = await requisitar('/blocos-fixos');
        return blocos;
    }

    async function criarBlocoFixo(dados) {
        const { bloco } = await requisitar('/blocos-fixos', { metodo: 'POST', corpo: dados });
        return bloco;
    }

    async function atualizarBlocoFixo(id, alteracoes) {
        const { bloco } = await requisitar(`/blocos-fixos/${id}`, { metodo: 'PATCH', corpo: alteracoes });
        return bloco;
    }

    async function excluirBlocoFixo(id) {
        await requisitar(`/blocos-fixos/${id}`, { metodo: 'DELETE' });
    }

    async function listarDisciplinas(filtros = {}) {
        const consulta = new URLSearchParams();
        if (filtros.situacao) {
            consulta.set('situacao', filtros.situacao);
        }
        const sufixo = consulta.toString() ? `?${consulta}` : '';
        const { disciplinas } = await requisitar(`/disciplinas${sufixo}`);
        return disciplinas;
    }

    async function listarDisciplinasAtivas() {
        const { disciplinas } = await requisitar('/disciplinas/ativas');
        return disciplinas;
    }

    async function obterDisciplina(id) {
        const { disciplina } = await requisitar(`/disciplinas/${id}`);
        return disciplina;
    }

    async function criarDisciplina(dados) {
        const { disciplina } = await requisitar('/disciplinas', { metodo: 'POST', corpo: dados });
        return disciplina;
    }

    async function atualizarDisciplina(id, alteracoes) {
        const { disciplina } = await requisitar(`/disciplinas/${id}`, { metodo: 'PATCH', corpo: alteracoes });
        return disciplina;
    }

    async function excluirDisciplina(id) {
        await requisitar(`/disciplinas/${id}`, { metodo: 'DELETE' });
    }

    function obterRelatorio(inicio) {
        const consulta = inicio ? `?inicio=${encodeURIComponent(inicio)}` : '';
        return requisitar(`/relatorios${consulta}`);
    }

    function obterConfiguracoes() {
        return requisitar('/configuracoes');
    }

    function salvarConfiguracoes(configuracao) {
        return requisitar('/configuracoes', { metodo: 'PATCH', corpo: { configuracao } });
    }

    function obterCanvas() {
        return requisitar('/canvas');
    }

    function conectarCanvas(dados) {
        return requisitar('/canvas/conectar', { metodo: 'POST', corpo: dados });
    }

    function iniciarCanvas() {
        return requisitar('/canvas/oauth');
    }

    function sincronizarCanvas() {
        return requisitar('/canvas/sincronizar', { metodo: 'POST' });
    }

    function desconectarCanvas() {
        return requisitar('/canvas', { metodo: 'DELETE' });
    }

    async function obterCabecalho() {
        const { cabecalho } = await requisitar('/cabecalho');
        return cabecalho;
    }

    async function obterMeta(id) {
        const { meta } = await requisitar(`/metas/${id}`);
        return meta;
    }

    function listarMetas(filtros = {}) {
        const consulta = new URLSearchParams();
        if (filtros.situacao) {
            consulta.set('situacao', filtros.situacao);
        }
        const sufixo = consulta.toString() ? `?${consulta}` : '';
        return requisitar(`/metas${sufixo}`);
    }

    async function criarMeta(dados) {
        const { meta } = await requisitar('/metas', { metodo: 'POST', corpo: dados });
        return meta;
    }

    async function atualizarMeta(id, alteracoes) {
        const { meta } = await requisitar(`/metas/${id}`, { metodo: 'PATCH', corpo: alteracoes });
        return meta;
    }

    async function excluirMeta(id) {
        await requisitar(`/metas/${id}`, { metodo: 'DELETE' });
    }
    // ----- Usuário logado neste navegador -----

    async function obterUsuarioAtual() {
        return guardarUsuario(await obterUsuario(obterIdAtual()));
    }

    function atualizarUsuarioAtual(alteracoes) {
        return atualizarUsuario(obterIdAtual(), alteracoes);
    }

    // Envia a foto escolhida no perfil (campo `foto`). O navegador monta o multipart;
    // não definimos Content-Type aqui para o boundary ir junto.
    async function enviarFotoAtual(arquivo) {
        const corpo = new FormData();
        corpo.append('foto', arquivo);

        const { usuario } = await requisitar(`/usuarios/${obterIdAtual()}/avatar`, {
            metodo: 'POST',
            corpo,
            arquivo: true,
        });

        return guardarUsuario(usuario);
    }

    // Tira a foto. A API responde o usuário com urlAvatar null.
    async function removerFotoAtual() {
        const { usuario } = await requisitar(`/usuarios/${obterIdAtual()}/avatar`, { metodo: 'DELETE' });

        return guardarUsuario(usuario);
    }

    function excluirUsuarioAtual() {
        return excluirUsuario(obterIdAtual());
    }

    function temUsuarioAtual() {
        return Boolean(obterIdAtual() && obterToken());
    }

    // Confere na API se a sessão ainda vale e atualiza o usuário guardado. Se não valer, o
    // requisitar já limpa tudo e volta ao login. Sem API, não faz nada (a página continua aberta).
    async function verificarSessao() {
        try {
            const { usuario } = await requisitar('/auth/eu');

            guardarUsuario(usuario);
        } catch {
            // 401 já foi tratado em requisitar; erros de conexão são ignorados aqui
        }
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
        sair,
        recuperarSenha,
        conferirLinkRedefinicao,
        redefinirSenha,
        listarUsuarios,
        obterUsuario,
        atualizarUsuario,
        excluirUsuario,
        listarBlocosFixos,
        criarBlocoFixo,
        atualizarBlocoFixo,
        excluirBlocoFixo,
        listarDisciplinas,
        listarDisciplinasAtivas,
        obterDisciplina,
        criarDisciplina,
        atualizarDisciplina,
        excluirDisciplina,
        obterRelatorio,
        obterCabecalho,
        obterConfiguracoes,
        salvarConfiguracoes,
        obterCanvas,
        conectarCanvas,
        iniciarCanvas,
        sincronizarCanvas,
        desconectarCanvas,
        listarMetas,
        obterMeta,
        criarMeta,
        atualizarMeta,
        excluirMeta,
        obterUsuarioAtual,
        atualizarUsuarioAtual,
        enviarFotoAtual,
        removerFotoAtual,
        excluirUsuarioAtual,
        temUsuarioAtual,
        onboardingConcluido,
        paginaInicial,
        verificarSessao,
        esquecerUsuario,
    };
})();

window.AcaiApi = AcaiApi;
