renderLayout({
    paginaAtiva: 'grade',
    sidebarRecolhida: true,
});

const HORA_INICIAL = 7;
const TOTAL_HORAS = 14;
const ALTURA_LINHA = 56;
const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

const listaTarefas = document.getElementById('lista-tarefas');
const gradeDias = document.getElementById('grade-dias');
const fantasma = document.getElementById('fantasma-arrasto');
const seloPendentes = document.getElementById('selo-pendentes');
const eixoHoras = document.getElementById('eixo-horas');
const painelSemana = document.getElementById('visao-semana-painel');
const painelMes = document.getElementById('visao-mes-painel');
const mesGrade = document.getElementById('mes-grade');
const tituloSemana = document.getElementById('titulo-semana');

const modal = document.getElementById('modal-tarefa');
const formulario = document.getElementById('formulario-tarefa');
const campoTitulo = document.getElementById('titulo-tarefa');
const campoTipo = document.getElementById('tipo-tarefa');
const campoTag = document.getElementById('tag-tarefa');
const campoDia = document.getElementById('dia-tarefa');
const campoHorario = document.getElementById('horario-tarefa');
const campoPrazo = document.getElementById('prazo-tarefa');
const campoDetalhe = document.getElementById('local-tarefa');
const campoDuracao = document.getElementById('duracao-tarefa');
const campoPrioridade = document.getElementById('prioridade-tarefa');
const campoNotas = document.getElementById('notas-tarefa');
const campoId = document.getElementById('tarefa-id');
const campoOrigem = document.getElementById('tarefa-origem');
const botaoExcluir = document.getElementById('excluir-tarefa');
const valorDuracao = document.getElementById('valor-duracao');
const valorPrioridade = document.getElementById('valor-prioridade');
const contadorTitulo = document.getElementById('contador-titulo');

let itemArrastado = null;
let tipoArrasto = null;
let bloqueioClique = false;

function montarEixoHoras() {
    eixoHoras.innerHTML = '';

    for (let i = 0; i < TOTAL_HORAS; i += 1) {
        const hora = document.createElement('div');
        hora.className = 'hora-marca';
        hora.textContent = `${String(HORA_INICIAL + i).padStart(2, '0')}:00`;
        eixoHoras.appendChild(hora);
    }
}

function atualizarContador() {
    const total = listaTarefas.querySelectorAll('.tarefa:not([hidden])').length;
    seloPendentes.textContent = total === 1 ? '1 pendente' : `${total} pendentes`;
}

function parseDuracao(texto) {
    const horas = String(texto).match(/(\d+)\s*h/);
    const minutos = String(texto).match(/(\d+)\s*m/);
    return (horas ? Number(horas[1]) * 60 : 0) + (minutos ? Number(minutos[1]) : 0) || 60;
}

function formatarDuracao(faixas) {
    const minutos = faixas * 30;
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;

    if (h && m) return `${h}h ${m}m`;
    if (h) return `${h}h`;
    return `${m}m`;
}

function faixasDeDuracao(texto) {
    return Math.max(1, Math.round(parseDuracao(texto) / 30));
}

