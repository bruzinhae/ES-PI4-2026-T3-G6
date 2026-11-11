renderLayout({
    paginaAtiva: 'grade',
    sidebarRecolhida: true,
});

/* ---------- Tempo ---------- */

// Mesmo fuso fixo da API (FUSO_OFFSET, padrão -03:00): dia e hora da grade não dependem do fuso do navegador.
const FUSO_MINUTOS = -180;
const MINUTO = 60000;
const DIA = 24 * 60 * MINUTO;

const HORA_INICIAL = 7;
const TOTAL_HORAS = 14;
const ALTURA_LINHA = 56;

const DIAS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];
const DIAS_LONGOS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const dois = (n) => String(n).padStart(2, '0');
const plural = (n, singular, plural) => `${n} ${n === 1 ? singular : plural}`;
const paraLocal = (ms) => ms + FUSO_MINUTOS * MINUTO;
const deLocal = (ms) => ms - FUSO_MINUTOS * MINUTO;

function partes(ms) {
    const data = new Date(paraLocal(ms));
    return {
        ano: data.getUTCFullYear(),
        mes: data.getUTCMonth(),
        dia: data.getUTCDate(),
        hora: data.getUTCHours(),
        minuto: data.getUTCMinutes(),
        semana: (data.getUTCDay() + 6) % 7, // 0 = segunda
    };
}

const inicioDoDia = (ms) => deLocal(Math.floor(paraLocal(ms) / DIA) * DIA);
const inicioDaSemana = (ms) => inicioDoDia(ms) - partes(ms).semana * DIA;
const chaveDoDia = (ms) => new Date(paraLocal(ms)).toISOString().slice(0, 10);
const instante = (chave, minutos) => deLocal(Date.parse(`${chave}T00:00:00Z`) + minutos * MINUTO);
const minutosDoDia = (ms) => partes(ms).hora * 60 + partes(ms).minuto;
const horario = (ms) => `${dois(partes(ms).hora)}:${dois(partes(ms).minuto)}`;

function numeroDaSemana(ms) {
    const quinta = inicioDaSemana(ms) + 3 * DIA;
    const primeiraSemana = inicioDaSemana(instante(`${partes(quinta).ano}-01-04`, 0));
    return 1 + Math.round((inicioDaSemana(ms) - primeiraSemana) / (7 * DIA));
}

function formatarDuracao(minutos) {
    const h = Math.floor(minutos / 60);
    const m = Math.round(minutos % 60);

    if (h && m) return `${h}h ${m}m`;
    return h ? `${h}h` : `${m}m`;
}

function formatarDia(ms) {
    const p = partes(ms);
    return `${DIAS_LONGOS[p.semana]}, ${p.dia} de ${MESES[p.mes].toLowerCase()}`;
}

/* ---------- Referências e estado ---------- */

const listaTarefas = document.getElementById('lista-tarefas');
const gradeDias = document.getElementById('grade-dias');
const cabecalhoDias = document.getElementById('cabecalho-dias');
const fantasma = document.getElementById('fantasma-arrasto');
const seloPendentes = document.getElementById('selo-pendentes');
const eixoHoras = document.getElementById('eixo-horas');
const painelSemana = document.getElementById('visao-semana-painel');
const painelMes = document.getElementById('visao-mes-painel');
const mesGrade = document.getElementById('mes-grade');
const tituloSemana = document.getElementById('titulo-semana');
const botaoSugerir = document.getElementById('botao-sofia-organizar');
const barraSugestoes = document.getElementById('barra-sugestoes');
const textoSugestoes = document.getElementById('texto-sugestoes');

const modal = document.getElementById('modal-tarefa');
const formulario = document.getElementById('formulario-tarefa');
const campoTitulo = document.getElementById('titulo-tarefa');
const campoCategoria = document.getElementById('tipo-tarefa');
const campoTag = document.getElementById('tag-tarefa');
const campoTipo = document.getElementById('kind-tarefa');
const campoDisciplina = document.getElementById('disciplina-tarefa');
const campoPrazo = document.getElementById('prazo-tarefa');
const campoDetalhe = document.getElementById('local-tarefa');
const campoDuracao = document.getElementById('duracao-tarefa');
const campoPrioridade = document.getElementById('prioridade-tarefa');
const campoNotas = document.getElementById('notas-tarefa');
const campoId = document.getElementById('tarefa-id');
const botaoExcluir = document.getElementById('excluir-tarefa');
const valorDuracao = document.getElementById('valor-duracao');
const valorPrioridade = document.getElementById('valor-prioridade');
const contadorTitulo = document.getElementById('contador-titulo');

const modalSessao = document.getElementById('modal-sessao');

const estado = {
    inicioSemana: inicioDaSemana(Date.now()),
    mes: { ano: partes(Date.now()).ano, mes: partes(Date.now()).mes },
    visao: 'semana',
    tarefas: [],
    blocos: [],
    sessoes: [],
    sugestoes: [],
    semAlocacao: 0,
    metaHoras: null,
    carga: 0, // identifica a última carga, para ignorar respostas antigas
};

let itemArrastado = null;
let bloqueioClique = false;
let detalheAberto = null;

function el(tag, classe, texto) {
    const elemento = document.createElement(tag);
    if (classe) elemento.className = classe;
    if (texto !== undefined) elemento.textContent = texto;
    return elemento;
}

// AcaiAvisos é um `const` global (não vira propriedade de window), por isso o typeof.
function avisar(texto, tipo = 'erro') {
    if (typeof AcaiAvisos !== 'undefined') AcaiAvisos.mostrar(texto, tipo);
    else window.alert(texto);
}

/* ---------- Dados ---------- */

