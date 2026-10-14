inicializarMenusOnboarding();

const CHAVE_METAS = 'acaistudy-onboarding-metas';

const listaMetas = document.getElementById('lista-metas');
const contador = document.getElementById('contador-metas');
const estadoRodape = document.getElementById('estado-rodape');
const botaoProximo = document.getElementById('botao-proximo');
const formulario = document.getElementById('formulario-meta');
const campoTitulo = document.getElementById('titulo-meta');
const campoTipo = document.getElementById('tipo-meta');
const campoPrioridade = document.getElementById('prioridade-meta');
const campoPrazo = document.getElementById('prazo-meta');

const rotulosTipo = {
    geral: 'Objetivo Geral',
    disciplina: 'Disciplina',
    projeto: 'Projeto / TCC',
    habito: 'Hábito',
};

const classesTipo = {
    geral: 'geral',
    disciplina: 'disciplina',
    projeto: 'projeto',
    habito: 'habito',
};

const coresPorTipo = {
    geral: 'roxo',
    disciplina: 'azul',
    projeto: 'verde',
    habito: 'ambar',
};

const iconesPorTipo = {
    geral: 'assets/icons/metas/card-bandeira.svg',
    disciplina: 'assets/icons/metas/card-codigo.svg',
    projeto: 'assets/icons/metas/card-tcc.svg',
    habito: 'assets/icons/metas/card-habito.svg',
};

let metas = carregarMetas();

campoPrazo.value = dataPadrao();

function dataPadrao() {
    const data = new Date();
    data.setDate(data.getDate() + 30);
    return data.toISOString().slice(0, 10);
}

function carregarMetas() {
    try {
        const bruto = localStorage.getItem(CHAVE_METAS);
        return bruto ? JSON.parse(bruto) : [];
    } catch {
        return [];
    }
}

function salvarMetas() {
    localStorage.setItem(CHAVE_METAS, JSON.stringify(metas));
}

function formatarPrazo(valor) {
    const [ano, mes, dia] = valor.split('-');
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${Number(dia)} ${meses[Number(mes) - 1]} ${ano}`;
}

function rotuloPrioridade(prioridade) {
    if (prioridade === 'alta') return 'Alta prioridade';
    if (prioridade === 'baixa') return 'Baixa prioridade';
    return 'Média prioridade';
}

function classePrioridade(prioridade) {
    if (prioridade === 'alta') return 'prioridade-alta';
    if (prioridade === 'baixa') return 'prioridade-baixa';
    return 'prioridade-media';
}

function atualizarEstado() {
    const total = metas.length;
    contador.textContent = total === 1 ? '1 meta' : `${total} metas`;

    botaoProximo.disabled = total === 0;

    estadoRodape.innerHTML = total === 0
        ? 'ⓘ <strong>Passo 2 de 3</strong> • Adicione ao menos 1 meta para continuar'
        : `ⓘ <strong>Passo 2 de 3 em andamento</strong> • ${total} meta${total > 1 ? 's' : ''} pronta${total > 1 ? 's' : ''} para a Sofia priorizar`;
}

function renderizarMetas() {
    if (metas.length === 0) {
        listaMetas.innerHTML = `
            <div class="estado-vazio">
                <strong>Nenhuma meta adicionada ainda</strong>
                <p>Escolha uma sugestão ao lado ou preencha o formulário para começar o planejamento do semestre.</p>
            </div>`;
        atualizarEstado();
        return;
    }

    listaMetas.innerHTML = metas.map((meta) => `
        <article class="card-meta" data-id="${meta.id}">
            <div class="card-meta-icone ${meta.cor}">
                <img src="${meta.icone}" alt="" width="18" height="18">
            </div>
            <div class="card-meta-corpo">
                <div class="card-meta-topo">
                    <h3>${meta.titulo}</h3>
                    <span class="etiqueta-tipo ${classesTipo[meta.tipo]}">${rotulosTipo[meta.tipo]}</span>
                </div>
                <div class="card-meta-detalhes">
                    <span>Prazo: ${formatarPrazo(meta.prazo)}</span>
                    <span class="separador">•</span>
                    <span class="${classePrioridade(meta.prioridade)}">${rotuloPrioridade(meta.prioridade)}</span>
                </div>
            </div>
            <button type="button" class="botao-remover" data-remover="${meta.id}" aria-label="Remover meta">×</button>
        </article>
    `).join('');

    atualizarEstado();
    marcarSugestoesUsadas();
}

function adicionarMeta(dados) {
    const titulo = dados.titulo.trim();

    if (!titulo) {
        return;
    }

    const jaExiste = metas.some(
        (meta) => meta.titulo.toLowerCase() === titulo.toLowerCase()
    );

    if (jaExiste) {
        return;
    }

    metas.push({
        id: crypto.randomUUID(),
        titulo,
        tipo: dados.tipo,
        prioridade: dados.prioridade,
        prazo: dados.prazo,
        cor: dados.cor || coresPorTipo[dados.tipo],
        icone: dados.icone || iconesPorTipo[dados.tipo],
    });

    salvarMetas();
    renderizarMetas();
}

function removerMeta(id) {
    metas = metas.filter((meta) => meta.id !== id);
    salvarMetas();
    renderizarMetas();
}

function marcarSugestoesUsadas() {
    document.querySelectorAll('.sugestao').forEach((botao) => {
        const titulo = botao.dataset.titulo;
        const usada = metas.some(
            (meta) => meta.titulo.toLowerCase() === titulo.toLowerCase()
        );
        botao.classList.toggle('usada', usada);
    });
}

formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();

    adicionarMeta({
        titulo: campoTitulo.value,
        tipo: campoTipo.value,
        prioridade: campoPrioridade.value,
        prazo: campoPrazo.value,
    });

    formulario.reset();
    campoPrioridade.value = 'media';
    campoPrazo.value = dataPadrao();
    campoTitulo.focus();
});

document.getElementById('lista-sugestoes').addEventListener('click', (evento) => {
    const botao = evento.target.closest('.sugestao');

    if (!botao || botao.classList.contains('usada')) {
        return;
    }

    adicionarMeta({
        titulo: botao.dataset.titulo,
        tipo: botao.dataset.tipo,
        prioridade: botao.dataset.prioridade,
        prazo: botao.dataset.prazo,
        cor: botao.dataset.cor,
        icone: botao.dataset.icone,
    });
});

listaMetas.addEventListener('click', (evento) => {
    const botao = evento.target.closest('[data-remover]');

    if (!botao) {
        return;
    }

    removerMeta(botao.dataset.remover);
});

document.getElementById('botao-voltar').addEventListener('click', () => {
    window.location.href = 'index_onboarding_horarios.html';
});

botaoProximo.addEventListener('click', () => {
    if (metas.length === 0) {
        return;
    }

    window.location.href = 'index_onboarding_foco.html';
});

document.getElementById('pular-onboarding').addEventListener('click', () => {
    window.location.href = 'index_calendario.html';
});

renderizarMetas();
