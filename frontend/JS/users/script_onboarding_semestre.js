inicializarMenusOnboarding();
marcarPassoOnboarding('semestre');

const CHAVE_INTRO = 'acaistudy-onboarding-intro';
const CORES = ['roxo', 'indigo', 'verde', 'laranja', 'azul', 'ciano', 'ambar', 'rosa', 'turquesa', 'vermelho'];

const formulario = document.getElementById('formulario-perfil');
const formularioDisciplina = document.getElementById('formulario-disciplina');
const lista = document.getElementById('lista-disciplinas');
const botaoProximo = document.getElementById('botao-proximo');
const estadoRodape = document.getElementById('estado-rodape');
const periodo = document.getElementById('periodo-letivo');

const campoInstituicao = document.getElementById('campo-instituicao');
const campoCurso = document.getElementById('campo-curso');
const campoSemestre = document.getElementById('campo-semestre');
const campoTurno = document.getElementById('campo-turno');
const campoHoras = document.getElementById('campo-horas');
const campoNome = document.getElementById('campo-nome-disciplina');
const campoDificuldade = document.getElementById('campo-dificuldade');

let disciplinas = [];
let usuario = null;

function periodoLetivo(data = new Date()) {
    const ano = data.getFullYear();
    const metade = data.getMonth() >= 6 ? 2 : 1;
    return `${ano}/${metade}`;
}

function escapar(texto) {
    return String(texto ?? '').replace(/[&<>"']/g, (caractere) => `&#${caractere.charCodeAt(0)};`);
}

function horasValidas() {
    const horas = Number(campoHoras.value);
    return Number.isInteger(horas) && horas >= 1 && horas <= 168;
}

function perfilCompleto() {
    return Boolean(
        campoInstituicao.value.trim()
        && campoCurso.value.trim()
        && campoSemestre.value
        && campoTurno.value
        && horasValidas()
        && disciplinas.length > 0
    );
}

function lerPerfil() {
    const perfil = {};
    const instituicao = campoInstituicao.value.trim();
    const curso = campoCurso.value.trim();
    const semestre = Number(campoSemestre.value);
    const turno = campoTurno.value;
    const horas = Number(campoHoras.value);

    if (instituicao) perfil.instituicao = instituicao;
    if (curso) perfil.curso = curso;
    if (Number.isInteger(semestre) && semestre >= 1 && semestre <= 12) perfil.semestre = semestre;
    if (turno) perfil.turno = turno;
    if (Number.isInteger(horas) && horas >= 1 && horas <= 168) perfil.metaSemanalHoras = horas;

    return perfil;
}

function atualizarEstado() {
    const total = disciplinas.length;
    const pronto = perfilCompleto();
    botaoProximo.disabled = !pronto;

    if (pronto) {
        estadoRodape.innerHTML = `ⓘ <strong>Passo 1 de 4 pronto</strong> • ${total} disciplina${total > 1 ? 's' : ''} e meta de ${campoHoras.value}h por semana`;
        return;
    }

    const falta = [];
    if (!campoInstituicao.value.trim() || !campoCurso.value.trim() || !campoSemestre.value || !campoTurno.value) {
        falta.push('o perfil acadêmico');
    }
    if (!horasValidas()) falta.push('a meta de horas');
    if (total === 0) falta.push('ao menos uma disciplina');

    estadoRodape.innerHTML = `ⓘ <strong>Passo 1 de 4</strong> • Falta ${falta.join(' e ')}`;
}

function renderizarDisciplinas() {
    if (disciplinas.length === 0) {
        lista.innerHTML = `
            <li class="estado-vazio">
                <strong>Nenhuma disciplina ainda</strong>
                <p>Cadastre as matérias deste período. Os horários de aula e as metas de disciplina vão se ligar a esta lista.</p>
            </li>`;
        atualizarEstado();
        return;
    }

    lista.innerHTML = disciplinas.map((disciplina) => `
        <li class="item-disciplina">
            <span class="ponto-disciplina ${escapar(disciplina.cor || 'roxo')}"></span>
            <strong>${escapar(disciplina.nome)}</strong>
            <small>Dificuldade ${escapar(disciplina.dificuldade || 3)}/5</small>
            <button type="button" class="botao-remover" data-remover="${escapar(disciplina.id)}" aria-label="Remover ${escapar(disciplina.nome)}">×</button>
        </li>
    `).join('');

    atualizarEstado();
}

function preencherPerfil(dados) {
    usuario = dados;
    if (!dados) return;

    campoInstituicao.value = dados.instituicao || '';
    campoCurso.value = dados.curso || '';
    campoSemestre.value = dados.semestre ? String(dados.semestre) : '';
    campoTurno.value = dados.turno || '';
    campoHoras.value = dados.metaSemanalHoras || 10;

    if (typeof aplicarUsuarioNoCabecalho === 'function') {
        aplicarUsuarioNoCabecalho(dados);
    }
}

async function salvarPerfil() {
    const perfil = lerPerfil();

    if (!Object.keys(perfil).length) {
        return usuario;
    }

    usuario = await AcaiApi.atualizarUsuarioAtual(perfil);

    if (typeof aplicarUsuarioNoCabecalho === 'function') {
        aplicarUsuarioNoCabecalho(usuario);
    }

    return usuario;
}

window.salvarPassoOnboarding = salvarPerfil;

function prepararIntro() {
    const modal = document.getElementById('boas-vindas-fundo');
    if (!modal) return;

    let vista = false;

    try {
        vista = localStorage.getItem(CHAVE_INTRO) === '1';
    } catch {
        vista = false;
    }

    if (vista) {
        modal.hidden = true;
        return;
    }

    modal.hidden = false;
    document.body.classList.add('boas-vindas-abertas');

    function fechar() {
        modal.hidden = true;
        document.body.classList.remove('boas-vindas-abertas');

        try {
            localStorage.setItem(CHAVE_INTRO, '1');
        } catch {
            // A introdução pode aparecer de novo neste navegador.
        }
    }

    document.getElementById('comecar-onboarding')?.addEventListener('click', fechar);
    document.getElementById('fechar-boas-vindas')?.addEventListener('click', fechar);
    modal.addEventListener('click', (evento) => {
        if (evento.target === modal) fechar();
    });
    document.addEventListener('keydown', (evento) => {
        if (evento.key === 'Escape' && !modal.hidden) fechar();
    });
}

formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    if (!botaoProximo.disabled) botaoProximo.click();
});

