const modal = document.querySelector('#modal-bloco');
const formulario = document.querySelector('#formulario-bloco');
const campoNome = document.querySelector('#nome-bloco');
const controleDuracao = document.querySelector('#duracao-bloco');
const saidaDuracao = document.querySelector('#valor-duracao');
const controlePrioridade = document.querySelector('#prioridade-bloco');

function formatarDuracaoBloco(faixas) {
    const minutos = Number(faixas) * 30;
    const horas = Math.floor(minutos / 60);
    const minutosRestantes = minutos % 60;
    return `${horas ? `${horas}h` : ''}${horas && minutosRestantes ? ' ' : ''}${minutosRestantes ? `${minutosRestantes} min` : ''}`;
}

function fecharModal() {
    modal.classList.remove('aberto');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-aberto');
    window.parent.postMessage({ tipo: 'modal-fechado' }, '*');
}

function abrirModal() {
    modal.classList.add('aberto');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-aberto');
    campoNome.focus();
    window.parent.postMessage({ tipo: 'modal-aberto' }, '*');
}

window.addEventListener('message', (evento) => {
    if (evento.source !== window.parent || !evento.data) return;
    if (evento.data.tipo === 'abrir-modal') abrirModal();
});

modal.querySelectorAll('.modal-fechar, .botao-cancelar-modal').forEach((botao) => {
    botao.addEventListener('click', fecharModal);
});

modal.addEventListener('click', (evento) => {
    if (evento.target === modal) fecharModal();
});

document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && modal.classList.contains('aberto')) fecharModal();
});

campoNome.addEventListener('input', () => {
    document.querySelector('#contador-nome').textContent = campoNome.value.length;
});

controleDuracao.addEventListener('input', () => {
    saidaDuracao.textContent = formatarDuracaoBloco(controleDuracao.value);
});

controlePrioridade.addEventListener('input', () => {
    document.querySelector('#valor-prioridade').textContent = `${controlePrioridade.value}/10`;
});

formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const nome = campoNome.value.trim();
    if (!nome) return;

    const categorias = {
        aulas: { nome: 'Aulas', cor: 'roxo', icone: '🎓' },
        trabalho: { nome: 'Trabalho', cor: 'azul', icone: '💼' },
        sono: { nome: 'Sono', cor: 'escuro', icone: '🌙' },
        saude: { nome: 'Saúde', cor: 'verde', icone: '↗' },
        pausa: { nome: 'Pausa', cor: 'amarelo', icone: '🍴' },
        translado: { nome: 'Translado', cor: 'deslocamento', icone: '🚗' },
        outro: { nome: 'Outro', cor: 'roxo', icone: '✦' },
    };
    const categoria = categorias[document.querySelector('#categoria-bloco').value];
    const campoDia = document.querySelector('#dia-preferido');
    const textoDia = campoDia.options[campoDia.selectedIndex].text;
    const horarioPreferido = document.querySelector('#horario-preferido').value;

    window.parent.postMessage({
        tipo: 'bloco-salvo',
        dados: {
            nome,
            categoria: categoria.nome,
            cor: categoria.cor,
            icone: categoria.icone,
            duracaoFaixas: controleDuracao.value,
            duracaoTexto: formatarDuracaoBloco(controleDuracao.value),
            prioridade: controlePrioridade.value,
            diaPreferido: campoDia.value,
            horarioPreferido,
            textoDia,
        },
    }, '*');

    formulario.reset();
    document.querySelector('#contador-nome').textContent = '0';
    controleDuracao.value = '4';
    saidaDuracao.textContent = '2h';
    controlePrioridade.value = '5';
    document.querySelector('#valor-prioridade').textContent = '5/10';
    fecharModal();
});

window.parent.postMessage({ tipo: 'modal-pronto' }, '*');