function horaDeFaixa(faixa) {
    const totalMin = HORA_INICIAL * 60 + faixa * 30;
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function faixaDeHorario(horario) {
    const [h, m] = String(horario || '14:00').split(':').map(Number);
    return Math.max(0, Math.min(TOTAL_HORAS * 2 - 1, Math.round(((h - HORA_INICIAL) * 60 + m) / 30)));
}

function filtrarTarefas(filtro, busca) {
    const termo = busca.trim().toLowerCase();

    listaTarefas.querySelectorAll('.tarefa').forEach((tarefa) => {
        const filtros = (tarefa.dataset.filtro || '').split(' ');
        const bateFiltro = filtro === 'todos' || filtros.includes(filtro);
        const texto = `${tarefa.dataset.titulo} ${tarefa.dataset.tag}`.toLowerCase();
        const bateBusca = !termo || texto.includes(termo);
        tarefa.hidden = !(bateFiltro && bateBusca);
    });

    atualizarContador();
}

function classeTipo(tipo) {
    if (tipo === 'aulas') return 'aula';
    if (tipo === 'pessoal') return 'pessoal';
    return 'estudo';
}

function criarCardLista(dados) {
    const card = document.createElement('article');
    const prioridade = Number(dados.prioridade || 5);
    const filtros = [dados.tipo || 'estudos'];

    if (prioridade >= 8) filtros.push('alta');

    card.className = `tarefa${prioridade >= 8 ? ' urgente' : ''}`;
    card.draggable = true;
    card.dataset.id = dados.id || crypto.randomUUID();
    card.dataset.filtro = filtros.join(' ');
    card.dataset.titulo = dados.titulo;
    card.dataset.tipo = dados.tipo || 'estudos';
    card.dataset.duracao = dados.duracao || '1h';
    card.dataset.tag = dados.tag || 'Estudo';
    card.dataset.detalhe = dados.detalhe || '';
    card.dataset.prioridade = String(prioridade);
    card.dataset.prazo = dados.prazo || '';
    card.dataset.notas = dados.notas || '';

    card.innerHTML = `
        <div class="tarefa-topo">
            <strong>${dados.titulo}</strong>
            <span class="duracao">${dados.duracao || '1h'}</span>
        </div>
        <div class="tarefa-meta">
            <span class="tag ${dados.tipo === 'pessoal' ? 'pessoal' : 'estudos'}">#${dados.tag || 'Estudo'}</span>
            <span class="prazo${prioridade >= 8 ? ' critico' : ''}">${dados.prazoLabel || 'Sem prazo'}</span>
        </div>
    `;

    return card;
}

function criarEventoGrade(dados) {
    const evento = document.createElement('div');
    const tipo = dados.tipo || 'estudos';
    const faixas = dados.faixas || faixasDeDuracao(dados.duracao || '1h');

    evento.className = `evento ${classeTipo(tipo)}${dados.alocado ? ' alocado' : ''}`;
    evento.draggable = true;
    evento.dataset.id = dados.id || crypto.randomUUID();
    evento.dataset.tipo = tipo;
    evento.dataset.titulo = dados.titulo;
    evento.dataset.detalhe = dados.detalhe || '';
    evento.dataset.tag = dados.tag || '';
    evento.dataset.duracao = dados.duracao || formatarDuracao(faixas);
    evento.dataset.prioridade = String(dados.prioridade || 5);
    evento.dataset.notas = dados.notas || '';
    evento.style.setProperty('--inicio', String(dados.inicio ?? 0));
    evento.style.setProperty('--duracao', String(Math.max(1, Math.ceil(faixas / 2))));

    evento.innerHTML = `
        <strong>${dados.titulo}</strong>
        <small>${dados.detalhe || dados.duracao || ''}</small>
        <span>#${dados.tag || tipo}</span>
    `;

    return evento;
}

function limparArrasto() {
    itemArrastado?.classList.remove('arrastando');
    itemArrastado = null;
    tipoArrasto = null;
    fantasma.hidden = true;

    gradeDias.querySelectorAll('.coluna-dia').forEach((coluna) => {
        coluna.classList.remove('destino-soltura');
    });
}

function iniciarArrasto(elemento, tipo, evento) {
    itemArrastado = elemento;
    tipoArrasto = tipo;
    elemento.classList.add('arrastando');
    fantasma.hidden = false;
    fantasma.textContent = `⋮⋮  ${elemento.dataset.titulo}`;
    evento.dataTransfer.effectAllowed = 'move';
    evento.dataTransfer.setData('text/plain', elemento.dataset.id || '');
}

function abrirModal(modo, dados = {}) {
    const editando = modo === 'editar';

    document.getElementById('titulo-modal-tarefa').textContent = editando ? 'Editar tarefa' : 'Nova tarefa';
    document.getElementById('subtitulo-modal-tarefa').textContent = editando
        ? 'Ajuste os dados do bloco na grade ou na lista de pendentes.'
        : 'Defina o bloco para a Sofia priorizar na grade semanal.';
    document.getElementById('etiqueta-modal').textContent = editando ? 'Edição' : 'Novo';
    document.getElementById('salvar-tarefa').innerHTML = editando ? 'Salvar alterações' : '＋ &nbsp; Salvar tarefa';

    campoId.value = dados.id || '';
    campoOrigem.value = dados.origem || 'lista';
    campoTitulo.value = dados.titulo || '';
    campoTipo.value = dados.tipo || 'estudos';
    campoTag.value = dados.tag || '';
    campoDia.value = dados.dia ?? '';
    campoHorario.value = dados.horario || '14:00';
    campoPrazo.value = dados.prazo || '';
    campoDetalhe.value = dados.detalhe || '';
    campoNotas.value = dados.notas || '';
    campoDuracao.value = String(dados.faixas || faixasDeDuracao(dados.duracao || '1h'));
    campoPrioridade.value = String(dados.prioridade || 5);

    valorDuracao.textContent = formatarDuracao(Number(campoDuracao.value));
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
    const faixas = Number(campoDuracao.value);
    const prioridade = Number(campoPrioridade.value);

    return {
        id: campoId.value || crypto.randomUUID(),
        origem: campoOrigem.value,
        titulo: campoTitulo.value.trim(),
        tipo: campoTipo.value,
        tag: campoTag.value.trim() || (campoTipo.value === 'pessoal' ? 'Pessoal' : 'Estudo'),
        dia: campoDia.value,
        horario: campoHorario.value,
        prazo: campoPrazo.value,
        detalhe: campoDetalhe.value.trim(),
        notas: campoNotas.value.trim(),
        duracao: formatarDuracao(faixas),
        faixas,
        prioridade,
        prazoLabel: campoPrazo.value
            ? new Date(campoPrazo.value).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
            : 'Sem prazo',
    };
}

function salvarTarefa(dados) {
    const existenteLista = listaTarefas.querySelector(`[data-id="${dados.id}"]`);
    const existenteGrade = gradeDias.querySelector(`.evento[data-id="${dados.id}"]`);

    existenteLista?.remove();
    existenteGrade?.remove();

    if (dados.dia === '') {
        listaTarefas.prepend(criarCardLista(dados));
    } else {
        const coluna = gradeDias.querySelector(`.coluna-dia[data-dia="${dados.dia}"]`);
        if (!coluna) return;

        const inicio = Math.floor(faixaDeHorario(dados.horario) / 2);
        coluna.appendChild(criarEventoGrade({
            ...dados,
            inicio,
            alocado: true,
            detalhe: dados.detalhe || `${dados.horario} · ${dados.duracao}`,
        }));
    }

    atualizarContador();
    if (!painelMes.hidden) montarMes();
}

function excluirTarefa(id) {
    listaTarefas.querySelector(`[data-id="${id}"]`)?.remove();
    gradeDias.querySelector(`.evento[data-id="${id}"]`)?.remove();
    atualizarContador();
    if (!painelMes.hidden) montarMes();
}

function categoriaChip(tipo) {
    const classe = classeTipo(tipo);
    if (classe === 'aula') return 'aulas';
    if (classe === 'pessoal') return 'pessoal';
    return 'estudos';
}

function coletarEventosMes() {
    return Array.from(gradeDias.querySelectorAll('.evento')).map((evento) => {
        const coluna = evento.closest('.coluna-dia');
        const inicio = Number(evento.style.getPropertyValue('--inicio') || 0);
        const duracao = Number(evento.style.getPropertyValue('--duracao') || faixasDeDuracao(evento.dataset.duracao));

        return {
            id: evento.dataset.id,
            dia: Number(coluna?.dataset.dia || 0),
            dataMes: 12 + Number(coluna?.dataset.dia || 0),
            titulo: evento.dataset.titulo,
            tipo: evento.dataset.tipo || 'estudos',
            tag: evento.dataset.tag,
            detalhe: evento.dataset.detalhe,
            duracao: evento.dataset.duracao,
            prioridade: evento.dataset.prioridade,
            notas: evento.dataset.notas,
            inicio,
            faixas: duracao,
            horario: horaDeFaixa(inicio * 2),
            sugestao: evento.classList.contains('sugestao'),
        };
    }).sort((a, b) => a.inicio - b.inicio);
}

function abrirEventoMes(evento) {
    if (evento.sugestao) {
        const bloco = gradeDias.querySelector(`.evento[data-id="${evento.id}"]`);
        if (bloco) {
            bloco.classList.remove('sugestao');
            bloco.draggable = true;
            bloco.classList.add('alocado');
            bloco.innerHTML = `
                <strong>Bloco de foco — Sofia</strong>
                <small>14:00 – 16:00 · Confirmado</small>
                <span>Prioridade alta</span>
            `;
            bloco.dataset.titulo = 'Bloco de foco — Sofia';
            montarMes();
        }
        return;
    }

    abrirModal('editar', {
        id: evento.id,
        origem: 'grade',
        titulo: evento.titulo,
        tipo: evento.tipo,
        tag: evento.tag,
        detalhe: evento.detalhe,
        duracao: evento.duracao,
        prioridade: evento.prioridade,
        notas: evento.notas,
        dia: String(evento.dia),
        horario: evento.horario,
        faixas: evento.faixas,
    });
}

function montarMes() {
    const ano = 2026;
    const mes = 9;
    const hojeDia = 15;
    const semanaInicio = 12;
    const semanaFim = 18;

    const primeiro = new Date(ano, mes, 1);
    const inicioGrade = new Date(primeiro);
    inicioGrade.setDate(primeiro.getDate() - primeiro.getDay());

    const eventos = coletarEventosMes();
    const mapa = {};

    eventos.forEach((evento) => {
        if (!mapa[evento.dataMes]) mapa[evento.dataMes] = [];
        mapa[evento.dataMes].push(evento);
    });

    const totalMes = eventos.length;
    const cargaMes = eventos.reduce((acc, evento) => acc + (evento.faixas || 2) * 0.5, 0);

    mesGrade.innerHTML = '';

    for (let i = 0; i < 42; i += 1) {
        const data = new Date(inicioGrade);
        data.setDate(inicioGrade.getDate() + i);

        const diaNum = data.getDate();
        const noMes = data.getMonth() === mes;
        const fimSemana = data.getDay() === 0 || data.getDay() === 6;
        const ehHoje = noMes && diaNum === hojeDia;
        const naSemanaAtual = noMes && diaNum >= semanaInicio && diaNum <= semanaFim;
        const lista = noMes ? (mapa[diaNum] || []) : [];
        const limiteChips = 4;
        const visiveis = lista.slice(0, limiteChips);
        const resto = lista.length - visiveis.length;
        const diaSemana = (data.getDay() + 6) % 7;

        const celula = document.createElement('div');
        celula.className = 'mes-dia';
        celula.tabIndex = 0;
        celula.setAttribute('role', 'button');
        celula.setAttribute(
            'aria-label',
            `${diaNum} de ${noMes ? 'outubro' : data.getMonth() === 8 ? 'setembro' : 'novembro'}${lista.length ? `, ${lista.length} evento${lista.length > 1 ? 's' : ''}` : ''}`
        );

        if (!noMes) celula.classList.add('fora');
        if (fimSemana) celula.classList.add('fim-semana');
        if (ehHoje) celula.classList.add('hoje');
        if (naSemanaAtual) celula.classList.add('semana-atual');

        const chips = visiveis.map((evento) => `
            <button type="button" class="mes-chip ${categoriaChip(evento.tipo)}" data-evento-id="${evento.id}" title="${evento.titulo}">
                <span class="mes-chip-hora">${evento.horario}</span>
                <span class="mes-chip-titulo">${evento.titulo}</span>
            </button>
        `).join('');

        celula.innerHTML = `
            <div class="mes-topo">
                <span class="mes-numero">${diaNum}</span>
                ${ehHoje ? '<span class="mes-selo-hoje">Hoje</span>' : ''}
                ${lista.length > 0 && !ehHoje ? `<span class="mes-contagem">${lista.length}</span>` : ''}
            </div>
            <div class="mes-eventos">
                ${chips}
                ${resto > 0 ? `<button type="button" class="mes-mais" data-mais="+${resto}">+${resto} mais</button>` : ''}
                ${lista.length === 0 && noMes ? '<span class="mes-vazio">+ adicionar</span>' : ''}
            </div>
        `;

        celula.addEventListener('click', (eventoClick) => {
            const chip = eventoClick.target.closest('.mes-chip');
            if (chip) {
                eventoClick.stopPropagation();
                const dados = lista.find((item) => item.id === chip.dataset.eventoId);
                if (dados) abrirEventoMes(dados);
                return;
            }

            if (eventoClick.target.closest('.mes-mais')) {
                eventoClick.stopPropagation();
                alternarVisao('semana');
                return;
            }

            if (!noMes) return;

            abrirModal('criar', {
                origem: 'grade',
                dia: String(diaSemana),
                horario: '09:00',
                tipo: 'estudos',
            });
        });

        celula.addEventListener('keydown', (eventoTecla) => {
            if (eventoTecla.key === 'Enter' || eventoTecla.key === ' ') {
                eventoTecla.preventDefault();
                celula.click();
            }
        });

        mesGrade.appendChild(celula);
    }

    const cargaRodape = document.querySelector('.rodape-grade .stat:first-child');
    if (cargaRodape) {
        cargaRodape.querySelector('span').textContent = 'Carga horária do mês';
        cargaRodape.querySelector('strong').textContent = `${cargaMes}h alocadas · ${totalMes} blocos`;
        const trilha = cargaRodape.querySelector('.trilha span');
        if (trilha) trilha.style.width = `${Math.min(100, Math.round((cargaMes / 120) * 100))}%`;
    }
}

function restaurarRodapeSemana() {
    const cargaRodape = document.querySelector('.rodape-grade .stat:first-child');
    if (!cargaRodape) return;
    cargaRodape.querySelector('span').textContent = 'Carga horária semanal';
    cargaRodape.querySelector('strong').textContent = '24h alocadas / 32h meta';
    const trilha = cargaRodape.querySelector('.trilha span');
    if (trilha) trilha.style.width = '75%';
}

function alternarVisao(visao) {
    const modo = visao === 'mes' ? 'mes' : 'semana';
    const botoes = document.querySelectorAll('.cabecalho-principal .alternador button');

    botoes.forEach((botao) => {
        botao.classList.toggle('ativo', botao.dataset.visao === modo);
    });

    const mostrarMes = modo === 'mes';

    painelSemana.hidden = mostrarMes;
    painelMes.hidden = !mostrarMes;
    document.body.dataset.visaoCalendario = modo;

    if (mostrarMes) {
        tituloSemana.innerHTML = 'Outubro, 2026 <span>(visão mensal)</span>';
        montarMes();
    } else {
        tituloSemana.innerHTML = '12 a 18 de Outubro, 2026 <span>(Semana 42)</span>';
        restaurarRodapeSemana();
    }
}


/* Filtros e busca */

document.querySelectorAll('.filtro').forEach((botao) => {
    botao.addEventListener('click', () => {
        document.querySelectorAll('.filtro').forEach((item) => item.classList.remove('ativo'));
        botao.classList.add('ativo');
        filtrarTarefas(botao.dataset.filtro, document.getElementById('busca-tarefas').value);
    });
});

document.getElementById('busca-tarefas').addEventListener('input', (evento) => {
    const filtroAtivo = document.querySelector('.filtro.ativo')?.dataset.filtro || 'todos';
    filtrarTarefas(filtroAtivo, evento.target.value);
});


/* Arrastar da lista e da grade */

listaTarefas.addEventListener('dragstart', (evento) => {
    const tarefa = evento.target.closest('.tarefa');
    if (!tarefa) return;
    iniciarArrasto(tarefa, 'lista', evento);
});

gradeDias.addEventListener('dragstart', (evento) => {
    const ev = evento.target.closest('.evento');
    if (!ev || ev.classList.contains('sugestao')) return;
    iniciarArrasto(ev, 'grade', evento);
    bloqueioClique = true;
});

document.addEventListener('dragend', () => {
    limparArrasto();
    setTimeout(() => {
        bloqueioClique = false;
    }, 0);
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
    gradeDias.querySelectorAll('.coluna-dia').forEach((item) => {
        item.classList.toggle('destino-soltura', item === coluna);
    });
});

gradeDias.addEventListener('drop', (evento) => {
    evento.preventDefault();

    const coluna = evento.target.closest('.coluna-dia');
    if (!coluna || !itemArrastado) return;

    const retangulo = coluna.getBoundingClientRect();
    const faixa = Math.max(0, Math.min(TOTAL_HORAS - 1, Math.floor((evento.clientY - retangulo.top) / ALTURA_LINHA)));

    if (tipoArrasto === 'lista') {
        const dados = {
            id: itemArrastado.dataset.id,
            titulo: itemArrastado.dataset.titulo,
            tipo: itemArrastado.dataset.tipo || 'estudos',
            tag: itemArrastado.dataset.tag,
            detalhe: `${horaDeFaixa(faixa * 2)} · ${itemArrastado.dataset.duracao}`,
            duracao: itemArrastado.dataset.duracao,
            prioridade: itemArrastado.dataset.prioridade,
            notas: itemArrastado.dataset.notas,
            inicio: faixa,
            alocado: true,
        };

        coluna.appendChild(criarEventoGrade(dados));
        itemArrastado.remove();
        atualizarContador();
    }

    if (tipoArrasto === 'grade') {
        itemArrastado.style.setProperty('--inicio', String(faixa));
        coluna.appendChild(itemArrastado);
        itemArrastado.dataset.detalhe = `${horaDeFaixa(faixa * 2)} · ${itemArrastado.dataset.duracao}`;
        const small = itemArrastado.querySelector('small');
        if (small) small.textContent = itemArrastado.dataset.detalhe;
    }

    limparArrasto();
    if (!painelMes.hidden) montarMes();
});


/* Clique: editar evento / criar no horário */

gradeDias.addEventListener('click', (evento) => {
    if (bloqueioClique) return;

    const bloco = evento.target.closest('.evento');

    if (bloco?.classList.contains('sugestao')) {
        bloco.classList.remove('sugestao');
        bloco.draggable = true;
        bloco.classList.add('alocado');
        bloco.innerHTML = `
            <strong>Bloco de foco — Sofia</strong>
            <small>14:00 – 16:00 · Confirmado</small>
            <span>Prioridade alta</span>
        `;
        bloco.dataset.titulo = 'Bloco de foco — Sofia';
        return;
    }

    if (bloco) {
        const coluna = bloco.closest('.coluna-dia');
        const inicio = Number(bloco.style.getPropertyValue('--inicio') || 0);

        abrirModal('editar', {
            id: bloco.dataset.id,
            origem: 'grade',
            titulo: bloco.dataset.titulo,
            tipo: bloco.dataset.tipo,
            tag: bloco.dataset.tag,
            detalhe: bloco.dataset.detalhe,
            duracao: bloco.dataset.duracao,
            prioridade: bloco.dataset.prioridade,
            notas: bloco.dataset.notas,
            dia: coluna?.dataset.dia ?? '',
            horario: horaDeFaixa(inicio * 2),
            faixas: faixasDeDuracao(bloco.dataset.duracao),
        });
        return;
    }

    const coluna = evento.target.closest('.coluna-dia');
    if (!coluna) return;

    const retangulo = coluna.getBoundingClientRect();
    const faixa = Math.max(0, Math.min(TOTAL_HORAS - 1, Math.floor((evento.clientY - retangulo.top) / ALTURA_LINHA)));

    abrirModal('criar', {
        origem: 'grade',
        dia: coluna.dataset.dia,
        horario: horaDeFaixa(faixa * 2),
        tipo: 'estudos',
    });
});

listaTarefas.addEventListener('click', (evento) => {
    const tarefa = evento.target.closest('.tarefa');
    if (!tarefa) return;

    abrirModal('editar', {
        id: tarefa.dataset.id,
        origem: 'lista',
        titulo: tarefa.dataset.titulo,
        tipo: tarefa.dataset.tipo || 'estudos',
        tag: tarefa.dataset.tag,
        detalhe: tarefa.dataset.detalhe,
        duracao: tarefa.dataset.duracao,
        prioridade: tarefa.dataset.prioridade,
        notas: tarefa.dataset.notas,
        prazo: tarefa.dataset.prazo,
        dia: '',
        faixas: faixasDeDuracao(tarefa.dataset.duracao),
    });
});


/* Modal */

document.getElementById('botao-nova-tarefa').addEventListener('click', () => {
    abrirModal('criar', { origem: 'lista', tipo: 'estudos' });
});

document.addEventListener('keydown', (evento) => {
    if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === 'n') {
        evento.preventDefault();
        abrirModal('criar', { origem: 'lista', tipo: 'estudos' });
    }

    if (evento.key === 'Escape' && modal.classList.contains('aberto')) {
        fecharModal();
    }
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
    valorDuracao.textContent = formatarDuracao(Number(campoDuracao.value));
});

