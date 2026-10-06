renderLayout({
    paginaAtiva: '',
});

const botaoSalvar = document.getElementById('botao-salvar');
const botaoDescartar = document.getElementById('botao-descartar');
const campos = document.querySelectorAll('.grade-campos input');

const valoresIniciais = new Map();

campos.forEach((campo) => {
    valoresIniciais.set(campo.name, campo.value);
});

botaoDescartar?.addEventListener('click', () => {
    campos.forEach((campo) => {
        const valor = valoresIniciais.get(campo.name);

        if (typeof valor === 'string') {
            campo.value = valor;
        }
    });
});

botaoSalvar?.addEventListener('click', () => {
    campos.forEach((campo) => {
        valoresIniciais.set(campo.name, campo.value);
    });

    const textoOriginal = botaoSalvar.querySelector('span')?.textContent;

    if (botaoSalvar.querySelector('span')) {
        botaoSalvar.querySelector('span').textContent = 'Salvo';
    }

    botaoSalvar.disabled = true;

    window.setTimeout(() => {
        if (botaoSalvar.querySelector('span') && textoOriginal) {
            botaoSalvar.querySelector('span').textContent = textoOriginal;
        }

        botaoSalvar.disabled = false;
    }, 1400);
});