formulario.addEventListener('input', () => {
    document.querySelectorAll('.curso-usuario').forEach((elemento) => {
        elemento.textContent = campoCurso.value.trim() || 'Curso ainda não informado';
    });
    atualizarEstado();
});

formulario.addEventListener('change', atualizarEstado);

formularioDisciplina.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const nome = campoNome.value.trim();
    const curso = campoCurso.value.trim();
    const dificuldade = Number(campoDificuldade.value);

    if (nome.length < 2) {
        AcaiAvisos.mostrar('O nome da disciplina precisa ter ao menos 2 caracteres.');
        campoNome.focus();
        return;
    }

    if (curso.length < 2) {
        AcaiAvisos.mostrar('Informe o curso antes de cadastrar a disciplina. Ele vira a área da matéria.');
        campoCurso.focus();
        return;
    }

    if (disciplinas.some((item) => item.nome.toLowerCase() === nome.toLowerCase())) {
        AcaiAvisos.mostrar('Essa disciplina já está na lista.');
        return;
    }

    const botao = formularioDisciplina.querySelector('[type="submit"]');
    botao.disabled = true;

    try {
        await salvarPerfil();
        const criada = await AcaiApi.criarDisciplina({
            nome,
            area: curso.slice(0, 80),
            dificuldade,
            cor: CORES[disciplinas.length % CORES.length],
            periodoLetivo: periodoLetivo(),
        });
        disciplinas.push(criada);
        campoNome.value = '';
        campoDificuldade.value = '3';
        renderizarDisciplinas();
        campoNome.focus();
    } catch (erro) {
        AcaiAvisos.mostrar(erro.message || 'Não foi possível cadastrar a disciplina.');
    } finally {
        botao.disabled = false;
    }
});

lista.addEventListener('click', async (evento) => {
    const botao = evento.target.closest('[data-remover]');
    if (!botao) return;

    const id = botao.dataset.remover;
    const disciplina = disciplinas.find((item) => item.id === id);
    if (!disciplina) return;

    const confirmou = window.confirm(`Remover "${disciplina.nome}"? Horários já ligados a ela continuam na grade, só deixam de apontar para a disciplina.`);
    if (!confirmou) return;

    botao.disabled = true;

    try {
        await AcaiApi.excluirDisciplina(id);
        disciplinas = disciplinas.filter((item) => item.id !== id);
        renderizarDisciplinas();
    } catch (erro) {
        AcaiAvisos.mostrar(erro.message || 'Não foi possível remover a disciplina.');
        botao.disabled = false;
    }
});

botaoProximo.addEventListener('click', async () => {
    if (!perfilCompleto()) {
        atualizarEstado();
        return;
    }

    botaoProximo.disabled = true;

    try {
        await salvarPerfil();
        window.location.href = 'index_onboarding_horarios.html';
    } catch (erro) {
        AcaiAvisos.mostrar(erro.message || 'Não foi possível salvar o semestre.');
        botaoProximo.disabled = false;
    }
});

async function iniciar() {
    periodo.textContent = `Semestre letivo ${periodoLetivo()}`;
    prepararIntro();

    for (let indice = 1; indice <= 12; indice += 1) {
        const opcao = document.createElement('option');
        opcao.value = String(indice);
        opcao.textContent = `${indice}º semestre`;
        campoSemestre.appendChild(opcao);
    }

    try {
        const [conta, materias] = await Promise.all([
            AcaiApi.obterUsuarioAtual(),
            AcaiApi.listarDisciplinas({ situacao: 'ativa' }),
        ]);
        preencherPerfil(conta);
        disciplinas = materias;
    } catch (erro) {
        AcaiAvisos.mostrar(erro.message || 'Não foi possível carregar o seu semestre.');
    }

    renderizarDisciplinas();
}

iniciar();
