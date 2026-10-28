renderLayout({
    paginaAtiva: 'relatorios',
});

(function () {
    const rotuloPeriodo = document.getElementById('rotulo-periodo');
    let inicioSemana = inicioDaSemana(new Date());

    function inicioDaSemana(data) {
        const inicio = new Date(data.getFullYear(), data.getMonth(), data.getDate());
        inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7));
        inicio.setHours(0, 0, 0, 0);
        return inicio;
    }

    function chaveData(data) {
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const dia = String(data.getDate()).padStart(2, '0');
        return `${data.getFullYear()}-${mes}-${dia}`;
    }

    function duracao(minutos) {
        const total = Math.max(0, Math.round(Number(minutos) || 0));
        const horas = Math.floor(total / 60);
        const resto = total % 60;
        if (!horas) return `${resto}min`;
        if (!resto) return `${horas}h`;
        return `${horas}h ${resto}min`;
    }

    function escapar(texto) {
        return String(texto ?? '').replace(/[&<>"']/g, (caractere) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
        }[caractere]));
    }

    function pintar(relatorio) {
        rotuloPeriodo.textContent = relatorio.periodo.rotulo;
        document.getElementById('kpi-foco').textContent = duracao(relatorio.foco.minutosMedios);
        document.getElementById('kpi-foco-nota').textContent = relatorio.foco.nota;

        const variacao = document.getElementById('kpi-variacao');
        const variacaoTexto = document.getElementById('kpi-variacao-texto');
        if (relatorio.foco.variacaoPercentual === null) {
            variacao.hidden = true;
        } else {
            const valor = relatorio.foco.variacaoPercentual;
            variacao.hidden = false;
            variacaoTexto.textContent = `${valor > 0 ? '+' : ''}${valor}% vs semana anterior`;
        }

        const consistencia = relatorio.consistencia;
        document.getElementById('kpi-consistencia').textContent = `${consistencia.percentual}%`;
        document.getElementById('kpi-consistencia-fracao').textContent = `${consistencia.cumpridas}/${consistencia.previstas} sessões`;
        document.getElementById('kpi-consistencia-barra').style.width = `${consistencia.percentual}%`;
        document.getElementById('kpi-consistencia-nota').textContent = consistencia.previstas
            ? `${consistencia.cumpridas} de ${consistencia.previstas} sessões concluídas`
            : 'Nenhuma sessão encerrada neste período';

        const pomodoro = relatorio.pomodoro;
        document.getElementById('kpi-pomodoro').textContent = `${pomodoro.concluidos}/${pomodoro.planejados}`;
        document.getElementById('kpi-pomodoro-pct').textContent = `${pomodoro.percentual}%`;

        document.getElementById('kpi-destaque-nome').textContent = relatorio.destaque.nome;
        const seloDestaque = document.getElementById('kpi-destaque-status');
        seloDestaque.textContent = relatorio.destaque.status;
        seloDestaque.classList.toggle('selo-verde', Boolean(relatorio.destaque.emDia));
        document.getElementById('kpi-destaque-nota').textContent = relatorio.destaque.nota;

        const eixo = relatorio.horasSemana.eixoMaxHoras;
        document.getElementById('eixo-horas').innerHTML = [eixo, Math.round(eixo * 2 / 3), Math.round(eixo / 3), 0]
            .map((hora) => `<span>${hora}h</span>`)
            .join('');

        const barras = document.getElementById('barras-semana');
        barras.innerHTML = relatorio.horasSemana.dias.map((dia) => {
            const teorico = Math.round((dia.teoricoMin / 60 / eixo) * 100);
            const pratica = Math.round((dia.praticaMin / 60 / eixo) * 100);
            return `
                <div class="coluna-dia" style="--teorico: ${teorico}%; --pratica: ${pratica}%">
                    <div class="pilha">
                        <span class="barra-pratica"></span>
                        <span class="barra-teorico"></span>
                    </div>
                    <span class="rotulo-dia">${escapar(dia.rotulo)}</span>
                </div>`;
        }).join('');
        document.getElementById('nota-grafico').textContent = relatorio.horasSemana.nota;

        document.getElementById('donut-metas').style.setProperty('--progresso', relatorio.metas.percentual);
        document.getElementById('metas-percentual').textContent = `${relatorio.metas.percentual}%`;
        document.getElementById('metas-criticas').textContent = relatorio.metas.criticas === 1
            ? '1 crítica'
            : `${relatorio.metas.criticas} críticas`;

        const cores = { alta: '#be123c', media: '#2563eb', baixa: '#10b981' };
        const nomes = { alta: 'Alta', media: 'Média', baixa: 'Baixa' };
        document.getElementById('lista-prioridades').innerHTML = ['alta', 'media', 'baixa'].map((chave) => {
            const valor = relatorio.metas.porPrioridade[chave] || 0;
            return `
                <div class="prioridade">
                    <div class="prioridade-topo">
                        <span>${nomes[chave]}</span>
                        <strong>${valor}%</strong>
                    </div>
                    <div class="trilha">
                        <span style="width: ${valor}%; background: ${cores[chave]}"></span>
                    </div>
                </div>`;
        }).join('');

        const total = relatorio.disciplinas.length;
        document.getElementById('selo-disciplinas').textContent = `${total} ${total === 1 ? 'disciplina' : 'disciplinas'}`;
        const lista = document.getElementById('lista-defasagem');
        if (!total) {
            lista.innerHTML = '<p class="nota-grafico">Nenhuma disciplina ativa. Cadastre uma matéria para ver o progresso.</p>';
        } else {
            lista.innerHTML = relatorio.disciplinas.map((disciplina) => {
                const cor = disciplina.emDia ? '#10b981' : '#dc2626';
                const etiqueta = disciplina.emDia
                    ? 'etiqueta etiqueta-verde'
                    : 'etiqueta etiqueta-rosa';
                const status = disciplina.emDia
                    ? 'Em dia'
                    : `Pendente ${duracao(disciplina.pendenteMin)}`;
                const icone = disciplina.emDia
                    ? 'assets/icons/relatorios/consistencia.svg'
                    : 'assets/icons/relatorios/card-atencao.svg';
                return `
                    <article class="linha-defasagem">
                        <div class="defasagem-esquerda">
                            <div class="meta-icone ${disciplina.emDia ? 'icone-verde' : 'icone-vermelho'}">
                                <img src="${icone}" alt="" width="16" height="15">
                            </div>
                            <div class="defasagem-corpo">
                                <div class="defasagem-titulo">
                                    <h3>${escapar(disciplina.nome)}</h3>
                                    <span class="${etiqueta}">${escapar(status)}</span>
                                </div>
                                <div class="defasagem-progresso">
                                    <div class="defasagem-progresso-topo">
                                        <span>Conteúdo programático</span>
                                        <strong style="color: ${cor}">${disciplina.progresso}%</strong>
                                    </div>
                                    <div class="trilha">
                                        <span style="width: ${disciplina.progresso}%; background: ${cor}"></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <a class="botao-acao-linha botao-claro" href="index_disciplinas.html">Ver disciplina</a>
                    </article>`;
            }).join('');
        }

        const atrasada = relatorio.disciplinas.find((disciplina) => !disciplina.emDia);
        document.getElementById('texto-insight').textContent = atrasada
            ? `${atrasada.nome} está com ${duracao(atrasada.pendenteMin)} de conteúdo pendente e ${atrasada.progresso}% concluído. Priorize um bloco de estudo nessa matéria.`
            : relatorio.disciplinas.length
                ? 'As disciplinas ativas estão em dia. As horas do gráfico vêm das sessões de estudo concluídas nesta semana.'
                : 'Cadastre disciplinas e conclua conteúdos para a Sofia montar este painel com os seus dados.';
    }

    async function carregar() {
        try {
            const { relatorio } = await AcaiApi.obterRelatorio(chaveData(inicioSemana));
            pintar(relatorio);
        } catch (erro) {
            document.getElementById('kpi-foco-nota').textContent = erro.message || 'Não foi possível carregar o relatório.';
        }
    }

    document.getElementById('periodo-anterior')?.addEventListener('click', () => {
        inicioSemana.setDate(inicioSemana.getDate() - 7);
        carregar();
    });
    document.getElementById('periodo-proxima')?.addEventListener('click', () => {
        inicioSemana.setDate(inicioSemana.getDate() + 7);
        carregar();
    });
    document.getElementById('botao-otimizar')?.addEventListener('click', () => {
        document.getElementById('lista-defasagem')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    document.getElementById('botao-exportar')?.addEventListener('click', () => {
        window.print();
    });

    carregar();
})();
