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
    indigo: '#1D4ED8',
    ciano: '#0891B2',
    turquesa: '#0F766E',
    verde: '#10B981',
    ambar: '#C9A74D',
    laranja: '#EA580C',
    vermelho: '#DC2626',
    rosa: '#DB2777',
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

            <button type="button" class="botao-sessao" id="botao-iniciar-sessao" title="Iniciar Sessão">
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
            <div class="pomodoro" id="pomodoro">
                <button type="button" class="pomodoro-alternar" id="pomodoro-alternar" title="Iniciar foco">
                    <img src="${icone(pastaIcones, 'pomodoro.svg')}" alt="" width="13.5" height="15.75">
                    <span id="pomodoro-rotulo">25:00</span>
                </button>
                <button type="button" class="pomodoro-configurar" id="pomodoro-configurar">Configurar</button>
            </div>
            <form class="pomodoro-painel" id="pomodoro-painel" hidden>
                <label>Foco <input id="pomodoro-foco" type="number" min="1" max="180" value="25"> min</label>
                <label>Pausa <input id="pomodoro-pausa" type="number" min="1" max="60" value="5"> min</label>
                <label>Pausa longa <input id="pomodoro-pausa-longa" type="number" min="1" max="60" value="15"> min</label>
                <label>Ciclos <input id="pomodoro-ciclos" type="number" min="2" max="8" value="4"></label>
                <button type="submit">Salvar</button>
            </form>

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

const CHAVE_POMODORO = 'acaistudy-pomodoro';
const CHAVE_FOCOS_PENDENTES = 'acaistudy-pomodoro-sessoes';

function padraoPomodoro() {
    return {
        focoMin: 25,
        pausaMin: 5,
        pausaLongaMin: 15,
        ciclos: 4,
        fase: 'foco',
        rodando: false,
        terminaEm: null,
        restanteMs: 25 * 60 * 1000,
        focosNoCiclo: 0,
        sessaoAtiva: false,
        aviso: null,
    };
}

function lerPomodoro() {
    try {
        const salvo = JSON.parse(localStorage.getItem(CHAVE_POMODORO) || 'null');
        if (!salvo || typeof salvo !== 'object') return padraoPomodoro();
        return { ...padraoPomodoro(), ...salvo };
    } catch {
        return padraoPomodoro();
    }
}

function gravarPomodoro(estado) {
    localStorage.setItem(CHAVE_POMODORO, JSON.stringify(estado));
}

function lerFocosPendentes() {
    try {
        const lista = JSON.parse(localStorage.getItem(CHAVE_FOCOS_PENDENTES) || '[]');
        return Array.isArray(lista) ? lista : [];
    } catch {
        return [];
    }
}

function minutosGastosNoFoco(estado) {
    if (estado.fase !== 'foco') {
        return 0;
    }
    const totalMs = estado.focoMin * 60000;
    const restante = restanteDoPomodoro(estado);
    return Math.min(estado.focoMin, Math.round((totalMs - restante) / 60000));
}

function guardarFoco(minutos, completo) {
    const inteiro = Math.round(Number(minutos));
    if (!Number.isInteger(inteiro) || inteiro < 1) {
        return;
    }
    const pendentes = lerFocosPendentes();
    pendentes.push({
        id: `${Date.now()}-${pendentes.length}`,
        minutos: inteiro,
        completo: Boolean(completo),
        fim: new Date().toISOString(),
    });
    localStorage.setItem(CHAVE_FOCOS_PENDENTES, JSON.stringify(pendentes.slice(-20)));
    enviarFocosPendentes();
}

let enviandoFocos = false;

