renderLayout({
    paginaAtiva: 'disciplinas',
});

const cartoes = document.getElementById('cartoes-disciplinas');
const filtrarArea = document.getElementById('filtrar-area');
const ordenar = document.getElementById('ordenar-disciplinas');
const alternadorSemana = document.querySelectorAll('.alternador button');

const listaCartoes = Array.from(cartoes.children);

// Mais horas e maior progresso vêm primeiro; nome segue ordem alfabética.
const comparadores = {
    horas: (a, b) => Number(b.dataset.horas) - Number(a.dataset.horas),
    progresso: (a, b) => Number(b.dataset.progresso) - Number(a.dataset.progresso),
    nome: (a, b) => a.dataset.nome.localeCompare(b.dataset.nome, 'pt-BR'),
};

function atualizarLista() {
    const area = filtrarArea.value;

    listaCartoes
        .sort(comparadores[ordenar.value])
        .forEach((cartao) => {
            cartao.hidden = area !== 'todas' && cartao.dataset.area !== area;
            cartoes.appendChild(cartao);
        });
}

filtrarArea.addEventListener('change', atualizarLista);
ordenar.addEventListener('change', atualizarLista);

alternadorSemana.forEach((botao) => {
    botao.addEventListener('click', () => {
        alternadorSemana.forEach((outro) => outro.classList.remove('ativo'));
        botao.classList.add('ativo');
    });
});
