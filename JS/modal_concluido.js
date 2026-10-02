const fundoConclusao = document.querySelector('#fundo-concluido');
const botaoFecharConclusao = document.querySelector('.fechar-concluido');

function fecharModalConclusao() {
    fundoConclusao.classList.remove('aberto');
    fundoConclusao.setAttribute('aria-hidden', 'true');
    window.parent.postMessage({ tipo: 'modal-concluido-fechado' }, '*');
}

function abrirModalConclusao(dados = {}) {
    if (dados.tarefas) {
        document.querySelector('#total-finalizados').textContent = `${dados.tarefas} ${dados.tarefas === 1 ? 'bloco' : 'blocos'}`;
        document.querySelector('#duracao-finalizada').textContent = `${dados.duracao || '0h'} no total`;
    }
    fundoConclusao.classList.add('aberto');
    fundoConclusao.setAttribute('aria-hidden', 'false');
    window.parent.postMessage({ tipo: 'modal-concluido-aberto' }, '*');
    botaoFecharConclusao.focus();
}

botaoFecharConclusao.addEventListener('click', fecharModalConclusao);
document.querySelector('.botao-voltar').addEventListener('click', fecharModalConclusao);
document.querySelector('.botao-progresso').addEventListener('click', () => {
    window.parent.postMessage({ tipo: 'abrir-progresso' }, '*');
});

fundoConclusao.addEventListener('click', (evento) => {
    if (evento.target === fundoConclusao) fecharModalConclusao();
});

document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && fundoConclusao.classList.contains('aberto')) fecharModalConclusao();
});

window.addEventListener('message', (evento) => {
    if (evento.source !== window.parent || !evento.data) return;
    if (evento.data.tipo === 'abrir-modal-concluido') abrirModalConclusao(evento.data.dados);
    if (evento.data.tipo === 'fechar-modal-concluido') fecharModalConclusao();
});

window.parent.postMessage({ tipo: 'modal-concluido-pronto' }, '*');
