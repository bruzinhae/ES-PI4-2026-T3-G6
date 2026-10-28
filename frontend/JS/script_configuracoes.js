/**
 * Tela de configurações. As preferências ficam na conta; o status usa sessões e blocos reais.
 */
(function () {
    renderLayout({ paginaAtiva: '' });

    const CAMPOS = {
        antifadiga: 'config-antifadiga',
        focoMatinal: 'config-foco',
        repeticaoEspacada: 'config-repeticao',
        ajusteDinamico: 'config-dinamico',
    };

    const JANELA = {
        manha: '08:30 – 12:00',
        tarde: '14:00 – 18:00',
        noite: '19:00 – 22:30',
    };

    const formulario = document.querySelector('.conteiner');
    const statusAuto = document.getElementById('status-auto');
    const botaoSalvar = document.getElementById('botao-salvar');
    const botaoDescartar = document.getElementById('botao-descartar');
    const botaoAtualizar = document.getElementById('botao-recalibrar');
    const seletor = document.querySelector('.seletor-rigidez');

    let salva = null;
    let rigidez = 'equilibrado';

    function lerRascunho() {
        const rascunho = { rigidez };
        for (const [campo, nome] of Object.entries(CAMPOS)) {
            rascunho[campo] = Boolean(formulario.querySelector(`[name="${nome}"]`)?.checked);
        }
        return rascunho;
    }

    function aplicar(configuracao) {
        for (const [campo, nome] of Object.entries(CAMPOS)) {
            const input = formulario.querySelector(`[name="${nome}"]`);
            if (input) input.checked = Boolean(configuracao[campo]);
        }
        rigidez = configuracao.rigidez || 'equilibrado';
        seletor?.querySelectorAll('button').forEach((botao) => {
            botao.classList.toggle('ativo', botao.dataset.rigidez === rigidez);
        });
        atualizarTextos(configuracao);
    }

    function atualizarTextos(configuracao) {
        const janela = JANELA[configuracao.janelaFoco] || JANELA.manha;
        const metaAntifadiga = document.getElementById('meta-antifadiga');
        const metaFoco = document.getElementById('meta-foco');
        const metaRepeticao = document.getElementById('meta-repeticao');
        const metaDinamico = document.getElementById('meta-dinamico');
        const statusJanela = document.getElementById('status-janela');

        if (metaAntifadiga) {
            metaAntifadiga.textContent = configuracao.antifadiga
                ? 'Limite contínuo: 90 min'
                : 'Proteção desligada';
        }
        if (metaFoco) {
            metaFoco.textContent = configuracao.focoMatinal
                ? `Janela: ${janela}`
                : 'Janela automática desligada';
        }
        if (metaRepeticao) {
            metaRepeticao.textContent = configuracao.repeticaoEspacada
                ? 'Revisões em D+1, D+4 e D+13'
                : 'Revisões automáticas desligadas';
        }
        if (metaDinamico) {
            metaDinamico.textContent = configuracao.ajusteDinamico
                ? 'A semana é recalculada quando algo muda'
                : 'A grade só muda quando você editar';
        }
        if (statusJanela) {
            statusJanela.textContent = configuracao.focoMatinal ? janela : 'Desligada';
        }
    }

    function pintarResumo(resumo) {
        if (!resumo) return;
        const pausa = document.getElementById('status-pausa');
        const sessoes = document.getElementById('status-sessoes');
        const conflitos = document.getElementById('status-conflitos');
        const selo = document.getElementById('selo-harmonia');
        const nota = document.getElementById('nota-grafico');

        if (pausa) pausa.textContent = resumo.pausa;
        if (sessoes) sessoes.textContent = String(resumo.sessoes);
        if (conflitos) conflitos.textContent = String(resumo.conflitos);
        if (selo) {
            selo.textContent = resumo.harmonia === null
                ? 'Sem base'
                : `${resumo.harmonia}% das sessões cumpridas`;
        }
        if (nota) {
            nota.textContent = resumo.harmonia === null
                ? 'O equilíbrio da semana aparece quando houver sessões concluídas.'
                : `${resumo.rotuloHarmonia}. ${resumo.sessoes} sessão(ões) nesta semana e ${resumo.blocos} compromisso(s) fixo(s).`;
        }
    }

    function marcarEstado(texto) {
        if (statusAuto) statusAuto.lastChild.textContent = ` ${texto}`;
    }

    function houveMudanca() {
        if (!salva) return false;
        const atual = lerRascunho();
        return Object.keys(CAMPOS).some((campo) => atual[campo] !== salva[campo]) || atual.rigidez !== salva.rigidez;
    }

    function refletirRascunho() {
        if (!salva) return;
        const atual = lerRascunho();
        atualizarTextos({ ...salva, ...atual });
        marcarEstado(houveMudanca() ? 'Alterações por salvar' : 'Preferências salvas');
    }

    async function carregar() {
        marcarEstado('Carregando preferências...');
        const { configuracao, resumo } = await AcaiApi.obterConfiguracoes();
        salva = configuracao;
        aplicar(configuracao);
        pintarResumo(resumo);
        marcarEstado('Preferências salvas');
    }

    async function salvar() {
        if (!salva) return;
        const rascunho = lerRascunho();
        botaoSalvar.disabled = true;
        marcarEstado('Salvando...');
        try {
            const { configuracao, resumo } = await AcaiApi.salvarConfiguracoes(rascunho);
            salva = configuracao;
            aplicar(configuracao);
            pintarResumo(resumo);
            marcarEstado('Preferências salvas');
        } catch (erro) {
            marcarEstado(erro.message || 'Não foi possível salvar');
        } finally {
            botaoSalvar.disabled = false;
        }
    }

    formulario?.addEventListener('change', (evento) => {
        if (evento.target.matches('input[type="checkbox"]')) refletirRascunho();
    });

    seletor?.addEventListener('click', (evento) => {
        const botao = evento.target.closest('button[data-rigidez]');
        if (!botao) return;
        rigidez = botao.dataset.rigidez;
        seletor.querySelectorAll('button').forEach((item) => {
            item.classList.toggle('ativo', item === botao);
        });
        refletirRascunho();
    });

    botaoSalvar?.addEventListener('click', salvar);
    botaoDescartar?.addEventListener('click', () => {
        if (!salva) return;
        aplicar(salva);
        marcarEstado('Preferências salvas');
    });
    botaoAtualizar?.addEventListener('click', () => {
        carregar().catch((erro) => marcarEstado(erro.message || 'Não foi possível atualizar'));
    });

    carregar().catch((erro) => marcarEstado(erro.message || 'Não foi possível carregar'));
})();