function apresentarTarefa(tarefa) {
    const categoria = tarefa.categoria === 'pessoal' ? 'pessoal' : 'estudos';
    const minutos = tarefa.minutosEstimados || 60;
    const prazo = tarefa.prazo ? new Date(tarefa.prazo) : null;

    return {
        id: tarefa.id,
        titulo: tarefa.titulo,
        categoria,
        tipo: tarefa.tipo || 'outro',
        disciplinaId: tarefa.disciplinaId || '',
        tag: tarefa.etiqueta || (categoria === 'pessoal' ? 'Pessoal' : 'Estudo'),
        detalhe: tarefa.local || '',
        notas: tarefa.observacoes || '',
        prioridade: tarefa.prioridade || 5,
        minutos,
        prazo: prazo ? dataParaCampo(prazo) : '',
        prazoLabel: prazo
            ? prazo.toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
            : 'Sem prazo',
    };
}

function dataParaCampo(data) {
    const local = new Date(data.getTime() - data.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
}

function payloadTarefa(dados) {
    return {
        titulo: dados.titulo,
        categoria: dados.categoria,
        tipo: dados.tipo,
        disciplinaId: dados.disciplinaId || null,
        etiqueta: dados.tag,
        prazo: dados.prazo ? new Date(dados.prazo).toISOString() : null,
        minutosEstimados: dados.minutos,
        prioridade: dados.prioridade,
        local: dados.detalhe || null,
        observacoes: dados.notas || null,
    };
}

async function carregarTarefas() {
    try {
        estado.tarefas = (await AcaiApi.listarTarefas()).map(apresentarTarefa);
    } catch (erro) {
        estado.tarefas = [];
        avisar(erro.message || 'Não foi possível carregar as tarefas.');
    }
    renderLista();
}

async function carregarBase() {
    const [blocos, disciplinas, usuario] = await Promise.allSettled([
        AcaiApi.listarBlocosFixos(),
        AcaiApi.listarDisciplinasAtivas(),
        AcaiApi.obterUsuarioAtual(),
    ]);

    estado.blocos = blocos.status === 'fulfilled' ? blocos.value : [];
    if (blocos.status === 'rejected') avisar(blocos.reason?.message || 'Não foi possível carregar os blocos fixos.');

    if (disciplinas.status === 'fulfilled') {
        campoDisciplina.append(...disciplinas.value.map((disciplina) => {
            const opcao = el('option', null, disciplina.nome);
            opcao.value = disciplina.id;
            return opcao;
        }));
    }

    estado.metaHoras = usuario.status === 'fulfilled' ? usuario.value?.metaSemanalHoras || null : null;
}

// Período visível [de, ate): a semana, ou as 6 semanas da grade do mês.
function intervaloVisivel() {
    if (estado.visao === 'mes') {
        const inicio = inicioDaGradeDoMes();
        return [inicio, inicio + 42 * DIA];
    }
    return [estado.inicioSemana, estado.inicioSemana + 7 * DIA];
}

async function carregarSessoes() {
    const carga = ++estado.carga;
    const [de, ate] = intervaloVisivel();

    try {
        const sessoes = await AcaiApi.listarSessoes({ de: chaveDoDia(de), ate: chaveDoDia(ate) });
        if (carga !== estado.carga) return;
        estado.sessoes = sessoes.filter((sessao) => ['agendada', 'concluida'].includes(sessao.situacao));
    } catch (erro) {
        if (carga !== estado.carga) return;
        estado.sessoes = [];
        avisar(erro.message || 'Não foi possível carregar as sessões de estudo.');
    }
}

async function recarregar() {
    await carregarSessoes();
    renderizar();
}

/* ---------- Eixo, cabeçalho e título ---------- */

function montarEixoHoras() {
    eixoHoras.replaceChildren();

    for (let i = 0; i < TOTAL_HORAS; i += 1) {
        eixoHoras.appendChild(el('div', 'hora-marca', `${dois(HORA_INICIAL + i)}:00`));
    }
}

function renderTitulo() {
    let texto;
    let complemento;

    if (estado.visao === 'mes') {
        texto = `${MESES[estado.mes.mes]}, ${estado.mes.ano}`;
        complemento = '(visão mensal)';
    } else {
        const a = partes(estado.inicioSemana);
        const b = partes(estado.inicioSemana + 6 * DIA);
        const faixa = a.mes === b.mes
            ? `${a.dia} a ${b.dia} de ${MESES[a.mes]}`
            : `${a.dia} de ${MESES[a.mes].slice(0, 3)} a ${b.dia} de ${MESES[b.mes].slice(0, 3)}`;
        texto = `${faixa}, ${b.ano}`;
        complemento = `(Semana ${numeroDaSemana(estado.inicioSemana)})`;
    }

    tituloSemana.replaceChildren(`${texto} `, el('span', null, complemento));
}

function renderCabecalho() {
    const hoje = chaveDoDia(Date.now());

    cabecalhoDias.replaceChildren(el('div', 'canto-vazio'), ...DIAS.map((nome, i) => {
        const dia = estado.inicioSemana + i * DIA;
        const coluna = el('div', `dia-coluna${chaveDoDia(dia) === hoje ? ' hoje' : ''}`);
        coluna.append(el('span', null, nome), el('strong', null, String(partes(dia).dia)));
        if (chaveDoDia(dia) === hoje) coluna.append(el('em', null, 'HOJE'));
        return coluna;
    }));
}

/* ---------- Lista de tarefas pendentes ---------- */

function atualizarContador() {
    const total = listaTarefas.querySelectorAll('.tarefa:not([hidden])').length;
    seloPendentes.textContent = total === 1 ? '1 pendente' : `${total} pendentes`;
}

function criarCardLista(tarefa) {
    const card = el('article', `tarefa${tarefa.prioridade >= 8 ? ' urgente' : ''}`);
    card.draggable = true;
    card.dataset.id = tarefa.id;
    card.dataset.titulo = tarefa.titulo;
    card.dataset.tag = tarefa.tag;
    card.dataset.minutos = String(tarefa.minutos);
    card.dataset.filtro = [tarefa.categoria, tarefa.prioridade >= 8 ? 'alta' : ''].join(' ').trim();

    const topo = el('div', 'tarefa-topo');
    topo.append(el('strong', null, tarefa.titulo), el('span', 'duracao', formatarDuracao(tarefa.minutos)));

    const meta = el('div', 'tarefa-meta');
    meta.append(
        el('span', `tag ${tarefa.categoria}`, `#${tarefa.tag}`),
        el('span', `prazo${tarefa.prioridade >= 8 ? ' critico' : ''}`, tarefa.prazoLabel),
    );

    card.append(topo, meta);
    return card;
}

function filtrarTarefas(filtro, busca) {
    const termo = busca.trim().toLowerCase();

    listaTarefas.querySelectorAll('.tarefa').forEach((tarefa) => {
        const filtros = (tarefa.dataset.filtro || '').split(' ');
        const bateFiltro = filtro === 'todos' || filtros.includes(filtro);
        const bateBusca = !termo || `${tarefa.dataset.titulo} ${tarefa.dataset.tag}`.toLowerCase().includes(termo);
        tarefa.hidden = !(bateFiltro && bateBusca);
    });

    atualizarContador();
}

function renderLista() {
    listaTarefas.replaceChildren(...estado.tarefas.map(criarCardLista));
    filtrarTarefas(document.querySelector('.filtro.ativo')?.dataset.filtro || 'todos', document.getElementById('busca-tarefas').value);
}

/* ---------- Grade semanal ---------- */

function classeDoBloco(categoria) {
    return ['aulas', 'trabalho'].includes(categoria) ? 'aula' : 'pessoal';
}

function chipDoBloco(categoria) {
    return classeDoBloco(categoria) === 'aula' ? 'aulas' : 'pessoal';
}

// Blocos fixos que caem no dia (semanais pelo dia da semana, únicos pela data).
function blocosDoDia(chave, diaDaSemana) {
    return estado.blocos.filter((bloco) => {
        const intervalo = { semanal: 1, quinzenal: 2, a_cada_3_semanas: 3 }[bloco.recorrencia];
        if (!intervalo) return (bloco.data || '').slice(0, 10) === chave;
        if (!bloco.diasSemana.includes(diaDaSemana)) return false;
        const [ano, mes, dia] = chave.split('-').map(Number);
        const data = new Date(ano, mes - 1, dia);
        const inicioRecorrencia = bloco.inicioRecorrencia;
        const criado = inicioRecorrencia
            ? (typeof inicioRecorrencia === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(inicioRecorrencia)
                ? new Date(`${inicioRecorrencia}T12:00:00`)
                : new Date(inicioRecorrencia))
            : bloco.criadoEm ? new Date(bloco.criadoEm) : data;
        const inicio = new Date(criado.getFullYear(), criado.getMonth(), criado.getDate());
        inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7));
        const semana = Math.floor((data - inicio) / (7 * 24 * 60 * 60 * 1000));
        return semana >= 0 && semana % intervalo === 0;
    });
}