campoPrioridade.addEventListener('input', () => {
    valorPrioridade.textContent = `${campoPrioridade.value}/10`;
});

formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const dados = lerFormulario();
    if (!dados.titulo) return;
    salvarTarefa(dados);
    fecharModal();
});

botaoExcluir.addEventListener('click', () => {
    if (!campoId.value) return;
    excluirTarefa(campoId.value);
    fecharModal();
});


/* Semana / Mês */

document.addEventListener('click', (evento) => {
    const botao = evento.target.closest('.cabecalho-principal .alternador button');
    if (!botao) return;
    alternarVisao(botao.dataset.visao || 'semana');
});

document.getElementById('botao-hoje').addEventListener('click', () => {
    if (!painelMes.hidden) {
        alternarVisao('semana');
    }
    document.querySelector('.coluna-dia.hoje')?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
});

document.getElementById('semana-anterior').addEventListener('click', () => {
    if (painelMes.hidden) {
        tituloSemana.innerHTML = '5 a 11 de Outubro, 2026 <span>(Semana 41)</span>';
    } else {
        tituloSemana.innerHTML = 'Setembro, 2026 <span>(visão mensal)</span>';
    }
});

document.getElementById('semana-proxima').addEventListener('click', () => {
    if (painelMes.hidden) {
        tituloSemana.innerHTML = '19 a 25 de Outubro, 2026 <span>(Semana 43)</span>';
    } else {
        tituloSemana.innerHTML = 'Novembro, 2026 <span>(visão mensal)</span>';
    }
});