async function enviarFocosPendentes() {
    if (enviandoFocos || typeof AcaiApi === 'undefined' || !AcaiApi.temUsuarioAtual?.() || !AcaiApi.registrarSessaoPomodoro) {
        return;
    }
    enviandoFocos = true;
    let enviou = false;
    try {
        for (const item of lerFocosPendentes()) {
            try {
                await AcaiApi.registrarSessaoPomodoro(item);
                const atuais = lerFocosPendentes().filter((pendente) => pendente.id !== item.id);
                localStorage.setItem(CHAVE_FOCOS_PENDENTES, JSON.stringify(atuais));
                enviou = true;
            } catch {
                break;
            }
        }
    } finally {
        enviandoFocos = false;
    }
    if (enviou) {
        window.dispatchEvent(new Event('acaistudy:pomodoro-registrado'));
    }
}

function minutosDaFase(estado) {
    if (estado.fase === 'pausa') return estado.pausaMin;
    if (estado.fase === 'pausaLonga') return estado.pausaLongaMin;
    return estado.focoMin;
}

function restanteDoPomodoro(estado) {
    if (estado.rodando && estado.terminaEm) {
        return Math.max(0, estado.terminaEm - Date.now());
    }
    return Math.max(0, Number(estado.restanteMs) || 0);
}

function formatarRelogio(ms) {
    const total = Math.ceil(ms / 1000);
    const minutos = Math.floor(total / 60);
    const segundos = total % 60;
    return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
}

function tocarSinalPomodoro() {
    try {
        const audio = new AudioContext();
        const oscilador = audio.createOscillator();
        const ganho = audio.createGain();
        oscilador.frequency.value = 880;
        ganho.gain.setValueAtTime(0.04, audio.currentTime);
        oscilador.connect(ganho);
        ganho.connect(audio.destination);
        oscilador.start();
        oscilador.stop(audio.currentTime + 0.2);
        oscilador.onended = () => audio.close();
    } catch {
        // o aviso na tela continua valendo se o navegador bloquear o som
    }
}

function mensagemPomodoro(faseEncerrada, proxima, minutos) {
    const tempo = formatarRelogio(minutos * 60000);
    if (faseEncerrada === 'foco') {
        const longa = proxima === 'pausaLonga';
        return {
            selo: longa ? 'Pausa longa programada' : 'Pausa programada',
            titulo: longa ? 'Hora da pausa longa' : 'Hora de pausar',
            texto: longa
                ? 'Os ciclos de foco fecharam. Levante, beba água e descanse antes do próximo bloco.'
                : 'O foco acabou. Uma pausa curta ajuda a manter o ritmo.',
            tempo,
            seguir: longa ? 'Começar pausa longa' : 'Começar pausa',
        };
    }
    return {
        selo: 'Pausa encerrada',
        titulo: 'De volta ao foco',
        texto: 'A pausa acabou. O próximo bloco de estudo está pronto.',
        tempo,
        seguir: 'Começar foco',
    };
}

let relogioPomodoro = null;
let verificarPomodoroAtual = () => {};
let avisoPomodoroLigado = false;

