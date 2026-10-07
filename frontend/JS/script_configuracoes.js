renderLayout({
    paginaAtiva: '',
});

const botaoSalvar = document.getElementById('botao-salvar');
const botaoDescartar = document.getElementById('botao-descartar');
const statusAuto = document.getElementById('status-auto');
const botaoCopiar = document.getElementById('botao-copiar');
const botaoRevogar = document.getElementById('botao-revogar');
const botaoRecalibrar = document.getElementById('botao-recalibrar');
const chaveApi = document.getElementById('chave-api');

const interruptores = document.querySelectorAll('.interruptor input');
const botoesRigidez = document.querySelectorAll('.seletor-rigidez button');

const estadoInicial = {
    checks: new Map(),
    rigidez: 'equilibrado',
};

interruptores.forEach((input) => {
    estadoInicial.checks.set(input.name, input.checked);
});

function marcarAlterado() {
    if (statusAuto) {
        statusAuto.innerHTML = '<span class="ponto-verde" style="background:#f59e0b"></span> Alterações não salvas';
    }
}

function marcarSalvo() {
    if (statusAuto) {
        statusAuto.innerHTML = '<span class="ponto-verde"></span> Salvo automaticamente agora';
    }
}

interruptores.forEach((input) => {
    input.addEventListener('change', marcarAlterado);
});

botoesRigidez.forEach((botao) => {
    botao.addEventListener('click', () => {
        botoesRigidez.forEach((item) => item.classList.remove('ativo'));
        botao.classList.add('ativo');
        marcarAlterado();
    });
});

botaoDescartar?.addEventListener('click', () => {
    interruptores.forEach((input) => {
        input.checked = Boolean(estadoInicial.checks.get(input.name));
    });

    botoesRigidez.forEach((botao) => {
        botao.classList.toggle('ativo', botao.dataset.rigidez === estadoInicial.rigidez);
    });

    marcarSalvo();
});

botaoSalvar?.addEventListener('click', () => {
    interruptores.forEach((input) => {
        estadoInicial.checks.set(input.name, input.checked);
    });

    const ativo = document.querySelector('.seletor-rigidez button.ativo');
    estadoInicial.rigidez = ativo?.dataset.rigidez || 'equilibrado';

    const texto = botaoSalvar.querySelector('span');
    const original = texto?.textContent;

    if (texto) {
        texto.textContent = 'Salvo';
    }

    botaoSalvar.disabled = true;
    marcarSalvo();

    window.setTimeout(() => {
        if (texto && original) {
            texto.textContent = original;
        }

        botaoSalvar.disabled = false;
    }, 1400);
});

botaoCopiar?.addEventListener('click', async () => {
    const valor = chaveApi?.textContent?.trim() || '';
    const rotulo = botaoCopiar.querySelector('span');

    try {
        await navigator.clipboard.writeText(valor);
    } catch {
        // fallback silencioso para ambientes sem clipboard
    }

    if (rotulo) {
        const original = rotulo.textContent;
        rotulo.textContent = 'Copiado';

        window.setTimeout(() => {
            rotulo.textContent = original;
        }, 1200);
    }
});

botaoRevogar?.addEventListener('click', () => {
    if (chaveApi) {
        chaveApi.textContent = 'chk_live_••••••••••••••••';
    }

    marcarAlterado();
});

botaoRecalibrar?.addEventListener('click', () => {
    const rotulo = botaoRecalibrar.querySelector('span');
    const original = rotulo?.textContent;

    if (rotulo) {
        rotulo.textContent = 'Recalibrando…';
    }

    botaoRecalibrar.disabled = true;

    window.setTimeout(() => {
        if (rotulo && original) {
            rotulo.textContent = original;
        }

        botaoRecalibrar.disabled = false;
        marcarSalvo();
    }, 1200);
});
