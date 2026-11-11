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
            lista.innerHTML = '<p class="nota-grafico">Nenhuma disciplina ativa. Cadastre uma matéria para montar a rotina.</p>';
        } else {
            lista.innerHTML = relatorio.disciplinas.map((disciplina) => {
                const horas = Number(disciplina.horasSemanais) || 0;
                const progresso = disciplina.progresso;
                const largura = Math.min(100, Number(progresso) || 0);
                const cor = disciplina.naGrade ? '#4F3466' : '#C9A74D';
                const etiqueta = disciplina.naGrade
                    ? 'etiqueta etiqueta-verde'
                    : 'etiqueta etiqueta-ambar';
                const status = disciplina.naGrade ? 'Na rotina' : 'Sem horário';
                const valor = progresso === null || progresso === undefined ? `${horas}h` : `${horas}h • ${progresso}%`;
                return `
                    <article class="linha-defasagem">
                        <div class="defasagem-esquerda">
                            <div class="meta-icone ${disciplina.naGrade ? 'icone-verde' : 'icone-ambar'}">
                                <img src="assets/icons/relatorios/consistencia.svg" alt="" width="16" height="15">
                            </div>
                            <div class="defasagem-corpo">
                                <div class="defasagem-titulo">
                                    <h3>${escapar(disciplina.nome)}</h3>
                                    <span class="${etiqueta}">${status}</span>
                                </div>
                                <div class="defasagem-progresso">
                                    <div class="defasagem-progresso-topo">
                                        <span>Da meta semanal</span>
                                        <strong style="color: ${cor}">${valor}</strong>
                                    </div>
                                    <div class="trilha">
                                        <span style="width: ${largura}%; background: ${cor}"></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <a class="botao-acao-linha botao-claro" href="index_disciplinas.html">Ver rotina</a>
                    </article>`;
            }).join('');
        }

        const rotina = relatorio.rotina || {};
        const semHorario = relatorio.disciplinas.find((disciplina) => !disciplina.naGrade);
        const cobertura = rotina.metaHoras
            ? `A rotina cobre ${rotina.horas}h das ${rotina.metaHoras}h da meta semanal (${rotina.percentual}%).`
            : `A rotina desta semana soma ${rotina.horas || 0}h. Defina a meta de horas no perfil para ver o percentual.`;
        document.getElementById('texto-insight').textContent = semHorario
            ? `${cobertura} ${semHorario.nome} ainda não tem horário fixo.`
            : cobertura;
    }

    // A Sofia responde depois do painel. O contador descarta a resposta de uma semana que já saiu da tela.
    let ultimoPedidoSofia = 0;

    function pintarSugestoes(sugestoes) {
        const lista = document.getElementById('lista-sugestoes');
        lista.hidden = !sugestoes.length;
        lista.innerHTML = sugestoes.map((sugestao) => `
            <li class="sugestao-sofia prioridade-${escapar(sugestao.prioridade)}">
                <div class="sugestao-topo">
                    <strong>${escapar(sugestao.titulo)}</strong>
                    <span>${escapar(sugestao.dia)}</span>
                </div>
                <p>${escapar(sugestao.detalhe)}</p>
            </li>`).join('');
    }

    async function carregar() {
        try {
            const inicio = chaveData(inicioSemana);
            const { relatorio } = await AcaiApi.obterRelatorio(inicio);
            pintar(relatorio);
            await prepararSofia(inicio);
        } catch (erro) {
            document.getElementById('kpi-foco-nota').textContent = erro.message || 'Não foi possível carregar o relatório.';
        }
    }

    document.addEventListener('acaistudy:pomodoro-registrado', () => {
        const hoje = new Date();
        const fim = new Date(inicioSemana);
        fim.setDate(fim.getDate() + 7);
        if (hoje >= inicioSemana && hoje < fim) {
            carregar();
        }
    });

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

    const listaPerguntas = document.getElementById('perguntas-sofia');
    const avisoConversa = document.getElementById('conversa-aviso');
    const formConversa = document.getElementById('form-conversa');
    const botaoAnalisar = document.getElementById('botao-analisar');
    const notaTema = document.getElementById('nota-tema');
    const seloSofia = document.getElementById('selo-sofia');
    const textoInsight = document.getElementById('texto-insight');

    function mostrarAvisoConversa(texto) {
        avisoConversa.hidden = !texto;
        avisoConversa.textContent = texto || '';
    }

    function mostrarPerguntas(visivel) {
        formConversa.hidden = !visivel;
        notaTema.hidden = !visivel;
        botaoAnalisar.hidden = visivel;
    }

    function pintarPerguntas(mensagens) {
        const seguidas = (mensagens || []).slice(1);
        listaPerguntas.innerHTML = seguidas.map((mensagem) => `
            <p class="${mensagem.papel === 'usuario' ? 'pergunta-sofia' : 'resposta-sofia'}">${escapar(mensagem.texto)}</p>
        `).join('');
    }

    function aguardandoAnalise() {
        textoInsight.textContent = 'Clique em Analisar para a Sofia ler a rotina desta semana.';
        seloSofia.textContent = 'Aguardando análise';
        seloSofia.title = '';
        pintarSugestoes([]);
        pintarPerguntas([]);
        mostrarAvisoConversa('');
        mostrarPerguntas(false);
        botaoAnalisar.disabled = false;
        botaoAnalisar.textContent = 'Analisar';
    }

    async function prepararSofia(inicio) {
        aguardandoAnalise();
        try {
            const { conversa } = await AcaiApi.listarConversaSofia(inicio);
            if (inicio !== chaveData(inicioSemana)) return;
            const abertura = conversa.mensagens?.[0];
            if (!abertura) return;
            textoInsight.textContent = abertura.texto;
            seloSofia.textContent = 'Análise da semana';
            pintarPerguntas(conversa.mensagens);
            mostrarPerguntas(true);
        } catch (erro) {
            if (inicio !== chaveData(inicioSemana)) return;
            mostrarAvisoConversa(erro.message || 'Não foi possível carregar a análise salva.');
        }
    }

    async function analisarSemana() {
        const inicio = chaveData(inicioSemana);
        const pedido = ++ultimoPedidoSofia;
        botaoAnalisar.disabled = true;
        botaoAnalisar.textContent = 'Analisando...';
        seloSofia.textContent = 'Analisando a semana...';
        mostrarAvisoConversa('');
        try {
            const { sofia } = await AcaiApi.obterSugestoesSofia(inicio);
            if (pedido !== ultimoPedidoSofia) return;
            const { conversa } = await AcaiApi.abrirConversaSofia(inicio);
            if (pedido !== ultimoPedidoSofia) return;
            textoInsight.textContent = sofia.resumo;
            seloSofia.textContent = {
                leve: 'Carga leve',
                equilibrada: 'Carga equilibrada',
                pesada: 'Carga pesada',
                sobrecarregada: 'Sobrecarga',
            }[sofia.nivelCarga] || 'Sem atividades';
            pintarSugestoes(sofia.sugestoes);
            pintarPerguntas(conversa.mensagens);
            mostrarPerguntas(true);
        } catch (erro) {
            if (pedido !== ultimoPedidoSofia) return;
            seloSofia.textContent = 'Sofia indisponível';
            seloSofia.title = erro.message || '';
            mostrarAvisoConversa(erro.message || 'A Sofia não conseguiu analisar a semana.');
            botaoAnalisar.disabled = false;
            botaoAnalisar.textContent = 'Analisar';
        }
    }

    botaoAnalisar?.addEventListener('click', analisarSemana);

    formConversa?.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        const campo = formConversa.elements.texto;
        const texto = campo.value.trim();
        if (texto.length < 2) return;
        const botao = formConversa.querySelector('button');
        campo.disabled = true;
        botao.disabled = true;
        mostrarAvisoConversa('');
        try {
            const { conversa } = await AcaiApi.enviarConversaSofia(chaveData(inicioSemana), texto);
            campo.value = '';
            pintarPerguntas(conversa.mensagens);
        } catch (erro) {
            mostrarAvisoConversa(erro.message || 'A Sofia não conseguiu responder.');
        } finally {
            campo.disabled = false;
            botao.disabled = false;
            campo.focus();
        }
    });

    carregar();
})();
