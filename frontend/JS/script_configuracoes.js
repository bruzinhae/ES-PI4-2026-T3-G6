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

(function () {
    const form = document.getElementById('form-canvas');
    if (!form) return;

    const conectado = document.getElementById('canvas-conectado');
    const aviso = document.getElementById('canvas-aviso');
    const selo = document.getElementById('selo-canvas');
    const conta = document.getElementById('canvas-conta');
    const resumo = document.getElementById('canvas-resumo');
    const campoUrl = document.getElementById('campo-canvas-url');
    const inputUrl = document.getElementById('canvas-url');
    const inputToken = document.getElementById('canvas-token');
    const botaoOauth = document.getElementById('botao-oauth-canvas');
    const botaoConectar = document.getElementById('botao-conectar-canvas');
    const botaoSincronizar = document.getElementById('botao-sincronizar-canvas');
    const botaoDesconectar = document.getElementById('botao-desconectar-canvas');

    function mostrarAviso(texto, ok) {
        if (!aviso) return;
        aviso.hidden = !texto;
        aviso.textContent = texto || '';
        aviso.classList.toggle('aviso-ok', Boolean(ok && texto));
        aviso.classList.toggle('aviso-erro', Boolean(texto && !ok));
        aviso.classList.remove('aviso-info');
    }

    function textoResultado(resultado) {
        if (!resultado) return '';
        const disciplinas = resultado.disciplinasNovas + resultado.disciplinasAtualizadas;
        const tarefas = resultado.tarefasNovas + resultado.tarefasAtualizadas;
        return `${disciplinas} disciplina(s) e ${tarefas} atividade(s) do Canvas.`;
    }

    function pintar(conexao) {
        const ligado = Boolean(conexao?.conectado);
        form.hidden = ligado;
        conectado.hidden = !ligado;
        if (selo) selo.textContent = ligado ? 'Conectado' : 'Desconectado';
        if (ligado && conta) {
            conta.textContent = `${conexao.nome || 'Conta Canvas'} · ${conexao.instancia || ''}`.trim();
        }
        if (campoUrl) campoUrl.hidden = Boolean(conexao?.instanciaFixa);
        if (inputUrl && conexao?.instanciaFixa) inputUrl.value = `https://${conexao.instanciaFixa}`;
        if (botaoOauth) botaoOauth.hidden = !conexao?.oauthDisponivel;
    }

    async function carregar() {
        const { conexao } = await AcaiApi.obterCanvas();
        pintar(conexao);
        if (conexao.conectado && resumo && conexao.sincronizadoEm) {
            resumo.textContent = `Última sincronização em ${new Date(conexao.sincronizadoEm).toLocaleString('pt-BR')}.`;
        }
        return conexao;
    }

    form.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        botaoConectar.disabled = true;
        mostrarAviso('Conectando ao Canvas...', true);
        try {
            const resposta = await AcaiApi.conectarCanvas({
                instanciaUrl: inputUrl.value,
                token: inputToken.value,
            });
            inputToken.value = '';
            pintar(resposta.conexao);
            if (resumo) resumo.textContent = textoResultado(resposta.resultado);
            mostrarAviso(resposta.aviso || 'Canvas conectado.', !resposta.aviso);
        } catch (erro) {
            mostrarAviso(erro.message);
        } finally {
            botaoConectar.disabled = false;
        }
    });

    botaoOauth?.addEventListener('click', async () => {
        botaoOauth.disabled = true;
        try {
            const { url } = await AcaiApi.iniciarCanvas();
            window.location.assign(url);
        } catch (erro) {
            mostrarAviso(erro.message);
            botaoOauth.disabled = false;
        }
    });

    botaoSincronizar?.addEventListener('click', async () => {
        botaoSincronizar.disabled = true;
        mostrarAviso('Sincronizando...', true);
        try {
            const resposta = await AcaiApi.sincronizarCanvas();
            pintar(resposta.conexao);
            if (resumo) resumo.textContent = textoResultado(resposta.resultado);
            mostrarAviso('Sincronização concluída.', true);
        } catch (erro) {
            mostrarAviso(erro.message);
        } finally {
            botaoSincronizar.disabled = false;
        }
    });

    botaoDesconectar?.addEventListener('click', async () => {
        const confirmado = await AcaiAvisos.confirmar({
            titulo: 'Desconectar o Canvas',
            texto: 'As disciplinas e atividades já importadas continuam na sua conta. Só o acesso ao Canvas é removido.',
            confirmar: 'Desconectar',
        });
        if (!confirmado) return;
        botaoDesconectar.disabled = true;
        try {
            const { conexao } = await AcaiApi.desconectarCanvas();
            pintar(conexao);
            if (resumo) resumo.textContent = '';
            mostrarAviso('Canvas desconectado. O que já foi importado continua na conta.', true);
        } catch (erro) {
            mostrarAviso(erro.message);
        } finally {
            botaoDesconectar.disabled = false;
        }
    });

    const volta = new URLSearchParams(window.location.search).get('canvas');
    if (volta) {
        const mensagens = {
            conectado: 'Canvas conectado.',
            recusado: 'A autorização no Canvas foi cancelada.',
            falhou: 'Não foi possível concluir a conexão com o Canvas.',
        };
        mostrarAviso(mensagens[volta] || '', volta === 'conectado');
        window.history.replaceState({}, '', window.location.pathname);
    }

    carregar().catch((erro) => mostrarAviso(erro.message));
})();