function inicializarPomodoro() {
    const caixa = document.getElementById('pomodoro');
    const rotulo = document.getElementById('pomodoro-rotulo');
    const alternar = document.getElementById('pomodoro-alternar');
    const configurar = document.getElementById('pomodoro-configurar');
    const painel = document.getElementById('pomodoro-painel');
    const botaoSessao = document.getElementById('botao-iniciar-sessao');
    if (!caixa || !rotulo || !alternar) return;

    if (relogioPomodoro) clearInterval(relogioPomodoro);

    let estado = lerPomodoro();
    document.getElementById('pomodoro-aviso')?.remove();
    const aviso = document.createElement('section');
    aviso.id = 'pomodoro-aviso';
    aviso.className = 'pomodoro-aviso';
    aviso.hidden = true;
    aviso.setAttribute('role', 'dialog');
    aviso.setAttribute('aria-modal', 'true');
    aviso.setAttribute('aria-labelledby', 'pomodoro-aviso-titulo');
    aviso.innerHTML = `
        <div class="pomodoro-aviso-cartao">
            <span class="pomodoro-aviso-selo" id="pomodoro-aviso-selo">Pausa programada</span>
            <strong id="pomodoro-aviso-titulo">Hora de pausar</strong>
            <p id="pomodoro-aviso-tempo">05:00</p>
            <p id="pomodoro-aviso-texto"></p>
            <div class="pomodoro-aviso-acoes">
                <button type="button" class="pomodoro-aviso-agora" id="pomodoro-aviso-fechar">Agora não</button>
                <button type="button" class="pomodoro-aviso-seguir" id="pomodoro-aviso-seguir">Começar pausa</button>
            </div>
        </div>`;
    document.body.appendChild(aviso);
    aviso.querySelector('#pomodoro-aviso-fechar').onclick = () => {
        estado.aviso = null;
        gravarPomodoro(estado);
        aviso.hidden = true;
    };
    aviso.querySelector('#pomodoro-aviso-seguir').onclick = () => {
        estado.aviso = null;
        aviso.hidden = true;
        iniciarPomodoro();
    };

    function mostrarAviso() {
        if (!estado.aviso) {
            aviso.hidden = true;
            return;
        }
        aviso.querySelector('#pomodoro-aviso-selo').textContent = estado.aviso.selo || 'Pausa programada';
        aviso.querySelector('#pomodoro-aviso-titulo').textContent = estado.aviso.titulo;
        aviso.querySelector('#pomodoro-aviso-tempo').textContent = estado.aviso.tempo || '';
        aviso.querySelector('#pomodoro-aviso-texto').textContent = estado.aviso.texto;
        aviso.querySelector('#pomodoro-aviso-seguir').textContent = estado.aviso.seguir;
        aviso.hidden = false;
    }

    function pintar() {
        const restante = restanteDoPomodoro(estado);
        const nomes = { foco: 'Foco', pausa: 'Pausa', pausaLonga: 'Pausa longa' };
        const nome = nomes[estado.fase] || 'Foco';
        rotulo.textContent = `${nome} ${formatarRelogio(restante)}`;
        alternar.title = estado.rodando ? `Pausar ${nome.toLowerCase()}` : `Iniciar ${nome.toLowerCase()}`;
        caixa.classList.toggle('rodando', estado.rodando);
        if (botaoSessao) {
            const texto = !estado.sessaoAtiva
                ? 'Iniciar Sessão'
                : estado.rodando
                    ? 'Encerrar sessão'
                    : 'Retomar sessão';
            const rotuloBotao = botaoSessao.querySelector('span');
            if (rotuloBotao) rotuloBotao.textContent = texto;
            botaoSessao.title = texto;
            botaoSessao.classList.toggle('em-andamento', Boolean(estado.sessaoAtiva));
        }
        mostrarAviso();
    }

    function concluirFase() {
        const encerrada = estado.fase;
        const minutosFoco = estado.focoMin;
        const focos = encerrada === 'foco' ? estado.focosNoCiclo + 1 : estado.focosNoCiclo;
        const longa = encerrada === 'foco' && focos >= estado.ciclos;
        const proxima = encerrada === 'foco' ? (longa ? 'pausaLonga' : 'pausa') : 'foco';
        const minutos = proxima === 'pausaLonga'
            ? estado.pausaLongaMin
            : proxima === 'pausa'
                ? estado.pausaMin
                : estado.focoMin;
        estado = {
            ...estado,
            fase: proxima,
            focosNoCiclo: encerrada === 'foco' ? (longa ? 0 : focos) : estado.focosNoCiclo,
            rodando: false,
            terminaEm: null,
            restanteMs: minutos * 60000,
            aviso: mensagemPomodoro(encerrada, proxima, minutos),
        };
        gravarPomodoro(estado);
        if (encerrada === 'foco') {
            guardarFoco(minutosFoco, true);
        }
        pintar();
        tocarSinalPomodoro();
    }

    function iniciarPomodoro() {
        const restante = restanteDoPomodoro(estado) || minutosDaFase(estado) * 60000;
        estado = {
            ...estado,
            sessaoAtiva: true,
            rodando: true,
            terminaEm: Date.now() + restante,
            restanteMs: restante,
            aviso: null,
        };
        gravarPomodoro(estado);
        pintar();
    }

    function comecarSessao() {
        const restante = estado.focoMin * 60000;
        estado = {
            ...estado,
            sessaoAtiva: true,
            fase: 'foco',
            focosNoCiclo: 0,
            rodando: true,
            terminaEm: Date.now() + restante,
            restanteMs: restante,
            aviso: null,
        };
        gravarPomodoro(estado);
        if (painel) painel.hidden = true;
        pintar();
    }

    function encerrarSessao() {
        if (estado.fase === 'foco') {
            guardarFoco(minutosGastosNoFoco(estado), false);
        }
        estado = {
            ...estado,
            sessaoAtiva: false,
            fase: 'foco',
            focosNoCiclo: 0,
            rodando: false,
            terminaEm: null,
            restanteMs: estado.focoMin * 60000,
            aviso: null,
        };
        gravarPomodoro(estado);
        pintar();
    }

    function pausarPomodoro() {
        estado = {
            ...estado,
            rodando: false,
            terminaEm: null,
            restanteMs: restanteDoPomodoro(estado),
        };
        gravarPomodoro(estado);
        pintar();
    }

    function verificarFim() {
        if (estado.rodando && restanteDoPomodoro(estado) <= 0) {
            concluirFase();
        } else {
            pintar();
        }
    }

    alternar.addEventListener('click', () => {
        if (estado.rodando) pausarPomodoro();
        else iniciarPomodoro();
    });

    botaoSessao?.addEventListener('click', () => {
        if (!estado.sessaoAtiva) comecarSessao();
        else if (estado.rodando) encerrarSessao();
        else iniciarPomodoro();
    });

    configurar?.addEventListener('click', () => {
        painel.hidden = !painel.hidden;
        if (!painel.hidden) {
            document.getElementById('pomodoro-foco').value = estado.focoMin;
            document.getElementById('pomodoro-pausa').value = estado.pausaMin;
            document.getElementById('pomodoro-pausa-longa').value = estado.pausaLongaMin;
            document.getElementById('pomodoro-ciclos').value = estado.ciclos;
        }
    });

    painel?.addEventListener('submit', (evento) => {
        evento.preventDefault();
        const numero = (id, minimo, maximo, atual) => {
            const valor = Number(document.getElementById(id).value);
            if (!Number.isFinite(valor)) return atual;
            return Math.min(maximo, Math.max(minimo, Math.round(valor)));
        };
        estado = {
            ...estado,
            focoMin: numero('pomodoro-foco', 1, 180, estado.focoMin),
            pausaMin: numero('pomodoro-pausa', 1, 60, estado.pausaMin),
            pausaLongaMin: numero('pomodoro-pausa-longa', 1, 60, estado.pausaLongaMin),
            ciclos: numero('pomodoro-ciclos', 2, 8, estado.ciclos),
        };
        if (!estado.rodando) {
            estado.restanteMs = minutosDaFase(estado) * 60000;
            estado.terminaEm = null;
        }
        gravarPomodoro(estado);
        painel.hidden = true;
        pintar();
    });

    if (estado.rodando && restanteDoPomodoro(estado) <= 0) concluirFase();
    else pintar();

    enviarFocosPendentes();
    relogioPomodoro = setInterval(verificarFim, 250);
    verificarPomodoroAtual = verificarFim;
    if (!avisoPomodoroLigado) {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') verificarPomodoroAtual();
        });
        avisoPomodoroLigado = true;
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
    inicializarPomodoro();
    window.addEventListener('acaistudy:disciplinas-atualizadas', (evento) => {
        renderizarDisciplinasLaterais(evento.detail?.disciplinas || []);
    });
}

window.renderLayout = renderLayout;
window.renderHeader = renderHeader;
window.renderSidebar = renderSidebar;
