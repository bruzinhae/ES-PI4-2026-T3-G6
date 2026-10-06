renderLayout({
    paginaAtiva: 'relatorios',
});

const alternadorSemana = document.querySelectorAll('.alternador button');
const botaoPeriodo = document.getElementById('botao-periodo');

const periodos = {
    Semana: '01 Out – 07 Out 2025',
    Mês: '01 Out – 31 Out 2025',
};

alternadorSemana.forEach((botao) => {
    botao.addEventListener('click', () => {
        alternadorSemana.forEach((outro) => outro.classList.remove('ativo'));
        botao.classList.add('ativo');

        if (botaoPeriodo && periodos[botao.textContent.trim()]) {
            botaoPeriodo.querySelector('span').textContent = periodos[botao.textContent.trim()];
        }
    });
});