function inicioDoBloco(bloco, chave) {
    const [h, m] = bloco.horaInicio.split(':').map(Number);
    return instante(chave, h * 60 + m);
}

function tarefaDaSessao(sessao) {
    return estado.tarefas.find((tarefa) => tarefa.id === String(sessao.tarefaId));
}

// Bloco da grade para um intervalo [inicio, fim) de um dia. Devolve null se ficar fora das 07:00–21:00.
function criarEvento({ classe, titulo, detalhe, extra, inicio, fim }) {
    const ini = Math.max(minutosDoDia(inicio), HORA_INICIAL * 60);
    const fimMin = Math.min(minutosDoDia(inicio) + (fim - inicio) / MINUTO, (HORA_INICIAL + TOTAL_HORAS) * 60);
    if (fimMin <= ini) return null;

    // curto (< 45 min) esconde os detalhes; médio (< 90 min) esconde só a linha de foco da sugestão.
    const tamanho = fimMin - ini < 45 ? ' curto' : fimMin - ini < 90 ? ' medio' : '';
    const evento = el('div', `evento ${classe}${tamanho}`);
    evento.style.setProperty('--inicio', String((ini - HORA_INICIAL * 60) / 60));
    evento.style.setProperty('--duracao', String((fimMin - ini) / 60));
    evento.append(
        el('strong', null, titulo),
        el('small', null, `${horario(inicio)} – ${horario(fim)}${detalhe ? ` · ${detalhe}` : ''}`),
    );
    if (extra) evento.append(el('span', null, extra));
    return evento;
}

function colunaDoInstante(ms) {
    const indice = Math.floor((inicioDoDia(ms) - estado.inicioSemana) / DIA);
    return indice >= 0 && indice < 7 ? gradeDias.children[indice] : null;
}

