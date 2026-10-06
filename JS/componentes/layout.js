/**
 * Layout compartilhado — header e sidebar.
 * Uso: renderLayout({ paginaAtiva: 'disciplinas' })
 */

const ABAS = [
    { id: 'grade', href: 'index_calendario.html', rotulo: 'Grade' },
    { id: 'metas', href: 'index_metas.html', rotulo: 'Metas' },
    { id: 'disciplinas', href: 'index_disciplinas.html', rotulo: 'Disciplinas' },
    { id: 'relatorios', href: 'index_relatorios.html', rotulo: 'Relatórios' },
    { id: 'metricas', href: '#', rotulo: 'Métricas' },
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
    {
        id: 'rendimento',
        href: '#',
        icone: 'nav-rendimento.svg',
        rotulo: 'Rendimento & Foco',
        largura: 16.5,
        altura: 12.75,
    },
];

const DISCIPLINAS_ATIVAS = [
    { nome: 'Algoritmos & ED', cor: '#4F3466', horas: '4h' },
    { nome: 'Sistemas Operacionais', cor: '#1B1E36', horas: '3h' },
    { nome: 'Bancos de Dados', cor: '#10B981', horas: '2.5h' },
];

const PASTA_ICONES_PADRAO = 'assets/icons/layout';
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

function renderHeader({ paginaAtiva, pastaIcones }) {
    const abas = ABAS.map(
        (aba) =>
            `<a href="${aba.href}"${classeAtiva(paginaAtiva, aba.id)}>${aba.rotulo}</a>`
    ).join('\n            ');

    return `
    <header class="cabecalho-principal">

        <img class="logo" src="${icone(pastaIcones, 'logo.png')}" alt="AçaíStudy - Sua organização nos estudos" width="209" height="54">

        <nav class="abas">
            ${abas}
        </nav>

        <div class="itens-direita">

            <div class="alternador" role="group" aria-label="Visualização">
                <button type="button" class="ativo">Semana</button>
                <button type="button">Mês</button>
            </div>

            <div class="progresso-tarefas">
                <img src="${icone(pastaIcones, 'progresso-tarefas.svg')}" alt="" width="15" height="15">

                <div class="progresso-texto">
                    <span>Tarefas: <strong>18/24</strong> • <strong>75%</strong></span>
                </div>

                <div class="trilha-mini">
                    <span style="width: 75%"></span>
                </div>
            </div>

            <div class="menu-notificacoes">
                <button type="button" class="botao-notificacao" id="botao-notificacoes" aria-label="Notificações" aria-expanded="false" aria-controls="painel-notificacoes">
                    <img src="${icone(pastaIcones, 'notificacao.svg')}" alt="" width="13.33" height="16.67">
                    <span class="alerta-notificacao"></span>
                </button>

                <div class="painel-notificacoes" id="painel-notificacoes" hidden>
                    <div class="painel-notificacoes-cabecalho">
                        <strong>Notificações</strong>
                        <button type="button" class="link-notificacoes">Marcar todas como lidas</button>
                    </div>

                    <ul class="lista-notificacoes">
                        <li class="notificacao nao-lida">
                            <span class="notificacao-ponto"></span>
                            <div>
                                <p><strong>Sofia IA</strong> sugeriu realocar 1h30 para Algoritmos.</p>
                                <span class="notificacao-tempo">Há 12 min</span>
                            </div>
                        </li>
                        <li class="notificacao nao-lida">
                            <span class="notificacao-ponto"></span>
                            <div>
                                <p>Prazo do <strong>TCC — Capítulo 2</strong> em 4 dias.</p>
                                <span class="notificacao-tempo">Há 1 h</span>
                            </div>
                        </li>
                        <li class="notificacao">
                            <span class="notificacao-ponto"></span>
                            <div>
                                <p>Você concluiu <strong>3/4 blocos</strong> de hoje.</p>
                                <span class="notificacao-tempo">Hoje, 09:40</span>
                            </div>
                        </li>
                        <li class="notificacao">
                            <span class="notificacao-ponto"></span>
                            <div>
                                <p>Pomodoro finalizado: sessão de <strong>Cálculo I</strong>.</p>
                                <span class="notificacao-tempo">Ontem</span>
                            </div>
                        </li>
                    </ul>

                    <a href="#" class="painel-notificacoes-rodape">Ver todas as notificações</a>
                </div>
            </div>

            <span class="divisor-vertical"></span>

            <div class="menu-perfil">
                <button type="button" class="botao-perfil" id="botao-perfil" aria-label="Perfil e Configurações - Mariana Rocha" aria-expanded="false" aria-controls="painel-perfil">
                    <img src="${icone(pastaIcones, 'avatar-704c8e.png')}" alt="">
                </button>

                <div class="painel-perfil" id="painel-perfil" hidden>
                    <div class="painel-perfil-cabecalho">
                        <img src="${icone(pastaIcones, 'avatar-704c8e.png')}" alt="" width="40" height="40">
                        <div>
                            <strong>Mariana Rocha</strong>
                            <span>Engenharia de Software</span>
                        </div>
                    </div>

                    <nav class="lista-perfil">
                        <a href="index_perfil.html">Meu perfil</a>
                        <a href="#">Preferências</a>
                        <a href="#">Assinatura</a>
                        <a href="#">Ajuda</a>
                    </nav>

                    <button type="button" class="botao-sair">Sair da conta</button>
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

    const disciplinas = DISCIPLINAS_ATIVAS.map(
        (disciplina) => `
                <div class="disciplina" title="${disciplina.nome} • ${disciplina.horas}">
                    <div>
                        <span class="ponto-disciplina" style="background: ${disciplina.cor}"></span>
                        <span>${disciplina.nome}</span>
                    </div>
                    <span class="horas">${disciplina.horas}</span>
                </div>`
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

            <div class="lista-disciplinas">
${disciplinas}
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

function inicializarSidebar() {
    const botao = document.getElementById('botao-recolher-sidebar');

    if (!botao) {
        return;
    }

    aplicarEstadoSidebar(sidebarRecolhida());

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
    return criarMenuSuspenso({
        menuSeletor: '.menu-perfil',
        botaoId: 'botao-perfil',
        painelId: 'painel-perfil',
        aoAbrir,
    });
}

function substituirRaiz(seletor, html) {
    const raiz = document.querySelector(seletor);

    if (!raiz) {
        return;
    }

    raiz.insertAdjacentHTML('afterend', html.trim());
    raiz.remove();
}

function renderLayout(config = {}) {
    const {
        paginaAtiva = 'relatorios',
        pastaIcones = PASTA_ICONES_PADRAO,
        cabecalhoSeletor = '#cabecalho-raiz',
        barraSeletor = '#barra-lateral-raiz',
    } = config;

    substituirRaiz(cabecalhoSeletor, renderHeader({ paginaAtiva, pastaIcones }));
    substituirRaiz(barraSeletor, renderSidebar({ paginaAtiva, pastaIcones }));
    inicializarSidebar();

    const menus = {
        notificacoes: null,
        perfil: null,
    };

    menus.notificacoes = inicializarNotificacoes(() => menus.perfil?.fechar());
    menus.perfil = inicializarPerfil(() => menus.notificacoes?.fechar());
}

window.renderLayout = renderLayout;
window.renderHeader = renderHeader;
window.renderSidebar = renderSidebar;
