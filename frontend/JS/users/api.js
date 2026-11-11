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

        guardarSessao(resposta);

        return resposta;
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

    function conferirConfirmacaoEmail(token) {
        const consulta = new URLSearchParams({ token });

        return requisitar(`/auth/confirmar-email?${consulta}`, { publica: true });
    }

    async function confirmarEmail(token) {
        const dados = await requisitar('/auth/confirmar-email', { metodo: 'POST', corpo: { token }, publica: true });

        if (dados?.usuario?.id && dados.usuario.id === obterIdAtual()) {
            guardarUsuario(dados.usuario);
        }

        return dados?.usuario;
    }

    function reenviarConfirmacaoEmail() {
        return requisitar('/auth/reenviar-confirmacao', { metodo: 'POST', corpo: {} });
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
        const dados = await requisitar(`/usuarios/${id}`, { metodo: 'PATCH', corpo: alteracoes });
        const { usuario } = dados;

        if (id === obterIdAtual()) {
            guardarUsuario(usuario);
        }

        if (dados.confirmacaoEnviada !== undefined) {
            usuario.confirmacaoEnviada = dados.confirmacaoEnviada;
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

    async function listarTarefas() {
        const { tarefas } = await requisitar('/tarefas');
        return tarefas;
    }

    async function criarTarefa(dados) {
        const { tarefa } = await requisitar('/tarefas', { metodo: 'POST', corpo: dados });
        return tarefa;
    }

    async function atualizarTarefa(id, alteracoes) {
        const { tarefa } = await requisitar(`/tarefas/${id}`, { metodo: 'PATCH', corpo: alteracoes });
        return tarefa;
    }

    async function excluirTarefa(id) {
        await requisitar(`/tarefas/${id}`, { metodo: 'DELETE' });
    }

    // Sessões de estudo: o horário planejado de uma tarefa. `de` e `ate` aceitam AAAA-MM-DD ou data e hora ISO.
    async function listarSessoes({ de, ate, situacao } = {}) {
        const consulta = new URLSearchParams();
        if (de) consulta.set('de', de);
        if (ate) consulta.set('ate', ate);
        if (situacao) consulta.set('situacao', situacao);
        const texto = consulta.toString();
        const { sessoes } = await requisitar(`/sessoes-estudo${texto ? `?${texto}` : ''}`);
        return sessoes;
    }

    async function criarSessao(dados) {
        const { sessao } = await requisitar('/sessoes-estudo', { metodo: 'POST', corpo: dados });
        return sessao;
    }

    async function atualizarSessao(id, alteracoes) {
        const { sessao } = await requisitar(`/sessoes-estudo/${id}`, { metodo: 'PATCH', corpo: alteracoes });
        return sessao;
    }

    async function excluirSessao(id) {
        await requisitar(`/sessoes-estudo/${id}`, { metodo: 'DELETE' });
    }

    // Sugestões de estudo da semana (o servidor Java aloca as tarefas nos horários livres). `semana` é um dia AAAA-MM-DD.
    function obterSugestoesGrade(semana) {
        return requisitar(`/grade/sugestoes${semana ? `?semana=${semana}` : ''}`);
    }

    function obterRelatorio(inicio) {
        const consulta = inicio ? `?inicio=${encodeURIComponent(inicio)}` : '';
        return requisitar(`/relatorios${consulta}`);
    }

    function obterSugestoesSofia(inicio) {
        const consulta = inicio ? `?inicio=${encodeURIComponent(inicio)}` : '';
        return requisitar(`/relatorios/sofia${consulta}`);
    }

    function listarConversaSofia(inicio) {
        const consulta = inicio ? `?inicio=${encodeURIComponent(inicio)}` : '';
        return requisitar(`/relatorios/sofia/conversa${consulta}`);
    }

    function abrirConversaSofia(inicio) {
        const consulta = inicio ? `?inicio=${encodeURIComponent(inicio)}` : '';
        return requisitar(`/relatorios/sofia/conversa/abrir${consulta}`, { metodo: 'POST' });
    }

    function enviarConversaSofia(inicio, texto) {
        return requisitar('/relatorios/sofia/conversa', {
            metodo: 'POST',
            corpo: { inicio, texto },
        });
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

    async function registrarSessaoPomodoro(dados) {
        const { sessao } = await requisitar('/sessoes-estudo/pomodoro', { metodo: 'POST', corpo: dados });
        return sessao;
    }

    async function analisarMetas() {
        const { leitura } = await requisitar('/metas/sofia', { metodo: 'POST', corpo: {} });
        return leitura;
    }

    async function sugerirMarcosMeta(dados) {
        const { sugestao } = await requisitar('/metas/sofia/marcos', { metodo: 'POST', corpo: dados });
        return sugestao;
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

    // Página para onde o usuário vai depois de entrar: grade normal ou o passo do onboarding
    // em que parou. A ordem segue o que a conta realmente usa: semestre, horários, metas, foco.
    async function paginaInicial() {
        if (await onboardingConcluido()) {
            return 'index_calendario.html';
        }

        const passos = {
            semestre: 'index_onboarding_semestre.html',
            horarios: 'index_onboarding_horarios.html',
            metas: 'index_onboarding_metas.html',
            foco: 'index_onboarding_foco.html',
        };

        let passo = '';

        try {
            passo = localStorage.getItem('acaistudy-onboarding-passo') || '';
        } catch {
            passo = '';
        }

        return passos[passo] || passos.semestre;
    }

    return {
        criarUsuario,
        entrar,
        sair,
        recuperarSenha,
        conferirLinkRedefinicao,
        redefinirSenha,
        conferirConfirmacaoEmail,
        confirmarEmail,
        reenviarConfirmacaoEmail,
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
        listarTarefas,
        criarTarefa,
        atualizarTarefa,
        excluirTarefa,
        listarSessoes,
        criarSessao,
        atualizarSessao,
        excluirSessao,
        obterSugestoesGrade,
        obterRelatorio,
        obterSugestoesSofia,
        listarConversaSofia,
        abrirConversaSofia,
        enviarConversaSofia,
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
        registrarSessaoPomodoro,
        analisarMetas,
        sugerirMarcosMeta,
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