function renderGrade() {
    const hoje = chaveDoDia(Date.now());

    Array.from(gradeDias.children).forEach((coluna, i) => {
        const dia = estado.inicioSemana + i * DIA;
        const chave = chaveDoDia(dia);

        coluna.replaceChildren();
        coluna.dataset.data = chave;
        coluna.classList.toggle('hoje', chave === hoje);

        blocosDoDia(chave, i).forEach((bloco) => {
            const inicio = inicioDoBloco(bloco, chave);
            const evento = criarEvento({
                classe: `${classeDoBloco(bloco.categoria)} bloco-fixo`,
                titulo: bloco.nome,
                detalhe: bloco.local,
                inicio,
                fim: inicio + bloco.duracaoMinutos * MINUTO,
            });
            if (!evento) return;
            evento.dataset.bloco = bloco.id || bloco._id;
            evento.dataset.data = chave;
            evento.tabIndex = 0;
            coluna.appendChild(evento);
        });
    });

    estado.sessoes.forEach((sessao) => {
        const inicio = Date.parse(sessao.inicio);
        const fim = Date.parse(sessao.fim);
        const coluna = colunaDoInstante(inicio);
        if (!coluna) return;

        const tarefa = tarefaDaSessao(sessao);
        const concluida = sessao.situacao === 'concluida';
        const evento = criarEvento({
            classe: `${tarefa?.categoria === 'pessoal' ? 'pessoal' : 'estudo'}${concluida ? ' concluido' : ''} sessao`,
            titulo: sessao.titulo,
            detalhe: formatarDuracao((fim - inicio) / MINUTO),
            extra: concluida ? 'Concluída' : sessao.origem === 'ia' ? '#Sofia' : '',
            inicio,
            fim,
        });
        if (!evento) return;
        evento.dataset.sessao = sessao.id;
        evento.draggable = !concluida;
        evento.tabIndex = 0;
        coluna.appendChild(evento);
    });

    estado.sugestoes.forEach((sugestao, indice) => {
        const inicio = Date.parse(sugestao.inicio);
        const fim = Date.parse(sugestao.fim);
        const coluna = colunaDoInstante(inicio);
        if (!coluna) return;

        const evento = criarEvento({
            classe: 'estudo sugestao',
            titulo: sugestao.titulo,
            detalhe: formatarDuracao(sugestao.minutos),
            inicio,
            fim,
        });
        if (!evento) return;

        evento.dataset.sugestao = String(indice);
        evento.append(el('em', null, `Foco: ${sugestao.foco} · Sem conflitos`));

        const acoes = el('div', 'sugestao-acoes');
        [['aceitar', '✓', 'Aceitar'], ['recusar', '✕', 'Recusar']].forEach(([acao, icone, rotulo]) => {
            const botao = el('button');
            botao.type = 'button';
            botao.dataset.acao = acao;
            botao.title = `${rotulo} sugestão`;
            botao.setAttribute('aria-label', `${rotulo} sugestão de ${sugestao.titulo}`);
            botao.append(el('b', null, icone), el('i', null, ` ${rotulo}`));
            acoes.appendChild(botao);
        });
        evento.append(acoes);
        coluna.appendChild(evento);
    });
}

/* ---------- Visão mensal ---------- */

function inicioDaGradeDoMes() {
    const primeiro = instante(`${estado.mes.ano}-${dois(estado.mes.mes + 1)}-01`, 0);
    return primeiro - ((partes(primeiro).semana + 1) % 7) * DIA; // a grade começa no domingo
}

// Tudo o que cai num dia do mês, em ordem de horário.
function itensDoDia(dia) {
    const chave = chaveDoDia(dia);
    const itens = [];

    blocosDoDia(chave, partes(dia).semana).forEach((bloco) => {
        itens.push({ tipo: 'bloco', chip: chipDoBloco(bloco.categoria), titulo: bloco.nome, inicio: inicioDoBloco(bloco, chave), bloco, chave });
    });

    estado.sessoes.filter((sessao) => chaveDoDia(Date.parse(sessao.inicio)) === chave).forEach((sessao) => {
        itens.push({ tipo: 'sessao', chip: tarefaDaSessao(sessao)?.categoria === 'pessoal' ? 'pessoal' : 'estudos', titulo: sessao.titulo, inicio: Date.parse(sessao.inicio), sessao });
    });

    return itens.sort((a, b) => a.inicio - b.inicio);
}

function renderMes() {
    const hoje = chaveDoDia(Date.now());
    const semanaDeHoje = inicioDaSemana(Date.now());
    const inicioGrade = inicioDaGradeDoMes();

    mesGrade.replaceChildren();

    for (let i = 0; i < 42; i += 1) {
        const dia = inicioGrade + i * DIA;
        const p = partes(dia);
        const noMes = p.mes === estado.mes.mes;
        const itens = noMes ? itensDoDia(dia) : [];
        const visiveis = itens.slice(0, 4);

        const celula = el('div', 'mes-dia');
        celula.tabIndex = 0;
        celula.setAttribute('role', 'button');
        celula.setAttribute('aria-label', `${p.dia} de ${MESES[p.mes].toLowerCase()}${itens.length ? `, ${itens.length} item(ns)` : ''}`);
        celula.dataset.dia = String(dia);
        if (!noMes) celula.classList.add('fora');
        if (p.semana >= 5) celula.classList.add('fim-semana');
        if (chaveDoDia(dia) === hoje) celula.classList.add('hoje');
        if (noMes && inicioDaSemana(dia) === semanaDeHoje) celula.classList.add('semana-atual');

        const topo = el('div', 'mes-topo');
        topo.append(el('span', 'mes-numero', String(p.dia)));
        if (chaveDoDia(dia) === hoje) topo.append(el('span', 'mes-selo-hoje', 'Hoje'));
        else if (itens.length) topo.append(el('span', 'mes-contagem', String(itens.length)));

        const lista = el('div', 'mes-eventos');
        visiveis.forEach((item, indice) => {
            const chip = el('button', `mes-chip ${item.chip}`);
            chip.type = 'button';
            chip.dataset.indice = String(indice);
            chip.title = item.titulo;
            chip.append(el('span', 'mes-chip-hora', horario(item.inicio)), el('span', 'mes-chip-titulo', item.titulo));
            chip.addEventListener('click', (evento) => {
                evento.stopPropagation();
                abrirDetalhes(item);
            });
            lista.appendChild(chip);
        });
        if (itens.length > visiveis.length) lista.append(el('button', 'mes-mais', `+${itens.length - visiveis.length} mais`));
        if (noMes && !itens.length) lista.append(el('span', 'mes-vazio', 'Livre'));

        celula.append(topo, lista);
        mesGrade.appendChild(celula);
    }
}

