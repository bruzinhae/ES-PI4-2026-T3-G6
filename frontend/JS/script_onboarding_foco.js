inicializarMenusOnboarding();

const CHAVE_FOCO = 'acaistudy-onboarding-foco';

const janelas = {
    manha: { rotulo: '08:30 – 12:00', nota: 'priorizo disciplinas densas na manhã' },
    tarde: { rotulo: '14:00 – 18:00', nota: 'priorizo blocos de alto impacto na tarde' },
    noite: { rotulo: '19:00 – 22:30', nota: 'concentro o estudo após as aulas, à noite' },
};

const rigidezRotulo = {
    flexivel: 'Flexível',
    equilibrado: 'Equilibrado',
    intensivo: 'Intensivo',
};

const perfis = {
    equilibrado: {
        janela: 'tarde',
        duracao: '50',
        antifadiga: true,
        repeticao: true,
        dinamico: true,
        rigidez: 'equilibrado',
    },
    matinal: {
        janela: 'manha',
        duracao: '50',
        antifadiga: true,
        repeticao: true,
        dinamico: true,
        rigidez: 'equilibrado',
    },
    noturno: {
        janela: 'noite',
        duracao: '25',
        antifadiga: true,
        repeticao: false,
        dinamico: true,
        rigidez: 'flexivel',
    },
    intensivo: {
        janela: 'manha',
        duracao: '90',
        antifadiga: true,
        repeticao: true,
        dinamico: true,
        rigidez: 'intensivo',
    },
};

const estado = carregarEstado() || { ...perfis.equilibrado };

const resumoJanela = document.getElementById('resumo-janela');
const resumoDuracao = document.getElementById('resumo-duracao');
const resumoPausa = document.getElementById('resumo-pausa');
const resumoRigidez = document.getElementById('resumo-rigidez');
const notaSofia = document.getElementById('nota-sofia-texto');
const metaAntifadiga = document.getElementById('meta-antifadiga');

const inputAntifadiga = document.getElementById('config-antifadiga');
const inputRepeticao = document.getElementById('config-repeticao');
const inputDinamico = document.getElementById('config-dinamico');

function carregarEstado() {
    try {
        const bruto = localStorage.getItem(CHAVE_FOCO);
        return bruto ? JSON.parse(bruto) : null;
    } catch {
        return null;
    }
}

function salvarEstado() {
    localStorage.setItem(CHAVE_FOCO, JSON.stringify(estado));
}

function ativarChip(grupo, seletor, valor, atributo) {
    grupo.querySelectorAll(seletor).forEach((botao) => {
        botao.classList.toggle('ativo', botao.dataset[atributo] === valor);
    });
}

function atualizarResumo() {
    const janela = janelas[estado.janela];
    const duracao = Number(estado.duracao);

    resumoJanela.textContent = janela.rotulo;
    resumoDuracao.textContent = `${duracao} min`;
    resumoPausa.textContent = `A cada ${duracao} min`;
    resumoRigidez.textContent = rigidezRotulo[estado.rigidez];
    metaAntifadiga.textContent = `Limite contínuo: ${Math.max(duracao, 90)} min`;

    const protecoes = [];
    if (estado.antifadiga) protecoes.push('protegendo pausas contra fadiga');
    if (estado.repeticao) protecoes.push('agendando revisões espaçadas');
    if (estado.dinamico) protecoes.push('reorganizando a semana em tempo real');

    let complemento = '';

    if (protecoes.length === 1) {
        complemento = `, ${protecoes[0]}`;
    } else if (protecoes.length === 2) {
        complemento = `, ${protecoes[0]} e ${protecoes[1]}`;
    } else if (protecoes.length > 2) {
        complemento = `, ${protecoes.slice(0, -1).join(', ')} e ${protecoes.at(-1)}`;
    }

    notaSofia.textContent = `Com esse perfil, ${janela.nota}${complemento}.`;
}

function aplicarEstadoNaTela() {
    ativarChip(document.getElementById('chips-janela'), '.chip', estado.janela, 'janela');
    ativarChip(document.getElementById('chips-duracao'), '.chip', estado.duracao, 'duracao');
    ativarChip(document.getElementById('seletor-rigidez'), 'button', estado.rigidez, 'rigidez');

    inputAntifadiga.checked = estado.antifadiga;
    inputRepeticao.checked = estado.repeticao;
    inputDinamico.checked = estado.dinamico;

    atualizarResumo();
    salvarEstado();
}

function aplicarPerfil(nome) {
    Object.assign(estado, perfis[nome]);

    document.querySelectorAll('.perfil-foco').forEach((botao) => {
        botao.classList.toggle('ativo', botao.dataset.perfil === nome);
    });

    aplicarEstadoNaTela();
}

document.getElementById('lista-perfis').addEventListener('click', (evento) => {
    const botao = evento.target.closest('.perfil-foco');

    if (!botao) {
        return;
    }

    aplicarPerfil(botao.dataset.perfil);
});

document.getElementById('chips-janela').addEventListener('click', (evento) => {
    const botao = evento.target.closest('.chip');

    if (!botao) {
        return;
    }

    estado.janela = botao.dataset.janela;
    aplicarEstadoNaTela();
});

document.getElementById('chips-duracao').addEventListener('click', (evento) => {
    const botao = evento.target.closest('.chip');

    if (!botao) {
        return;
    }

    estado.duracao = botao.dataset.duracao;
    aplicarEstadoNaTela();
});

document.getElementById('seletor-rigidez').addEventListener('click', (evento) => {
    const botao = evento.target.closest('button');

    if (!botao) {
        return;
    }

    estado.rigidez = botao.dataset.rigidez;
    aplicarEstadoNaTela();
});

inputAntifadiga.addEventListener('change', () => {
    estado.antifadiga = inputAntifadiga.checked;
    aplicarEstadoNaTela();
});

inputRepeticao.addEventListener('change', () => {
    estado.repeticao = inputRepeticao.checked;
    aplicarEstadoNaTela();
});

inputDinamico.addEventListener('change', () => {
    estado.dinamico = inputDinamico.checked;
    aplicarEstadoNaTela();
});

document.getElementById('botao-voltar').addEventListener('click', () => {
    window.location.href = 'index_onboarding_metas.html';
});

document.getElementById('botao-concluir').addEventListener('click', async () => {
    localStorage.setItem('acaistudy-onboarding-completo', '1');
    salvarEstado();

    if (AcaiApi.temUsuarioAtual()) {
        await AcaiApi.atualizarUsuarioAtual({ onboardingConcluido: true }).catch(() => {});
    }

    window.location.href = 'index_calendario.html';
});

document.getElementById('pular-onboarding').addEventListener('click', () => {
    window.location.href = 'index_calendario.html';
});

aplicarEstadoNaTela();
