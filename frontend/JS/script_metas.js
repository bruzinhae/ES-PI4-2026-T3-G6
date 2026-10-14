renderLayout({
    paginaAtiva: 'metas',
});

const lista = document.getElementById('lista-metas');
const ordenar = document.getElementById('ordenar-metas');
const alternadorSemana = document.querySelectorAll('.alternador button');

// Cada critério devolve um número; a lista é reordenada em ordem crescente.
const criterios = {
    prioridade: (meta) => Number(meta.dataset.prioridade),
    prazo: (meta) => new Date(meta.dataset.prazo).getTime(),
    progresso: (meta) => Number(meta.dataset.progresso),
};

ordenar.addEventListener('change', () => {
    const valor = criterios[ordenar.value];

    Array.from(lista.children)
        .sort((a, b) => valor(a) - valor(b))
        .forEach((meta) => lista.appendChild(meta));
});

alternadorSemana.forEach((botao) => {
    botao.addEventListener('click', () => {
        alternadorSemana.forEach((outro) => outro.classList.remove('ativo'));
        botao.classList.add('ativo');
    });
});

function calcularPorcentagemProgresso(estudado, total) {
    if (total <= 0) return 0;
    if (estudado >= total) return 100;
    return Math.round((estudado / total) * 100);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { calcularPorcentagemProgresso };
}