/* ---------- Rodapé e barra de sugestões ---------- */

function minutosDeSessoes(sessoes) {
    return sessoes.reduce((soma, sessao) => soma + (Date.parse(sessao.fim) - Date.parse(sessao.inicio)) / MINUTO, 0);
}

function renderRodape() {
    const mes = estado.visao === 'mes';
    const doPeriodo = mes
        ? estado.sessoes.filter((sessao) => partes(Date.parse(sessao.inicio)).mes === estado.mes.mes)
        : estado.sessoes;
    const minutos = minutosDeSessoes(doPeriodo);
    const meta = estado.metaHoras ? estado.metaHoras * (mes ? 4 : 1) : null;
    const concluidas = doPeriodo.filter((sessao) => sessao.situacao === 'concluida').length;

    document.getElementById('carga-rotulo').textContent = mes ? 'Estudo agendado no mês' : 'Estudo agendado na semana';
    document.getElementById('carga-valor').textContent = `${formatarDuracao(minutos) || '0h'} agendados${meta ? ` / ${meta}h meta` : ''}`;
    document.getElementById('carga-trilha').style.width = `${meta ? Math.min(100, Math.round((minutos / 60 / meta) * 100)) : 0}%`;
    document.getElementById('sessoes-valor').textContent = `${doPeriodo.length} · ${plural(concluidas, 'concluída', 'concluídas')}`;
}

function renderBarraSugestoes() {
    const total = estado.sugestoes.length;
    barraSugestoes.hidden = total === 0 || estado.visao !== 'semana';
    if (!total) return;

    textoSugestoes.textContent = `A Sofia sugeriu ${plural(total, 'sessão', 'sessões')} de estudo para esta semana`
        + (estado.semAlocacao ? ` · ${plural(estado.semAlocacao, 'tarefa', 'tarefas')} sem espaço suficiente` : '');
}

function renderizar() {
    renderTitulo();
    if (estado.visao === 'mes') renderMes();
    else {
        renderCabecalho();
        renderGrade();
    }
    renderRodape();
    renderBarraSugestoes();
}

/* ---------- Navegação e visões ---------- */

async function alternarVisao(visao) {
    const modo = visao === 'mes' ? 'mes' : 'semana';
    if (modo === 'mes') estado.mes = { ano: partes(estado.inicioSemana + 3 * DIA).ano, mes: partes(estado.inicioSemana + 3 * DIA).mes };

    estado.visao = modo;
    estado.sugestoes = [];

    document.querySelectorAll('.cabecalho-principal .alternador button').forEach((botao) => {
        botao.classList.toggle('ativo', botao.dataset.visao === modo);
    });
    painelSemana.hidden = modo === 'mes';
    painelMes.hidden = modo !== 'mes';
    document.body.dataset.visaoCalendario = modo;

    await recarregar();
}

async function irParaSemanaDe(ms) {
    estado.inicioSemana = inicioDaSemana(ms);
    await alternarVisao('semana');
}

async function mover(direcao) {
    estado.sugestoes = [];

    if (estado.visao === 'mes') {
        const referencia = new Date(Date.UTC(estado.mes.ano, estado.mes.mes + direcao, 1));
        estado.mes = { ano: referencia.getUTCFullYear(), mes: referencia.getUTCMonth() };
    } else {
        estado.inicioSemana += direcao * 7 * DIA;
    }

    await recarregar();
}

/* ---------- Sessões: criar, mover, remover ---------- */

function alvoDoSolte(evento) {
    const coluna = evento.target.closest('.coluna-dia');
    if (!coluna) return null;

    const y = Math.max(0, evento.clientY - coluna.getBoundingClientRect().top);
    const meiasHoras = Math.min(Math.round((y / ALTURA_LINHA) * 2), TOTAL_HORAS * 2 - 1);
    const minutos = HORA_INICIAL * 60 + meiasHoras * 30;

    return { chave: coluna.dataset.data, minutos, inicio: instante(coluna.dataset.data, minutos) };
}

async function agendarTarefa(card, alvo) {
    const pedido = Number(card.dataset.minutos) || 60;
    const duracao = Math.max(15, Math.min(pedido, HORA_INICIAL * 60 + TOTAL_HORAS * 60 - alvo.minutos)); // não passa das 21:00

    try {
        await AcaiApi.criarSessao({
            tarefaId: card.dataset.id,
            inicio: new Date(alvo.inicio).toISOString(),
            fim: new Date(alvo.inicio + duracao * MINUTO).toISOString(),
            origem: 'manual',
        });
    } catch (erro) {
        avisar(erro.message || 'Não foi possível agendar a sessão.');
    }
    await recarregar();
}

async function moverSessao(id, alvo) {
    const sessao = estado.sessoes.find((item) => item.id === id);
    if (!sessao) return;

    const duracao = Date.parse(sessao.fim) - Date.parse(sessao.inicio);

    try {
        await AcaiApi.atualizarSessao(id, {
            inicio: new Date(alvo.inicio).toISOString(),
            fim: new Date(alvo.inicio + duracao).toISOString(),
        });
    } catch (erro) {
        avisar(erro.message || 'Não foi possível mover a sessão.');
    }
    await recarregar();
}

function linhaDeDetalhe(lista, rotulo, valor) {
    if (!valor) return;
    lista.append(el('dt', null, rotulo), el('dd', null, valor));
}

