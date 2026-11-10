inicializarMenusOnboarding();
marcarPassoOnboarding('metas');

const listaMetas = document.getElementById('lista-metas');
const listaSugestoes = document.getElementById('lista-sugestoes');
const contador = document.getElementById('contador-metas');
const estadoRodape = document.getElementById('estado-rodape');
const botaoProximo = document.getElementById('botao-proximo');
const formulario = document.getElementById('formulario-meta');
const campoTitulo = document.getElementById('titulo-meta');
const campoTipo = document.getElementById('tipo-meta');
const campoPrioridade = document.getElementById('prioridade-meta');
const campoPrazo = document.getElementById('prazo-meta');
const campoDisciplina = document.getElementById('disciplina-meta');
const campoHoras = document.getElementById('horas-meta');
const grupoDisciplina = document.getElementById('campo-disciplina');
const grupoHoras = document.getElementById('campo-horas');
const periodo = document.getElementById('periodo-letivo');

const rotulosTipo = {
    geral: 'Objetivo Geral',
    disciplina: 'Disciplina',
    projeto: 'Projeto / TCC',
    habito: 'Hábito',
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

let metas = [];
let disciplinas = [];
let metaHoras = 10;
let sugestoes = [];

function escapar(texto) {
    return String(texto ?? '').replace(/[&<>"']/g, (caractere) => `&#${caractere.charCodeAt(0)};`);
}

function periodoLetivo(data = new Date()) {
    return `${data.getFullYear()}/${data.getMonth() >= 6 ? 2 : 1}`;
}

function prazoDoPeriodo(data = new Date()) {
    const ano = data.getFullYear();
    return data.getMonth() >= 6 ? `${ano}-12-15` : `${ano}-06-30`;
}

function dataPadrao() {
    const data = new Date();
    data.setDate(data.getDate() + 30);
    return data.toISOString().slice(0, 10);
}

function prazoCurto(valor) {
    if (!valor) return '';
    return String(valor).slice(0, 10);
}

function formatarPrazo(valor) {
    if (!valor) return 'Toda semana';
    const [ano, mes, dia] = prazoCurto(valor).split('-');
    const nomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${Number(dia)} ${nomes[Number(mes) - 1]} ${ano}`;
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

function nomeDisciplina(id) {
    return disciplinas.find((item) => item.id === String(id))?.nome || '';
}

function atualizarCamposDoTipo() {
    const tipo = campoTipo.value;
    grupoDisciplina.hidden = tipo !== 'disciplina';
    grupoHoras.hidden = tipo !== 'habito';
    campoPrazo.required = tipo !== 'habito';
}

function atualizarEstado() {
    const total = metas.length;
    contador.textContent = total === 1 ? '1 meta' : `${total} metas`;
    botaoProximo.disabled = total === 0;
    estadoRodape.innerHTML = total === 0
        ? 'ⓘ <strong>Passo 3 de 4</strong> • Adicione ao menos 1 meta para continuar'
        : `ⓘ <strong>Passo 3 de 4 em andamento</strong> • ${total} meta${total > 1 ? 's' : ''} já na sua conta`;
}

function renderizarMetas() {
    if (metas.length === 0) {
        listaMetas.innerHTML = `
            <div class="estado-vazio">
                <strong>Nenhuma meta ainda</strong>
                <p>Use uma sugestão ao lado ou descreva a sua. Ela já fica salva na tela de Metas.</p>
            </div>`;
        atualizarEstado();
        marcarSugestoesUsadas();
        return;
    }

    listaMetas.innerHTML = metas.map((meta) => {
        const detalhePrazo = meta.tipo === 'habito' && meta.metaSemanalHoras
            ? `${meta.metaSemanalHoras}h por semana`
            : `Prazo: ${formatarPrazo(meta.prazo)}`;
        const materia = meta.tipo === 'disciplina' ? nomeDisciplina(meta.disciplinaId) : '';

        return `
            <article class="card-meta" data-id="${escapar(meta.id)}">
                <div class="card-meta-icone ${escapar(meta.cor)}">
                    <img src="${escapar(meta.icone)}" alt="" width="18" height="18">
                </div>
                <div class="card-meta-corpo">
                    <div class="card-meta-topo">
                        <h3>${escapar(meta.titulo)}</h3>
                        <span class="etiqueta-tipo ${escapar(meta.tipo)}">${rotulosTipo[meta.tipo] || 'Meta'}</span>
                    </div>
                    <div class="card-meta-detalhes">
                        <span>${escapar(detalhePrazo)}</span>
                        <span class="separador">•</span>
                        <span class="${classePrioridade(meta.prioridade)}">${rotuloPrioridade(meta.prioridade)}</span>
                        ${materia ? `<span class="separador">•</span><span>${escapar(materia)}</span>` : ''}
                    </div>
                </div>
                <button type="button" class="botao-remover" data-remover="${escapar(meta.id)}" aria-label="Remover meta">×</button>
            </article>`;
    }).join('');

    atualizarEstado();
    marcarSugestoesUsadas();
}

function montarSugestoes() {
    const prazo = prazoDoPeriodo();
    const lista = [
        {
            chave: 'habito-horas',
            titulo: `Estudar ${metaHoras} horas por semana`,
            resumo: 'O painel de Metas compara as horas estudadas com este ritmo.',
            tipo: 'habito',
            prioridade: 'alta',
            prazo: '',
            metaSemanalHoras: metaHoras,
        },
        {
            chave: 'geral-semestre',
            titulo: 'Manter as disciplinas do semestre em dia',
            resumo: 'Objetivo geral. Os marcos (provas e trabalhos) entram depois na tela de Metas.',
            tipo: 'geral',
            prioridade: 'alta',
            prazo,
        },
    ];

    disciplinas.slice(0, 6).forEach((disciplina) => {
        lista.push({
            chave: `disciplina-${disciplina.id}`,
            titulo: `Avançar em ${disciplina.nome}`,
            resumo: Number(disciplina.dificuldade) >= 4
                ? 'Matéria densa: a grade reserva mais tempo para ela.'
                : 'Meta ligada a esta disciplina.',
            tipo: 'disciplina',
            prioridade: Number(disciplina.dificuldade) >= 4 ? 'alta' : 'media',
            prazo,
            disciplinaId: disciplina.id,
        });
    });

    sugestoes = lista;
    listaSugestoes.innerHTML = lista.map((item) => `
        <button type="button" class="sugestao" data-chave="${escapar(item.chave)}">
            <span class="icone-sugestao ${coresPorTipo[item.tipo]}">
                <img src="${iconesPorTipo[item.tipo]}" alt="" width="16" height="16">
            </span>
            <span>
                <strong>${escapar(item.titulo)}</strong>
                <small>${escapar(item.resumo)}</small>
                <span class="etiqueta-tipo ${item.tipo}">${rotulosTipo[item.tipo]}</span>
            </span>
        </button>
    `).join('');

    marcarSugestoesUsadas();
}

function preencherDisciplinas() {
    campoDisciplina.replaceChildren();
    if (disciplinas.length === 0) {
        const opcao = document.createElement('option');
        opcao.value = '';
        opcao.textContent = 'Cadastre uma disciplina no passo 1';
        campoDisciplina.appendChild(opcao);
        campoDisciplina.disabled = true;
        return;
    }

    campoDisciplina.disabled = false;
    disciplinas.forEach((disciplina) => {
        const opcao = document.createElement('option');
        opcao.value = disciplina.id;
        opcao.textContent = disciplina.nome;
        campoDisciplina.appendChild(opcao);
    });
}

function jaExiste(titulo) {
    return metas.some((meta) => meta.titulo.toLowerCase() === titulo.toLowerCase());
}

function marcarSugestoesUsadas() {
    listaSugestoes.querySelectorAll('.sugestao').forEach((botao) => {
        const sugestao = sugestoes.find((item) => item.chave === botao.dataset.chave);
        botao.classList.toggle('usada', Boolean(sugestao && jaExiste(sugestao.titulo)));
    });
}

function daApi(meta) {
    return {
        id: meta.id,
        titulo: meta.titulo,
        tipo: meta.tipo || 'geral',
        prioridade: meta.prioridade || 'media',
        prazo: prazoCurto(meta.prazo),
        metaSemanalHoras: meta.metaSemanalHoras || null,
        disciplinaId: meta.disciplinaId ? String(meta.disciplinaId) : null,
        cor: coresPorTipo[meta.tipo] || 'roxo',
        icone: iconesPorTipo[meta.tipo] || iconesPorTipo.geral,
    };
}

async function adicionarMeta(dados) {
    const titulo = dados.titulo.trim();
    if (titulo.length < 2 || jaExiste(titulo)) return;

    const payload = {
        titulo,
        tipo: dados.tipo,
        prioridade: dados.prioridade,
        situacao: 'ativa',
    };

    if (dados.tipo === 'habito') {
        const horas = Number(dados.metaSemanalHoras || metaHoras);
        if (!Number.isInteger(horas) || horas < 1 || horas > 168) {
            AcaiAvisos.mostrar('Informe quantas horas por semana esse hábito pede.');
            return;
        }
        payload.metaSemanalHoras = horas;
    } else if (!dados.prazo) {
        AcaiAvisos.mostrar('Informe o prazo desta meta.');
        return;
    } else {
        payload.prazo = dados.prazo;
    }

    if (dados.tipo === 'disciplina') {
        if (!dados.disciplinaId) {
            AcaiAvisos.mostrar('Escolha a disciplina desta meta.');
            return;
        }
        payload.disciplinaId = dados.disciplinaId;
    }

    const criada = await AcaiApi.criarMeta(payload);
    metas.push(daApi(criada));
    renderizarMetas();
}

formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const botao = formulario.querySelector('[type="submit"]');
    botao.disabled = true;

    try {
        await adicionarMeta({
            titulo: campoTitulo.value,
            tipo: campoTipo.value,
            prioridade: campoPrioridade.value,
            prazo: campoPrazo.value,
            disciplinaId: campoDisciplina.value,
            metaSemanalHoras: Number(campoHoras.value),
        });
        formulario.reset();
        campoPrioridade.value = 'media';
        campoPrazo.value = dataPadrao();
        campoHoras.value = String(metaHoras);
        atualizarCamposDoTipo();
        campoTitulo.focus();
    } catch (erro) {
        AcaiAvisos.mostrar(erro.message || 'Não foi possível gravar a meta.');
    } finally {
        botao.disabled = false;
    }
});

campoTipo.addEventListener('change', atualizarCamposDoTipo);

listaSugestoes.addEventListener('click', async (evento) => {
    const botao = evento.target.closest('.sugestao');
    if (!botao || botao.classList.contains('usada')) return;
    const sugestao = sugestoes.find((item) => item.chave === botao.dataset.chave);
    if (!sugestao) return;

    botao.disabled = true;
    try {
        await adicionarMeta(sugestao);
    } catch (erro) {
        AcaiAvisos.mostrar(erro.message || 'Não foi possível gravar a meta.');
    } finally {
        if (!botao.classList.contains('usada')) botao.disabled = false;
    }
});

listaMetas.addEventListener('click', async (evento) => {
    const botao = evento.target.closest('[data-remover]');
    if (!botao) return;
    botao.disabled = true;

    try {
        await AcaiApi.excluirMeta(botao.dataset.remover);
        metas = metas.filter((meta) => meta.id !== botao.dataset.remover);
        renderizarMetas();
    } catch (erro) {
        AcaiAvisos.mostrar(erro.message || 'Não foi possível remover a meta.');
        botao.disabled = false;
    }
});

document.getElementById('botao-voltar').addEventListener('click', () => {
    window.location.href = 'index_onboarding_horarios.html';
});

botaoProximo.addEventListener('click', () => {
    if (metas.length === 0) return;
    window.location.href = 'index_onboarding_foco.html';
});

window.salvarPassoOnboarding = async () => {};

async function iniciar() {
    periodo.textContent = `Semestre letivo ${periodoLetivo()}`;
    campoPrazo.value = dataPadrao();
    atualizarCamposDoTipo();

    try {
        const [conta, materias, resposta] = await Promise.all([
            AcaiApi.obterUsuarioAtual(),
            AcaiApi.listarDisciplinas({ situacao: 'ativa' }),
            AcaiApi.listarMetas(),
        ]);
        metaHoras = conta?.metaSemanalHoras || 10;
        campoHoras.value = String(metaHoras);
        disciplinas = materias;
        metas = (resposta.metas || []).map(daApi);
    } catch (erro) {
        AcaiAvisos.mostrar(erro.message || 'Não foi possível carregar as metas.');
    }

    preencherDisciplinas();
    montarSugestoes();
    renderizarMetas();
}

iniciar();
