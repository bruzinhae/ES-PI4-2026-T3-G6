inicializarMenusOnboarding();
marcarPassoOnboarding('foco');

const CHAVE_FOCO = 'acaistudy-onboarding-foco-v2';

const janelas = {
    manha: { rotulo: '08:30 – 12:00', nota: 'deixa o estudo denso na manhã' },
    tarde: { rotulo: '14:00 – 18:00', nota: 'deixa o estudo denso na tarde' },
    noite: { rotulo: '19:00 – 22:30', nota: 'deixa o estudo denso depois das aulas, à noite' },
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

const estado = {
    janela: 'tarde',
    duracao: '50',
    antifadiga: true,
    repeticao: true,
    dinamico: true,
    rigidez: 'equilibrado',
};

function janelaSugerida(turno) {
    if (turno === 'matutino') return 'tarde';
    if (turno === 'vespertino') return 'noite';
    if (turno === 'noturno') return 'manha';
    if (turno === 'integral') return 'noite';
    return 'tarde';
}

function textoDoTurno(turno) {
    const janela = janelas[janelaSugerida(turno)];
    if (turno === 'matutino') {
        return `Suas aulas são de manhã, então a sugestão de estudo denso é ${janela.rotulo}.`;
    }
    if (turno === 'vespertino') {
        return `Suas aulas são à tarde, então a sugestão de estudo denso é ${janela.rotulo}.`;
    }
    if (turno === 'noturno') {
        return `Suas aulas são à noite, então a sugestão de estudo denso é ${janela.rotulo}.`;
    }
    if (turno === 'integral') {
        return `O turno integral ocupa o dia, então a sugestão de estudo denso é ${janela.rotulo}.`;
    }
    return 'Escolha a janela em que o estudo denso rende mais. Dá para trocar depois em Configurações.';
}

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

    const regras = [];
    if (estado.antifadiga) regras.push('limita blocos contínuos');
    if (estado.repeticao) regras.push('reserva revisões espaçadas');
    if (estado.dinamico) regras.push('recalcula a semana quando algo muda');

    let complemento = '';

    if (regras.length === 1) {
        complemento = ` e ${regras[0]}`;
    } else if (regras.length === 2) {
        complemento = `, ${regras[0]} e ${regras[1]}`;
    } else if (regras.length > 2) {
        complemento = `, ${regras.slice(0, -1).join(', ')} e ${regras.at(-1)}`;
    }

    notaSofia.textContent = `A grade ${janela.nota}${complemento}. A Sofia comenta o resultado nos relatórios.`;

    const metaDinamico = document.getElementById('meta-dinamico');
    if (metaDinamico) {
        metaDinamico.textContent = estado.dinamico
            ? 'A semana é recalculada quando algo muda'
            : 'A grade só muda quando você editar';
    }
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

function payloadDaConta() {
    return {
        antifadiga: estado.antifadiga,
        focoMatinal: true,
        repeticaoEspacada: estado.repeticao,
        ajusteDinamico: estado.dinamico,
        rigidez: estado.rigidez,
        janelaFoco: estado.janela,
        duracaoMinutos: Number(estado.duracao),
    };
}

async function salvarConfiguracao() {
    salvarEstado();
    await AcaiApi.salvarConfiguracoes(payloadDaConta());
}

window.salvarPassoOnboarding = salvarConfiguracao;

document.getElementById('botao-voltar').addEventListener('click', () => {
    window.location.href = 'index_onboarding_metas.html';
});

document.getElementById('botao-concluir').addEventListener('click', async (evento) => {
    const botao = evento.currentTarget;
    botao.disabled = true;

    try {
        await salvarConfiguracao();
    } catch (erro) {
        AcaiAvisos.mostrar(erro.message || 'Não foi possível salvar as preferências.');
        botao.disabled = false;
        return;
    }

    finalizarOnboarding(botao);
});

async function iniciar() {
    const rascunho = carregarEstado();

    try {
        const [resposta, usuario] = await Promise.all([
            AcaiApi.obterConfiguracoes(),
            AcaiApi.obterUsuarioAtual(),
        ]);
        const config = resposta.configuracao || {};
        const dica = document.getElementById('dica-foco');
        if (dica) dica.textContent = textoDoTurno(usuario?.turno);

        if (rascunho) {
            Object.assign(estado, rascunho);
        } else {
            estado.janela = janelaSugerida(usuario?.turno);
            estado.duracao = String(config.duracaoMinutos || 50);
            estado.antifadiga = config.antifadiga !== false;
            estado.repeticao = config.repeticaoEspacada !== false;
            estado.dinamico = config.ajusteDinamico !== false;
            estado.rigidez = config.rigidez || 'equilibrado';
        }
    } catch (erro) {
        if (rascunho) Object.assign(estado, rascunho);
        AcaiAvisos.mostrar(erro.message || 'Não foi possível carregar as preferências.');
    }

    aplicarEstadoNaTela();
}

iniciar();