function abrirDetalhes(item) {
    detalheAberto = item;
    const lista = document.getElementById('detalhes-sessao');
    lista.replaceChildren();

    const ehSessao = item.tipo === 'sessao';
    const concluida = ehSessao && item.sessao.situacao === 'concluida';
    const inicio = ehSessao ? Date.parse(item.sessao.inicio) : item.inicio;
    const duracao = ehSessao ? (Date.parse(item.sessao.fim) - inicio) / MINUTO : item.bloco.duracaoMinutos;

    document.getElementById('titulo-modal-sessao').textContent = item.titulo;
    document.getElementById('etiqueta-modal-sessao').textContent = ehSessao ? (concluida ? 'Concluída' : 'Agendada') : 'Bloco fixo';
    document.getElementById('subtitulo-modal-sessao').textContent = `${formatarDia(inicio)} · ${horario(inicio)} – ${horario(inicio + duracao * MINUTO)}`;

    linhaDeDetalhe(lista, 'Duração', formatarDuracao(duracao));
    if (ehSessao) {
        linhaDeDetalhe(lista, 'Tarefa', tarefaDaSessao(item.sessao)?.titulo);
        linhaDeDetalhe(lista, 'Origem', item.sessao.origem === 'ia' ? 'Sugerida pela Sofia' : 'Agendada por você');
        if (concluida && item.sessao.minutosRealizados) linhaDeDetalhe(lista, 'Realizado', formatarDuracao(item.sessao.minutosRealizados));
    } else {
        linhaDeDetalhe(lista, 'Categoria', item.bloco.categoria);
        linhaDeDetalhe(lista, 'Local', item.bloco.local);
        const repeticao = { semanal: 'Toda semana', quinzenal: 'A cada 2 semanas', a_cada_3_semanas: 'A cada 3 semanas', unico: 'Só neste dia' };
        linhaDeDetalhe(lista, 'Repete', repeticao[item.bloco.recorrencia] || 'Só neste dia');
        lista.append(el('dt', null, 'Edição'), el('dd', null, 'Blocos fixos são editados na tela de horários.'));
    }

    document.getElementById('remover-sessao').hidden = !ehSessao;
    document.getElementById('concluir-sessao').hidden = !ehSessao || concluida;
    modalSessao.classList.add('aberto');
    modalSessao.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-aberto');
}

function fecharDetalhes() {
    detalheAberto = null;
    modalSessao.classList.remove('aberto');
    modalSessao.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-aberto');
}

async function alterarSessaoAberta(acao) {
    const sessao = detalheAberto?.sessao;
    if (!sessao) return;

    try {
        if (acao === 'remover') {
            const confirmou = await AcaiAvisos.confirmar({
                titulo: 'Remover sessão?',
                texto: `A sessão "${sessao.titulo}" será removida da grade. A tarefa continua pendente.`,
                confirmar: 'Remover',
                cancelar: 'Voltar',
                perigo: true,
            });
            if (!confirmou) return;
            await AcaiApi.excluirSessao(sessao.id);
        } else {
            await AcaiApi.atualizarSessao(sessao.id, { situacao: 'concluida' });
        }
        fecharDetalhes();
    } catch (erro) {
        avisar(erro.message || 'Não foi possível alterar a sessão.');
        return;
    }
    await recarregar();
}

/* ---------- Ajuste da grade (sugestões da Sofia) ---------- */

const MENSAGENS_SEM_SUGESTAO = {
    sem_tarefas: 'Você não tem tarefas de estudo pendentes para encaixar nesta semana.',
    sem_espacos: 'Não há horários livres nesta semana (a grade vai das 07:00 às 21:00).',
};

async function pedirSugestoes() {
    if (botaoSugerir.getAttribute('aria-busy') === 'true') return;
    if (estado.visao !== 'semana') await alternarVisao('semana');

    const rotulo = botaoSugerir.querySelector('span');
    const original = rotulo.textContent;
    botaoSugerir.setAttribute('aria-busy', 'true');
    botaoSugerir.disabled = true;
    rotulo.textContent = 'Calculando…';

    try {
        const resposta = await AcaiApi.obterSugestoesGrade(chaveDoDia(estado.inicioSemana));
        estado.sugestoes = resposta.sugestoes;
        estado.semAlocacao = resposta.semAlocacao.length;

        if (!resposta.sugestoes.length) {
            avisar(MENSAGENS_SEM_SUGESTAO[resposta.motivo]
                || 'Nada a sugerir: as tarefas pendentes já estão agendadas ou não cabem antes do prazo.', 'aviso');
        }
    } catch (erro) {
        estado.sugestoes = [];
        avisar(erro.status === 503
            ? 'O serviço de sugestões está indisponível no momento. Sua grade continua funcionando normalmente.'
            : erro.message || 'Não foi possível calcular as sugestões.');
    } finally {
        botaoSugerir.removeAttribute('aria-busy');
        botaoSugerir.disabled = false;
        rotulo.textContent = original;
    }

    renderizar();
}

async function aceitarSugestao(indice) {
    const sugestao = estado.sugestoes[indice];
    if (!sugestao) return false;

    try {
        await AcaiApi.criarSessao({
            tarefaId: sugestao.tarefaId,
            inicio: new Date(Date.parse(sugestao.inicio)).toISOString(),
            fim: new Date(Date.parse(sugestao.fim)).toISOString(),
            origem: 'ia',
        });
        return true;
    } catch (erro) {
        avisar(erro.message || 'Não foi possível aceitar a sugestão.');
        return false;
    }
}

async function aceitarUma(indice) {
    const criada = await aceitarSugestao(indice);
    estado.sugestoes.splice(indice, 1); // aceita ou não coube mais: não fica na tela
    if (criada) await carregarSessoes();
    renderizar();
}

async function aceitarTodas() {
    const botao = document.getElementById('aceitar-todas');
    botao.disabled = true;

    let falhas = 0;
    for (let i = 0; i < estado.sugestoes.length; i += 1) {
        if (!await aceitarSugestao(i)) falhas += 1;
    }

    estado.sugestoes = [];
    botao.disabled = false;
    if (falhas) avisar(`${plural(falhas, 'sessão', 'sessões')} não ${falhas === 1 ? 'pôde' : 'puderam'} ser criada${falhas === 1 ? '' : 's'}.`, 'aviso');
    await recarregar();
}

