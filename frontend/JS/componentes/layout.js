/**
 * Layout compartilhado — header e sidebar.
 * Uso: renderLayout({ paginaAtiva: 'disciplinas' })
 */

const ABAS = [
    { id: 'grade', href: 'index_calendario.html', rotulo: 'Grade' },
    { id: 'metas', href: 'index_metas.html', rotulo: 'Metas' },
    { id: 'disciplinas', href: 'index_disciplinas.html', rotulo: 'Disciplinas' },
    { id: 'relatorios', href: 'index_relatorios.html', rotulo: 'Relatórios' },
];

const NAV_LATERAL = [
    {
        id: 'grade',
        href: 'index_calendario.html',
        icone: 'nav-cronograma.svg',
        rotulo: 'Cronograma Semanal',
        largura: 13.5,
        altura: 15,
    },
    {
        id: 'metas',
        href: 'index_metas.html',
        icone: 'nav-metas.svg',
        rotulo: 'Tarefas & Metas',
        largura: 13.5,
        altura: 13.5,
    },
    {
        id: 'disciplinas',
        href: 'index_disciplinas.html',
        icone: 'nav-disciplinas.svg',
        rotulo: 'Disciplinas & Blocos',
        largura: 12,
        altura: 15,
    },
    {
        id: 'relatorios',
        href: 'index_relatorios.html',
        icone: 'nav-relatorios.svg',
        rotulo: 'Relatórios Acadêmicos',
        largura: 12,
        altura: 15,
    },
];

const CORES_DISCIPLINA_HEX = {
    roxo: '#4F3466',
    azul: '#6750A4',
    verde: '#10B981',
    ambar: '#C9A74D',
};

const PASTA_ICONES_PADRAO = 'assets/icons/layout';
const AVATAR_PADRAO = 'assets/icons/avatar-padrao.svg';
const CHAVE_SIDEBAR = 'acaistudy-sidebar-recolhida';

function icone(pasta, arquivo) {
    return `${pasta}/${arquivo}`;
}

function classeAtiva(paginaAtiva, id) {
    return paginaAtiva === id ? ' class="ativo" aria-current="page"' : '';
}

function sidebarRecolhida() {
    return localStorage.getItem(CHAVE_SIDEBAR) === '1';
}

