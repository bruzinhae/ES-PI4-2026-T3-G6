/**
 * Onboarding (versão de teste) — uma pergunta por tela.
 * Salva nas mesmas chaves do onboarding atual e marca onboardingConcluido na API.
 */

(function () {
    const CHAVE_ROTINA = 'acaistudy-onboarding-rotina';
    const CHAVE_METAS = 'acaistudy-onboarding-metas';
    const CHAVE_FOCO = 'acaistudy-onboarding-foco';
    const CHAVE_SEMANA = 'acaistudy-onboarding-semana';

    const NOMES_ETAPA = { 1: 'Rotina', 2: 'Metas', 3: 'Foco' };

    const ICONES_POR_TIPO = {
        geral: 'assets/icons/metas/card-bandeira.svg',
        disciplina: 'assets/icons/metas/card-codigo.svg',
        projeto: 'assets/icons/metas/card-tcc.svg',
        habito: 'assets/icons/metas/card-habito.svg',
    };

    const respostas = {
        dias: new Set(),
        periodo: null,
        trabalho: null,
        dormir: '23:00',
        acordar: '07:00',
        metas: [],
        janela: null,
        duracao: null,
    };

    const passos = Array.from(document.querySelectorAll('.passo'));
    const progresso = document.getElementById('progresso');
    const rotuloEtapa = document.getElementById('rotulo-etapa');
    const barraProgresso = document.getElementById('barra-progresso');
    const trilhaProgresso = barraProgresso.parentElement;
    const rodape = document.getElementById('rodape');
    const botaoContinuar = document.getElementById('botao-continuar');

    const botaoVoltar = document.querySelector('[data-acao="voltar"]');
    const modalBoasVindas = document.getElementById('modal-boas-vindas');

    // Perguntas = todos os passos, menos a tela final.
    const totalPerguntas = passos.filter((passo) => passo.dataset.etapa).length;

    let indiceAtual = 0;

    // ----- Validação de cada pergunta -----

    const respondido = {
        aulas: () => respostas.dias.size > 0 && Boolean(respostas.periodo),
        trabalho: () => Boolean(respostas.trabalho),
        sono: () => Boolean(respostas.dormir && respostas.acordar),
        metas: () => respostas.metas.length > 0,
        janela: () => Boolean(respostas.janela),
        duracao: () => Boolean(respostas.duracao),
    };

    function atualizarBotaoContinuar() {
        const passo = passos[indiceAtual].dataset.passo;
        botaoContinuar.disabled = respondido[passo] ? !respondido[passo]() : false;
    }

    // ----- Navegação -----

    function mostrarPasso(indice) {
        passos[indiceAtual].classList.remove('ativo');
        passos[indiceAtual].hidden = true;

        indiceAtual = indice;

        const passo = passos[indiceAtual];
        passo.hidden = false;
        passo.classList.add('ativo');

        const etapa = passo.dataset.etapa;
        const ehPergunta = Boolean(etapa);

        rodape.hidden = !ehPergunta;
        botaoVoltar.hidden = indiceAtual === 0;
        rotuloEtapa.textContent = ehPergunta ? `Etapa ${etapa} de 3 · ${NOMES_ETAPA[etapa]}` : 'Último passo · Sua semana';
        document.querySelector('.pagina').classList.toggle('larga', !ehPergunta);

        const porcentagem = Math.round(((indiceAtual + 1) / (totalPerguntas + 1)) * 100);
        barraProgresso.style.width = `${porcentagem}%`;
        trilhaProgresso.setAttribute('aria-valuenow', String(porcentagem));

        botaoContinuar.innerHTML = passos[indiceAtual + 1]?.dataset.passo === 'final'
            ? 'Montar minha semana <span>→</span>'
            : 'Continuar <span>→</span>';

        atualizarBotaoContinuar();
        window.scrollTo({ top: 0 });

        passo.querySelectorAll('h1').forEach((titulo) => titulo.setAttribute('tabindex', '-1'));
        passo.querySelector('h1')?.focus({ preventScroll: true });

        if (passo.dataset.passo === 'final') {
            finalizar();
        }
    }

    function avancar() {
        if (botaoContinuar.disabled) return;
        if (indiceAtual < passos.length - 1) mostrarPasso(indiceAtual + 1);
    }

    function voltar() {
        if (indiceAtual > 0) mostrarPasso(indiceAtual - 1);
    }

    botaoContinuar.addEventListener('click', avancar);
    botaoVoltar.addEventListener('click', voltar);

    // ----- Modal de boas-vindas (abre ao chegar do login/cadastro) -----

    function irParaGrade() {
        window.location.href = 'index_calendario.html';
    }

    document.getElementById('botao-comecar').addEventListener('click', () => modalBoasVindas.close());
    document.getElementById('fazer-depois').addEventListener('click', irParaGrade);

    // Esc fecha o modal e começa as perguntas, como o botão "Começar".
    modalBoasVindas.addEventListener('close', () => {
        passos[indiceAtual].querySelector('h1')?.focus({ preventScroll: true });
    });

    // ----- Respostas -----

    // Grupo de escolha única (cards com role="radio").
    function ativarEscolhaUnica(grupoId, campo) {
        const grupo = document.getElementById(grupoId);

        grupo.querySelectorAll('.opcao').forEach((opcao) => {
            opcao.addEventListener('click', () => {
                grupo.querySelectorAll('.opcao').forEach((item) => {
                    item.setAttribute('aria-checked', String(item === opcao));
                });

                respostas[campo] = opcao.dataset.valor;
                atualizarBotaoContinuar();
            });
        });
    }

    ativarEscolhaUnica('periodo-aula', 'periodo');
    ativarEscolhaUnica('trabalho', 'trabalho');
    ativarEscolhaUnica('janela-foco', 'janela');
    ativarEscolhaUnica('duracao-foco', 'duracao');

    document.querySelectorAll('#dias-aula .chip').forEach((chip) => {
        chip.addEventListener('click', () => {
            const marcado = chip.getAttribute('aria-pressed') !== 'true';
            chip.setAttribute('aria-pressed', String(marcado));

            if (marcado) {
                respostas.dias.add(chip.dataset.valor);
            } else {
                respostas.dias.delete(chip.dataset.valor);
            }

            atualizarBotaoContinuar();
        });
    });

    document.getElementById('hora-dormir').addEventListener('input', (evento) => {
        respostas.dormir = evento.target.value;
        atualizarBotaoContinuar();
    });

    document.getElementById('hora-acordar').addEventListener('input', (evento) => {
        respostas.acordar = evento.target.value;
        atualizarBotaoContinuar();
    });

    // ----- Metas -----

    function dataPadrao() {
        const data = new Date();
        data.setDate(data.getDate() + 30);
        return data.toISOString().slice(0, 10);
    }

    function alternarMeta(botao) {
        const marcado = botao.getAttribute('aria-pressed') !== 'true';
        botao.setAttribute('aria-pressed', String(marcado));

        if (marcado) {
            respostas.metas.push({
                id: crypto.randomUUID(),
                titulo: botao.dataset.titulo,
                tipo: botao.dataset.tipo,
                prioridade: botao.dataset.prioridade,
                prazo: botao.dataset.prazo,
                cor: botao.dataset.cor,
                icone: botao.dataset.icone,
            });
        } else {
            respostas.metas = respostas.metas.filter((meta) => meta.titulo !== botao.dataset.titulo);
        }

        atualizarBotaoContinuar();
    }

    document.querySelectorAll('#sugestoes-metas .meta-sugerida').forEach((botao) => {
        botao.addEventListener('click', () => alternarMeta(botao));
    });

    const formularioMeta = document.getElementById('formulario-meta');
    const campoMeta = document.getElementById('titulo-meta');
    const metasProprias = document.getElementById('metas-proprias');
    const abrirMetaPropria = document.getElementById('abrir-meta-propria');

    abrirMetaPropria.addEventListener('click', () => {
        formularioMeta.hidden = false;
        abrirMetaPropria.hidden = true;
        campoMeta.focus();
    });

    formularioMeta.addEventListener('submit', (evento) => {
        evento.preventDefault();

        const titulo = campoMeta.value.trim();
        if (!titulo) return;

        const botao = document.createElement('button');
        botao.type = 'button';
        botao.className = 'meta-sugerida';
        botao.setAttribute('aria-pressed', 'false');
        Object.assign(botao.dataset, {
            titulo,
            tipo: 'geral',
            prioridade: 'media',
            prazo: dataPadrao(),
            cor: 'roxo',
            icone: ICONES_POR_TIPO.geral,
        });

        const icone = document.createElement('span');
        icone.className = 'icone-meta roxo';
        icone.innerHTML = `<img src="${ICONES_POR_TIPO.geral}" alt="" width="16" height="16">`;

        const texto = document.createElement('strong');
        texto.textContent = titulo;

        const marcador = document.createElement('span');
        marcador.className = 'marcador';
        marcador.setAttribute('aria-hidden', 'true');
        marcador.textContent = '✓';

        botao.append(icone, texto, marcador);
        botao.addEventListener('click', () => alternarMeta(botao));
        metasProprias.appendChild(botao);

        alternarMeta(botao);

        campoMeta.value = '';
        campoMeta.focus();
    });

    // ----- Final -----

    function salvarRespostas() {
        try {
            localStorage.setItem(CHAVE_ROTINA, JSON.stringify({
                diasAula: Array.from(respostas.dias),
                periodoAula: respostas.periodo,
                trabalho: respostas.trabalho,
                dormir: respostas.dormir,
                acordar: respostas.acordar,
            }));

            localStorage.setItem(CHAVE_METAS, JSON.stringify(respostas.metas));

            // Proteções avançadas ficam ligadas por padrão; o usuário ajusta em Configurações.
            localStorage.setItem(CHAVE_FOCO, JSON.stringify({
                janela: respostas.janela,
                duracao: respostas.duracao,
                antifadiga: true,
                repeticao: true,
                dinamico: true,
                rigidez: 'equilibrado',
            }));
        } catch {
            // sem localStorage (modo privado): segue sem guardar
        }
    }

    function finalizar() {
        salvarRespostas();

        const carregando = document.getElementById('carregando');
        const semana = document.getElementById('semana');

        carregando.hidden = false;
        semana.hidden = true;

        GradeOnboarding.montar(respostas, document.getElementById('grade-semana'));
        document.getElementById('nota-sono').textContent = `🌙 Sono: ${respostas.dormir} às ${respostas.acordar}`;

        window.setTimeout(() => {
            carregando.hidden = true;
            semana.hidden = false;
            semana.querySelector('h1').focus({ preventScroll: true });
        }, 1600);
    }

    document.getElementById('reorganizar').addEventListener('click', () => GradeOnboarding.reorganizar());
    document.getElementById('voltar-grade').addEventListener('click', voltar);

    document.getElementById('botao-concluir').addEventListener('click', async (evento) => {
        const botao = evento.currentTarget;

        try {
            localStorage.setItem(CHAVE_SEMANA, JSON.stringify(GradeOnboarding.obterSemana()));
            localStorage.setItem('acaistudy-onboarding-completo', '1');
        } catch {
            // sem localStorage (modo privado): segue sem guardar
        }

        // Marca no banco que o onboarding foi concluído; a partir daí o usuário vai direto para a grade.
        if (AcaiApi.temUsuarioAtual()) {
            botao.disabled = true;

            try {
                await AcaiApi.atualizarUsuarioAtual({ onboardingConcluido: true });
            } catch (erro) {
                alert(`Não foi possível concluir o onboarding: ${erro.message}`);
                return;
            } finally {
                botao.disabled = false;
            }
        }

        window.location.href = 'index_calendario.html';
    });

    document.getElementById('pular-onboarding').addEventListener('click', irParaGrade);

    // Enter avança quando a pergunta já foi respondida (exceto dentro do campo de meta).
    document.addEventListener('keydown', (evento) => {
        if (evento.key !== 'Enter' || modalBoasVindas.open || evento.target.closest('form, button')) return;
        if (passos[indiceAtual].dataset.etapa) avancar();
    });

    mostrarPasso(0);
    modalBoasVindas.showModal();
})();