/* ---------- Modal de tarefa ---------- */

function abrirModal(modo, tarefa = {}) {
    const editando = modo === 'editar';

    document.getElementById('titulo-modal-tarefa').textContent = editando ? 'Editar tarefa' : 'Nova tarefa';
    document.getElementById('subtitulo-modal-tarefa').textContent = editando
        ? 'Ajuste os dados da tarefa pendente.'
        : 'Defina a tarefa para a Sofia priorizar na grade semanal.';
    document.getElementById('etiqueta-modal').textContent = editando ? 'Edição' : 'Novo';
    document.getElementById('salvar-tarefa').textContent = editando ? 'Salvar alterações' : '＋  Salvar tarefa';

    campoId.value = tarefa.id || '';
    campoTitulo.value = tarefa.titulo || '';
    campoCategoria.value = tarefa.categoria || 'estudos';
    campoTag.value = tarefa.tag || '';
    campoTipo.value = tarefa.tipo || 'outro';
    campoDisciplina.value = tarefa.disciplinaId || '';
    campoPrazo.value = tarefa.prazo || '';
    campoDetalhe.value = tarefa.detalhe || '';
    campoNotas.value = tarefa.notas || '';
    campoDuracao.value = String(Math.min(8, Math.max(1, Math.round((tarefa.minutos || 60) / 30))));
    campoPrioridade.value = String(tarefa.prioridade || 5);

    valorDuracao.textContent = formatarDuracao(Number(campoDuracao.value) * 30);
    valorPrioridade.textContent = `${campoPrioridade.value}/10`;
    contadorTitulo.textContent = String(campoTitulo.value.length);

    botaoExcluir.hidden = !editando;
    modal.classList.add('aberto');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-aberto');
    campoTitulo.focus();
}

function fecharModal() {
    modal.classList.remove('aberto');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-aberto');
    formulario.reset();
    campoDuracao.value = '2';
    campoPrioridade.value = '5';
    botaoExcluir.hidden = true;
}

function lerFormulario() {
    return {
        id: campoId.value,
        titulo: campoTitulo.value.trim(),
        categoria: campoCategoria.value,
        tag: campoTag.value.trim() || (campoCategoria.value === 'pessoal' ? 'Pessoal' : 'Estudo'),
        tipo: campoTipo.value,
        disciplinaId: campoDisciplina.value,
        prazo: campoPrazo.value,
        detalhe: campoDetalhe.value.trim(),
        notas: campoNotas.value.trim(),
        minutos: Number(campoDuracao.value) * 30,
        prioridade: Number(campoPrioridade.value),
    };
}

/* ---------- Eventos ---------- */

document.querySelectorAll('.filtro').forEach((botao) => {
    botao.addEventListener('click', () => {
        document.querySelectorAll('.filtro').forEach((item) => item.classList.remove('ativo'));
        botao.classList.add('ativo');
        filtrarTarefas(botao.dataset.filtro, document.getElementById('busca-tarefas').value);
    });
});

document.getElementById('busca-tarefas').addEventListener('input', (evento) => {
    filtrarTarefas(document.querySelector('.filtro.ativo')?.dataset.filtro || 'todos', evento.target.value);
});

/* Arrastar: tarefa da lista vira sessão; sessão agendada pode ser movida. Blocos fixos e sugestões não arrastam. */

function iniciarArrasto(elemento, item, evento) {
    itemArrastado = item;
    elemento.classList.add('arrastando');
    fantasma.hidden = false;
    fantasma.textContent = `⋮⋮  ${item.titulo}`;
    evento.dataTransfer.effectAllowed = 'move';
    evento.dataTransfer.setData('text/plain', item.id);
}

function limparArrasto() {
    document.querySelectorAll('.arrastando').forEach((elemento) => elemento.classList.remove('arrastando'));
    itemArrastado = null;
    fantasma.hidden = true;
    gradeDias.querySelectorAll('.coluna-dia').forEach((coluna) => coluna.classList.remove('destino-soltura'));
}

listaTarefas.addEventListener('dragstart', (evento) => {
    const card = evento.target.closest('.tarefa');
    if (card) iniciarArrasto(card, { tipo: 'tarefa', id: card.dataset.id, titulo: card.dataset.titulo, card }, evento);
});

gradeDias.addEventListener('dragstart', (evento) => {
    const bloco = evento.target.closest('.evento.sessao');
    if (!bloco) return;
    iniciarArrasto(bloco, { tipo: 'sessao', id: bloco.dataset.sessao, titulo: bloco.querySelector('strong').textContent }, evento);
    bloqueioClique = true;
});

document.addEventListener('dragend', () => {
    limparArrasto();
    setTimeout(() => { bloqueioClique = false; }, 0);
});

document.addEventListener('dragover', (evento) => {
    if (!itemArrastado) return;
    fantasma.style.left = `${evento.clientX + 12}px`;
    fantasma.style.top = `${evento.clientY + 12}px`;
});

gradeDias.addEventListener('dragover', (evento) => {
    if (!itemArrastado) return;
    evento.preventDefault();

    const coluna = evento.target.closest('.coluna-dia');
    gradeDias.querySelectorAll('.coluna-dia').forEach((item) => item.classList.toggle('destino-soltura', item === coluna));
});

gradeDias.addEventListener('drop', async (evento) => {
    evento.preventDefault();
    const item = itemArrastado;
    const alvo = alvoDoSolte(evento);
    limparArrasto();
    if (!item || !alvo) return;

    if (item.tipo === 'tarefa') await agendarTarefa(item.card, alvo);
    else await moverSessao(item.id, alvo);
});

/* Cliques na grade: aceitar ou recusar sugestão, ver detalhes de sessão ou bloco */