/* Semana montada no onboarding */

const TIPOS_ONBOARDING = {
    aula: { tipo: 'aulas', tag: 'Aula' },
    trabalho: { tipo: 'pessoal', tag: 'Trabalho' },
    estudo: { tipo: 'estudos', tag: 'Sofia' },
};

function minutosDe(horario) {
    const [h, m] = horario.split(':').map(Number);
    return h * 60 + m;
}

// Se a pessoa organizou a semana no onboarding, esses blocos substituem os de exemplo.
function carregarSemanaDoOnboarding() {
    let semana = null;

    try {
        semana = JSON.parse(localStorage.getItem('acaistudy-onboarding-semana'));
    } catch {
        semana = null;
    }

    if (!Array.isArray(semana) || semana.length === 0) return;

    gradeDias.querySelectorAll('.evento').forEach((evento) => evento.remove());

    const inicioGrade = HORA_INICIAL * 60;
    const fimGrade = inicioGrade + TOTAL_HORAS * 60;

    semana.forEach((bloco) => {
        const coluna = gradeDias.querySelector(`.coluna-dia[data-dia="${DIAS.indexOf(bloco.dia)}"]`);
        const inicio = Math.max(minutosDe(bloco.inicio), inicioGrade);
        const fim = Math.min(minutosDe(bloco.fim), fimGrade);

        // Fora do horário exibido na grade (07:00 – 21:00).
        if (!coluna || fim <= inicio) return;

        const { tipo, tag } = TIPOS_ONBOARDING[bloco.tipo] || TIPOS_ONBOARDING.estudo;
        const evento = criarEventoGrade({
            titulo: bloco.titulo,
            tipo,
            tag,
            detalhe: `${bloco.inicio} – ${bloco.fim}`,
            inicio: (inicio - inicioGrade) / 60,
            faixas: (fim - inicio) / 30,
            alocado: !bloco.fixo,
        });

        evento.style.setProperty('--duracao', String((fim - inicio) / 60));
        coluna.appendChild(evento);
    });
}

montarEixoHoras();
carregarSemanaDoOnboarding();
atualizarContador();
alternarVisao('semana');