function escaparHtml(texto) {
    return String(texto ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

// Usuário salvo pelo login (JS/users/api.js); fallback para o mock.
function usuarioDoCabecalho() {
    let usuario = null;

    try {
        usuario = JSON.parse(localStorage.getItem('acaistudy-usuario'));
    } catch {
        usuario = null;
    }

    return {
        nome: escaparHtml(usuario?.nome || 'Sua conta'),
        curso: escaparHtml(usuario?.curso || ''),
        avatar: escaparHtml(usuario?.urlAvatar || AVATAR_PADRAO),
    };
}

function renderHeader({ paginaAtiva, pastaIcones, mostrarAlternador }) {
    const usuario = usuarioDoCabecalho();
    const abas = ABAS.map(
        (aba) =>
            `<a href="${aba.href}"${classeAtiva(paginaAtiva, aba.id)}>${aba.rotulo}</a>`
    ).join('\n            ');
    const alternador = mostrarAlternador
        ? `
            <div class="alternador" role="group" aria-label="Visualização">
                <button type="button" class="ativo" data-visao="semana" id="visao-semana">Semana</button>
                <button type="button" data-visao="mes" id="visao-mes">Mês</button>
            </div>`
        : '';

    return `
    <header class="cabecalho-principal">

        <img class="logo" src="${icone(pastaIcones, 'logo.png')}" alt="AçaíStudy - Sua organização nos estudos" width="209" height="54">

        <nav class="abas">
            ${abas}
        </nav>

        <div class="itens-direita">
            ${alternador}

            <div class="progresso-tarefas">
                <img src="${icone(pastaIcones, 'progresso-tarefas.svg')}" alt="" width="15" height="15">

                <div class="progresso-texto">
                    <span id="texto-tarefas-cabecalho">Rotina: <strong>0h</strong></span>
                </div>

                <div class="trilha-mini">
                    <span id="barra-tarefas-cabecalho" style="width: 0%"></span>
                </div>
            </div>

            <div class="menu-notificacoes">
                <button type="button" class="botao-notificacao" id="botao-notificacoes" aria-label="Notificações" aria-expanded="false" aria-controls="painel-notificacoes">
                    <img src="${icone(pastaIcones, 'notificacao.svg')}" alt="" width="13.33" height="16.67">
                    <span class="alerta-notificacao" id="alerta-notificacao" hidden></span>
                </button>

                <div class="painel-notificacoes" id="painel-notificacoes" hidden>
                    <div class="painel-notificacoes-cabecalho">
                        <strong>Notificações</strong>
                        <button type="button" class="link-notificacoes">Marcar todas como lidas</button>
                    </div>

                    <ul class="lista-notificacoes" id="lista-notificacoes">
                        <li class="notificacao">
                            <span class="notificacao-ponto"></span>
                            <div>
                                <p>Carregando avisos...</p>
                            </div>
                        </li>
                    </ul>

                    <a href="index_metas.html" class="painel-notificacoes-rodape">Ver tarefas e metas</a>
                </div>
            </div>

            <span class="divisor-vertical"></span>

            <div class="menu-perfil">
                <button type="button" class="botao-perfil" id="botao-perfil" aria-label="Perfil e Configurações - ${usuario.nome}" aria-expanded="false" aria-controls="painel-perfil">
                    <img src="${usuario.avatar}" alt="">
                </button>

                <div class="painel-perfil" id="painel-perfil" hidden>
                    <div class="painel-perfil-cabecalho">
                        <img src="${usuario.avatar}" alt="" width="40" height="40">
                        <div>
                            <strong>${usuario.nome}</strong>
                            <span>${usuario.curso}</span>
                        </div>
                    </div>

                    <nav class="lista-perfil">
                        <a href="index_perfil.html">Meu perfil</a>
                        <a href="index_configuracoes.html">Configurações</a>
                        <a href="#">Assinatura</a>
                        <a href="#">Ajuda</a>
                    </nav>

                    <a href="index_login.html" class="botao-sair">Sair da conta</a>
                </div>
            </div>

        </div>

    </header>`;
}

function renderSidebar({ paginaAtiva, pastaIcones }) {
    const navegacao = NAV_LATERAL.map(
        (item) => `
                <a href="${item.href}" title="${item.rotulo}"${classeAtiva(paginaAtiva, item.id)}>
                    <img src="${icone(pastaIcones, item.icone)}" alt="" width="${item.largura}" height="${item.altura}">
                    <span>${item.rotulo}</span>
                </a>`
    ).join('\n');

    return `
    <aside class="barra-lateral" id="barra-lateral">

        <div class="grupo-lateral">
            <p class="rotulo-lateral rotulo-pequeno">Ações Rápidas</p>

            <button type="button" class="botao-sessao" title="Iniciar Sessão">
                <img src="${icone(pastaIcones, 'iniciar.svg')}" alt="" width="8.25" height="10.5">
                <span>Iniciar Sessão</span>
            </button>
        </div>


        <div class="grupo-lateral grupo-navegacao">
            <p class="rotulo-lateral">Navegação</p>

            <nav class="navegacao">
${navegacao}
            </nav>
        </div>


        <div class="grupo-lateral grupo-disciplinas">
            <p class="rotulo-lateral rotulo-pequeno">Disciplinas Ativas</p>

            <div class="lista-disciplinas" id="lista-disciplinas-laterais">
                <p class="disciplina-vazia">Carregando...</p>
            </div>
        </div>


        <div class="rodape-lateral">
            <div class="pomodoro" title="Pomodoro: 25:00">
                <div>
                    <img src="${icone(pastaIcones, 'pomodoro.svg')}" alt="" width="13.5" height="15.75">
                    <span>Pomodoro: 25:00</span>
                </div>

                <button type="button">Configurar</button>
            </div>

            <button type="button" class="botao-recolher" id="botao-recolher-sidebar" aria-label="Minimizar menu" aria-controls="barra-lateral" aria-expanded="true" title="Minimizar menu">
                <img src="${icone(pastaIcones, 'recolher.svg')}" alt="" width="14" height="14">
                <span class="botao-recolher-texto">Recolher menu</span>
            </button>
        </div>

    </aside>`;
}

function aplicarEstadoSidebar(recolhida) {
    const barra = document.getElementById('barra-lateral');
    const botao = document.getElementById('botao-recolher-sidebar');
    const texto = botao?.querySelector('.botao-recolher-texto');

    document.body.classList.toggle('sidebar-recolhida', recolhida);

    if (barra) {
        barra.classList.toggle('recolhida', recolhida);
    }

    if (botao) {
        botao.setAttribute('aria-expanded', recolhida ? 'false' : 'true');
        botao.setAttribute('aria-label', recolhida ? 'Expandir menu' : 'Minimizar menu');
        botao.title = recolhida ? 'Expandir menu' : 'Minimizar menu';
    }

    if (texto) {
        texto.textContent = recolhida ? 'Expandir' : 'Recolher menu';
    }

    localStorage.setItem(CHAVE_SIDEBAR, recolhida ? '1' : '0');
}

function inicializarSidebar(recolhidaPadrao) {
    const botao = document.getElementById('botao-recolher-sidebar');

    if (!botao) {
        return;
    }

    const recolhida = typeof recolhidaPadrao === 'boolean'
        ? recolhidaPadrao
        : sidebarRecolhida();

    aplicarEstadoSidebar(recolhida);

    botao.addEventListener('click', () => {
        aplicarEstadoSidebar(!document.body.classList.contains('sidebar-recolhida'));
    });
}

function criarMenuSuspenso({ menuSeletor, botaoId, painelId, aoAbrir }) {
    const menu = document.querySelector(menuSeletor);
    const botao = document.getElementById(botaoId);
    const painel = document.getElementById(painelId);

    if (!menu || !botao || !painel) {
        return null;
    }

    function fechar() {
        painel.hidden = true;
        botao.setAttribute('aria-expanded', 'false');
        menu.classList.remove('aberto');
    }

    function abrir() {
        aoAbrir?.();
        painel.hidden = false;
        botao.setAttribute('aria-expanded', 'true');
        menu.classList.add('aberto');
    }

    botao.addEventListener('click', (evento) => {
        evento.stopPropagation();

        if (painel.hidden) {
            abrir();
        } else {
            fechar();
        }
    });

    painel.addEventListener('click', (evento) => {
        evento.stopPropagation();
    });

    document.addEventListener('click', fechar);

    document.addEventListener('keydown', (evento) => {
        if (evento.key === 'Escape') {
            fechar();
        }
    });

    return { abrir, fechar, botao, painel, menu };
}

function inicializarNotificacoes(aoAbrir) {
    const controle = criarMenuSuspenso({
        menuSeletor: '.menu-notificacoes',
        botaoId: 'botao-notificacoes',
        painelId: 'painel-notificacoes',
        aoAbrir,
    });

    if (!controle) {
        return null;
    }

    const marcarTodas = controle.menu.querySelector('.link-notificacoes');

    marcarTodas?.addEventListener('click', () => {
        controle.painel.querySelectorAll('.notificacao.nao-lida').forEach((item) => {
            item.classList.remove('nao-lida');
        });

        const alerta = controle.botao.querySelector('.alerta-notificacao');

        if (alerta) {
            alerta.hidden = true;
        }
    });

    return controle;
}

function inicializarPerfil(aoAbrir) {
    const controle = criarMenuSuspenso({
        menuSeletor: '.menu-perfil',
        botaoId: 'botao-perfil',
        painelId: 'painel-perfil',
        aoAbrir,
    });

    // Encerra a sessão na API e esquece o usuário salvo neste navegador antes de voltar ao login.
    controle?.painel.querySelector('.botao-sair')?.addEventListener('click', () => {
        if (typeof AcaiApi !== 'undefined') {
            AcaiApi.sair();
        }
    });

    return controle;
}

function substituirRaiz(seletor, html) {
    const raiz = document.querySelector(seletor);

    if (!raiz) {
        return;
    }

    raiz.insertAdjacentHTML('afterend', html.trim());
    raiz.remove();
}

function renderizarDisciplinasLaterais(disciplinas = []) {
    const lista = document.getElementById('lista-disciplinas-laterais');
    if (!lista) {
        return;
    }

    if (!disciplinas.length) {
        lista.innerHTML = '<p class="disciplina-vazia">Nenhuma disciplina ativa</p>';
        return;
    }

    lista.innerHTML = disciplinas.slice(0, 6).map((disciplina) => {
        const cor = CORES_DISCIPLINA_HEX[disciplina.cor] || CORES_DISCIPLINA_HEX.roxo;
        const nome = escaparHtml(disciplina.nome);
        const horas = disciplina.horasSemanais != null
            ? `${disciplina.horasSemanais}h`
            : '';
        return `
                <div class="disciplina" title="${nome}${horas ? ` • ${horas}` : ''}">
                    <div>
                        <span class="ponto-disciplina" style="background: ${cor}"></span>
                        <span>${nome}</span>
                    </div>
                    <span class="horas">${escaparHtml(horas)}</span>
                </div>`;
    }).join('\n');
}

const CHAVE_LIDAS = 'acaistudy-notificacoes-lidas';

function idsLidos() {
    try {
        const lista = JSON.parse(localStorage.getItem(CHAVE_LIDAS) || '[]');
        return new Set(Array.isArray(lista) ? lista : []);
    } catch {
        return new Set();
    }
}

function pintarCabecalho(cabecalho) {
    const rotina = cabecalho?.rotina || { horas: 0, metaHoras: null, percentual: null };
    const texto = document.getElementById('texto-tarefas-cabecalho');
    const barra = document.getElementById('barra-tarefas-cabecalho');
    if (texto) {
        texto.innerHTML = rotina.metaHoras
            ? `Rotina: <strong>${rotina.horas}h/${rotina.metaHoras}h</strong> • <strong>${rotina.percentual}%</strong>`
            : `Rotina: <strong>${rotina.horas}h</strong>`;
    }
    if (barra) {
        barra.style.width = `${Math.min(100, rotina.percentual || 0)}%`;
    }

    const lista = document.getElementById('lista-notificacoes');
    const alerta = document.getElementById('alerta-notificacao');
    const lidas = idsLidos();
    const avisos = cabecalho?.notificacoes || [];
    if (!lista) return;

    if (!avisos.length) {
        lista.innerHTML = '<li class="notificacao"><span class="notificacao-ponto"></span><div><p>Nenhum aviso no momento.</p></div></li>';
        if (alerta) alerta.hidden = true;
        return;
    }

    let naoLidas = 0;
    lista.innerHTML = avisos.map((aviso) => {
        const lida = lidas.has(aviso.id);
        if (!lida) naoLidas += 1;
        return `
            <li class="notificacao${lida ? '' : ' nao-lida'}" data-id="${escaparHtml(aviso.id)}">
                <span class="notificacao-ponto"></span>
                <div>
                    <p><a href="${escaparHtml(aviso.href || 'index_calendario.html')}">${escaparHtml(aviso.texto)}</a></p>
                    <span class="notificacao-tempo">${escaparHtml(aviso.quando)}</span>
                </div>
            </li>`;
    }).join('');
    if (alerta) alerta.hidden = naoLidas === 0;
}

async function carregarCabecalho() {
    if (typeof AcaiApi === 'undefined' || !AcaiApi.temUsuarioAtual?.()) return;

    try {
        await AcaiApi.verificarSessao?.();
        const salvo = JSON.parse(localStorage.getItem('acaistudy-usuario') || 'null');
        if (salvo?.nome) {
            document.querySelectorAll('.painel-perfil-cabecalho strong').forEach((el) => {
                el.textContent = salvo.nome;
            });
            const curso = document.querySelector('.painel-perfil-cabecalho span');
            if (curso) curso.textContent = salvo.curso || '';
            if (salvo.urlAvatar) {
                document.querySelectorAll('.botao-perfil img, .painel-perfil-cabecalho img').forEach((img) => {
                    img.src = salvo.urlAvatar;
                });
            }
        }
    } catch {
        // o perfil já desenhado no HTML continua valendo
    }

    try {
        pintarCabecalho(await AcaiApi.obterCabecalho());
    } catch {
        const texto = document.getElementById('texto-tarefas-cabecalho');
        if (texto) texto.textContent = 'Rotina indisponível';
    }

    document.querySelector('.link-notificacoes')?.addEventListener('click', () => {
        const ids = [...document.querySelectorAll('#lista-notificacoes [data-id]')]
            .map((item) => item.dataset.id);
        const atuais = idsLidos();
        ids.forEach((id) => atuais.add(id));
        localStorage.setItem(CHAVE_LIDAS, JSON.stringify([...atuais]));
        document.querySelectorAll('#lista-notificacoes .nao-lida').forEach((item) => {
            item.classList.remove('nao-lida');
        });
        const alerta = document.getElementById('alerta-notificacao');
        if (alerta) alerta.hidden = true;
    });
}

async function carregarDisciplinasLaterais() {
    if (typeof AcaiApi === 'undefined' || !AcaiApi.temUsuarioAtual?.()) {
        renderizarDisciplinasLaterais([]);
        return;
    }

    try {
        const disciplinas = await AcaiApi.listarDisciplinas({ situacao: 'ativa' });
        renderizarDisciplinasLaterais(disciplinas);
    } catch {
        renderizarDisciplinasLaterais([]);
    }
}

function renderLayout(config = {}) {
    const {
        paginaAtiva = 'relatorios',
        pastaIcones = PASTA_ICONES_PADRAO,
        cabecalhoSeletor = '#cabecalho-raiz',
        barraSeletor = '#barra-lateral-raiz',
        sidebarRecolhida: sidebarRecolhidaPadrao,
        mostrarAlternador = paginaAtiva === 'grade',
    } = config;

    substituirRaiz(cabecalhoSeletor, renderHeader({ paginaAtiva, pastaIcones, mostrarAlternador }));
    substituirRaiz(barraSeletor, renderSidebar({ paginaAtiva, pastaIcones }));
    inicializarSidebar(sidebarRecolhidaPadrao);

    const menus = {
        notificacoes: null,
        perfil: null,
    };

    menus.notificacoes = inicializarNotificacoes(() => menus.perfil?.fechar());
    menus.perfil = inicializarPerfil(() => menus.notificacoes?.fechar());
    carregarDisciplinasLaterais();
    carregarCabecalho();
    window.addEventListener('acaistudy:disciplinas-atualizadas', (evento) => {
        renderizarDisciplinasLaterais(evento.detail?.disciplinas || []);
    });
}

window.renderLayout = renderLayout;
window.renderHeader = renderHeader;
window.renderSidebar = renderSidebar;