gradeDias.addEventListener('click', (evento) => {
    if (bloqueioClique) return;

    const botao = evento.target.closest('.sugestao-acoes button');
    if (botao) {
        const indice = Number(botao.closest('.evento').dataset.sugestao);
        if (botao.dataset.acao === 'aceitar') aceitarUma(indice);
        else {
            estado.sugestoes.splice(indice, 1);
            renderizar();
        }
        return;
    }

    const bloco = evento.target.closest('.evento');
    if (bloco?.dataset.sessao) {
        const sessao = estado.sessoes.find((item) => item.id === bloco.dataset.sessao);
        if (sessao) abrirDetalhes({ tipo: 'sessao', titulo: sessao.titulo, sessao });
    } else if (bloco?.dataset.bloco) {
        const fixo = estado.blocos.find((item) => (item.id || item._id) === bloco.dataset.bloco);
        if (fixo) abrirDetalhes({ tipo: 'bloco', titulo: fixo.nome, bloco: fixo, inicio: inicioDoBloco(fixo, bloco.dataset.data) });
    }
});

gradeDias.addEventListener('keydown', (evento) => {
    if ((evento.key === 'Enter' || evento.key === ' ') && evento.target.classList.contains('evento')) {
        evento.preventDefault();
        evento.target.click();
    }
});

mesGrade.addEventListener('click', (evento) => {
    const celula = evento.target.closest('.mes-dia');
    if (celula && !evento.target.closest('.mes-chip')) irParaSemanaDe(Number(celula.dataset.dia));
});

mesGrade.addEventListener('keydown', (evento) => {
    if ((evento.key === 'Enter' || evento.key === ' ') && evento.target.classList.contains('mes-dia')) {
        evento.preventDefault();
        evento.target.click();
    }
});

listaTarefas.addEventListener('click', (evento) => {
    const card = evento.target.closest('.tarefa');
    const tarefa = card && estado.tarefas.find((item) => item.id === card.dataset.id);
    if (tarefa) abrirModal('editar', tarefa);
});

/* Navegação */

document.addEventListener('click', (evento) => {
    const botao = evento.target.closest('.cabecalho-principal .alternador button');
    if (botao) alternarVisao(botao.dataset.visao || 'semana');
});

document.getElementById('botao-hoje').addEventListener('click', async () => {
    estado.inicioSemana = inicioDaSemana(Date.now());
    estado.mes = { ano: partes(Date.now()).ano, mes: partes(Date.now()).mes };
    estado.sugestoes = [];
    await recarregar();
    document.querySelector('.coluna-dia.hoje')?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
});

document.getElementById('semana-anterior').addEventListener('click', () => mover(-1));
document.getElementById('semana-proxima').addEventListener('click', () => mover(1));

/* Sugestões */

botaoSugerir.addEventListener('click', pedirSugestoes);
document.getElementById('aceitar-todas').addEventListener('click', aceitarTodas);
document.getElementById('descartar-sugestoes').addEventListener('click', () => {
    estado.sugestoes = [];
    renderizar();
});

/* Detalhes da sessão */

document.getElementById('fechar-modal-sessao').addEventListener('click', fecharDetalhes);
document.getElementById('fechar-sessao').addEventListener('click', fecharDetalhes);
document.getElementById('remover-sessao').addEventListener('click', () => alterarSessaoAberta('remover'));
document.getElementById('concluir-sessao').addEventListener('click', () => alterarSessaoAberta('concluir'));
modalSessao.addEventListener('click', (evento) => {
    if (evento.target === modalSessao) fecharDetalhes();
});

/* Modal de tarefa */

document.getElementById('botao-nova-tarefa').addEventListener('click', () => abrirModal('criar'));

document.addEventListener('keydown', (evento) => {
    if (evento.key !== 'Escape') return;
    if (modal.classList.contains('aberto')) fecharModal();
    if (modalSessao.classList.contains('aberto')) fecharDetalhes();
});

document.getElementById('fechar-modal').addEventListener('click', fecharModal);
document.getElementById('cancelar-modal').addEventListener('click', fecharModal);

modal.addEventListener('click', (evento) => {
    if (evento.target === modal) fecharModal();
});

campoTitulo.addEventListener('input', () => {
    contadorTitulo.textContent = String(campoTitulo.value.length);
});

campoDuracao.addEventListener('input', () => {
    valorDuracao.textContent = formatarDuracao(Number(campoDuracao.value) * 30);
});

campoPrioridade.addEventListener('input', () => {
    valorPrioridade.textContent = `${campoPrioridade.value}/10`;
});

formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const dados = lerFormulario();
    if (!dados.titulo) return;

    const botaoSalvar = document.getElementById('salvar-tarefa');
    botaoSalvar.disabled = true;

    try {
        const payload = payloadTarefa(dados);
        if (dados.id) await AcaiApi.atualizarTarefa(dados.id, payload);
        else await AcaiApi.criarTarefa(payload);
        fecharModal();
        await carregarTarefas();
    } catch (erro) {
        avisar(erro.message || 'Não foi possível salvar a tarefa.');
    } finally {
        botaoSalvar.disabled = false;
    }
});

botaoExcluir.addEventListener('click', async () => {
    if (!campoId.value) return;
    botaoExcluir.disabled = true;

    try {
        await AcaiApi.excluirTarefa(campoId.value);
        fecharModal();
        await carregarTarefas();
    } catch (erro) {
        avisar(erro.message || 'Não foi possível excluir a tarefa.');
    } finally {
        botaoExcluir.disabled = false;
    }
});

/* ---------- Início ---------- */

async function iniciar() {
    montarEixoHoras();
    atualizarContador();
    renderizar(); // mostra a semana e o título já com as datas reais, enquanto os dados chegam

    await Promise.all([carregarBase(), carregarTarefas()]);
    await carregarSessoes();
    renderizar();
}

iniciar();
