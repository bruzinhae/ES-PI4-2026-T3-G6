// Card "Ajuste automático de grade" da página de Disciplinas: pede as sugestões da semana
// (o servidor Java encaixa as tarefas nos horários que sobram depois dos blocos fixos) e mostra um resumo.
(() => {
    const botao = document.getElementById('botao-ajustar-grade');
    const texto = document.getElementById('texto-ajuste-grade');
    const selo = document.getElementById('selo-ajuste-grade');
    const link = document.getElementById('link-ajuste-grade');
    if (!botao || !texto || !selo) return;

    function duracao(minutos) {
        const horas = Math.floor(minutos / 60);
        const resto = Math.round(minutos % 60);
        if (!horas) return `${resto} min`;
        return resto ? `${horas} h ${resto} min` : `${horas} h`;
    }

    function plural(quantidade, singular, varios) {
        return `${quantidade} ${quantidade === 1 ? singular : varios}`;
    }

    function resumir(resposta) {
        if (!resposta.espacosLivres) {
            return 'Não sobra horário livre nesta semana depois dos blocos fixos e das sessões já marcadas.';
        }

        const livres = `Depois dos seus horários fixos, o tempo livre nesta semana é de ${duracao(resposta.minutosLivres)}.`;
        if (resposta.motivo === 'sem_tarefas') return `${livres} Não há tarefas pendentes para encaixar.`;

        const encaixadas = new Set(resposta.sugestoes.map((sessao) => sessao.tarefaId));
        const semEspaco = resposta.semAlocacao.filter((item) => !encaixadas.has(item.tarefaId)).length;
        const emParte = resposta.semAlocacao.length - semEspaco;

        let frase = `${livres} A Sofia encaixa ${plural(encaixadas.size, 'tarefa', 'tarefas')} em ${plural(resposta.sugestoes.length, 'sessão', 'sessões')}`;
        frase += semEspaco ? ` e ${plural(semEspaco, 'fica', 'ficam')} sem espaço.` : '.';
        if (emParte) frase += ` ${plural(emParte, 'tarefa cabe', 'tarefas cabem')} só em parte.`;
        return frase;
    }

    botao.addEventListener('click', async () => {
        botao.disabled = true;
        selo.textContent = 'Calculando';
        try {
            const resposta = await AcaiApi.obterSugestoesGrade();
            texto.textContent = resumir(resposta);
            selo.textContent = 'Ajuste calculado';
            link.hidden = false;
        } catch (erro) {
            texto.textContent = erro.message || 'Não foi possível calcular o ajuste agora.';
            selo.textContent = 'Indisponível';
            link.hidden = true;
        } finally {
            botao.disabled = false;
        }
    });
})();
