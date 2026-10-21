/**
 * Grade semanal do onboarding (versão de teste).
 * A Sofia monta a semana a partir das respostas; aulas e trabalho ficam fixos
 * e os blocos de estudo podem ser arrastados (ou movidos com as setas).
 */

const GradeOnboarding = (function () {
    const SLOT = 30; // minutos por linha da grade
    const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    const INDICE_DIA = { seg: 0, ter: 1, qua: 2, qui: 3, sex: 4, sab: 5, dom: 6 };

    const PERIODOS_AULA = {
        manha: [450, 720],   // 07:30 – 12:00
        tarde: [810, 1080],  // 13:30 – 18:00
        noite: [1140, 1350], // 19:00 – 22:30
    };

    const JANELAS_FOCO = {
        manha: [510, 720],   // 08:30 – 12:00
        tarde: [840, 1080],  // 14:00 – 18:00
        noite: [1140, 1350], // 19:00 – 22:30
    };

    // Horários tentados em ordem até achar um que não bata com as aulas.
    const HORARIOS_TRABALHO = {
        meio: [[780, 1080], [480, 750], [1080, 1320]],
        integral: [[480, 1020], [780, 1080], [480, 750]],
    };

    const DURACAO_BLOCO = { 25: 30, 50: 60, 90: 90 };
    const ORDEM_DIAS_ESTUDO = [0, 2, 4, 1, 3, 5, 6];
    const MAX_ESTUDOS_POR_DIA = 2;

    let blocos = [];
    let inicioGrade = 420;
    let fimGrade = 1380;
    let respostasAtuais = null;
    let container = null;

    // ----- Horários -----

    function paraMinutos(hora) {
        const [h, m] = hora.split(':').map(Number);
        return h * 60 + m;
    }

    function formatarHora(minutos) {
        const h = String(Math.floor(minutos / 60)).padStart(2, '0');
        const m = String(minutos % 60).padStart(2, '0');
        return `${h}:${m}`;
    }

    function definirIntervalo(acordar, dormir) {
        inicioGrade = Math.floor(paraMinutos(acordar) / 60) * 60;
        fimGrade = Math.ceil(paraMinutos(dormir) / 60) * 60;

        // Dormir depois da meia-noite (ou mesmo horário): a grade vai até 24:00.
        if (fimGrade <= inicioGrade) fimGrade = 1440;
        fimGrade = Math.min(Math.max(fimGrade, inicioGrade + 480), 1440);
    }

    // ----- Montagem automática -----

    function sobrepoe(a, b) {
        return a.dia === b.dia && a.inicio < b.fim && b.inicio < a.fim;
    }

    function cabe(candidato, ignorar) {
        if (candidato.inicio < inicioGrade || candidato.fim > fimGrade) return false;
        return !blocos.some((bloco) => bloco !== ignorar && sobrepoe(bloco, candidato));
    }

    function adicionarFixos(respostas) {
        const [inicioAula, fimAula] = PERIODOS_AULA[respostas.periodo];

        respostas.dias.forEach((dia) => {
            const candidato = { dia: INDICE_DIA[dia], inicio: inicioAula, fim: fimAula };
            if (cabe(candidato)) blocos.push({ ...candidato, tipo: 'aula', titulo: 'Aula', fixo: true });
        });

        const opcoesTrabalho = HORARIOS_TRABALHO[respostas.trabalho];
        if (!opcoesTrabalho) return;

        for (let dia = 0; dia < 5; dia += 1) {
            const horario = opcoesTrabalho
                .map(([inicio, fim]) => ({ dia, inicio, fim }))
                .find((candidato) => cabe(candidato));

            if (horario) blocos.push({ ...horario, tipo: 'trabalho', titulo: 'Trabalho', fixo: true });
        }
    }

    function procurarHorario(dia, duracao, [inicioJanela, fimJanela]) {
        const tentativas = [
            [Math.max(inicioJanela, inicioGrade), Math.min(fimJanela, fimGrade)],
            [inicioGrade, fimGrade],
        ];

        for (const [de, ate] of tentativas) {
            for (let inicio = de; inicio + duracao <= ate; inicio += SLOT) {
                const candidato = { dia, inicio, fim: inicio + duracao };
                if (cabe(candidato)) return candidato;
            }
        }

        return null;
    }

    function adicionarEstudos(respostas) {
        const duracao = DURACAO_BLOCO[respostas.duracao] || 60;
        const janela = JANELAS_FOCO[respostas.janela] || JANELAS_FOCO.tarde;
        const total = Math.min(respostas.metas.length * 2, 8);
        const estudosPorDia = new Array(7).fill(0);

        let proximoDia = 0;

        for (let i = 0; i < total; i += 1) {
            const meta = respostas.metas[i % respostas.metas.length];

            for (let tentativa = 0; tentativa < ORDEM_DIAS_ESTUDO.length; tentativa += 1) {
                const dia = ORDEM_DIAS_ESTUDO[(proximoDia + tentativa) % ORDEM_DIAS_ESTUDO.length];
                if (estudosPorDia[dia] >= MAX_ESTUDOS_POR_DIA) continue;

                const horario = procurarHorario(dia, duracao, janela);
                if (!horario) continue;

                blocos.push({ ...horario, tipo: 'estudo', titulo: meta.titulo, cor: meta.cor || 'roxo', fixo: false });
                estudosPorDia[dia] += 1;
                proximoDia = (proximoDia + tentativa + 1) % ORDEM_DIAS_ESTUDO.length;
                break;
            }
        }
    }

    // ----- Desenho -----

    function linhaDaGrade(minutos) {
        return (minutos - inicioGrade) / SLOT + 2; // linha 1 = cabeçalho dos dias
    }

    function posicionar(elemento, bloco) {
        elemento.style.gridColumn = String(bloco.dia + 2);
        elemento.style.gridRow = `${linhaDaGrade(bloco.inicio)} / ${linhaDaGrade(bloco.fim)}`;
    }

    function descrever(bloco) {
        return `${bloco.titulo}, ${DIAS[bloco.dia]} ${formatarHora(bloco.inicio)} às ${formatarHora(bloco.fim)}`;
    }

    function criarBloco(bloco) {
        const elemento = document.createElement(bloco.fixo ? 'div' : 'button');
        elemento.className = `bloco-grade ${bloco.tipo} ${bloco.fixo ? '' : bloco.cor}`.trim();

        const titulo = document.createElement('strong');
        titulo.textContent = bloco.titulo;

        const horario = document.createElement('span');
        horario.textContent = `${formatarHora(bloco.inicio)} – ${formatarHora(bloco.fim)}`;

        elemento.append(titulo, horario);
        posicionar(elemento, bloco);

        if (bloco.fixo) {
            elemento.title = `${descrever(bloco)} (fixo)`;
        } else {
            elemento.type = 'button';
            elemento.setAttribute('aria-label', `${descrever(bloco)}. Arraste ou use as setas para mover.`);
            ativarArraste(elemento, bloco);
            ativarTeclado(elemento, bloco);
        }

        bloco.elemento = elemento;
        return elemento;
    }

    function atualizarBloco(bloco) {
        posicionar(bloco.elemento, bloco);
        bloco.elemento.querySelector('span').textContent = `${formatarHora(bloco.inicio)} – ${formatarHora(bloco.fim)}`;
        bloco.elemento.setAttribute('aria-label', `${descrever(bloco)}. Arraste ou use as setas para mover.`);
    }

    function desenhar() {
        const totalLinhas = (fimGrade - inicioGrade) / SLOT;

        container.replaceChildren();
        container.style.gridTemplateRows = `36px repeat(${totalLinhas}, var(--altura-slot))`;

        DIAS.forEach((nome, indice) => {
            const cabecalho = document.createElement('div');
            cabecalho.className = 'cabecalho-dia';
            cabecalho.textContent = nome;
            cabecalho.style.gridColumn = String(indice + 2);

            const coluna = document.createElement('div');
            coluna.className = 'coluna-dia';
            coluna.style.gridColumn = String(indice + 2);
            coluna.style.gridRow = `2 / ${totalLinhas + 2}`;

            container.append(cabecalho, coluna);
        });

        for (let minutos = inicioGrade; minutos < fimGrade; minutos += 60) {
            const hora = document.createElement('div');
            hora.className = 'hora-grade';
            hora.textContent = formatarHora(minutos);
            hora.style.gridRow = `${linhaDaGrade(minutos)} / span 2`;
            container.appendChild(hora);
        }

        blocos.forEach((bloco) => container.appendChild(criarBloco(bloco)));
    }

    // ----- Arrastar -----

    function ativarArraste(elemento, bloco) {
        elemento.addEventListener('pointerdown', (evento) => {
            if (evento.button !== 0) return;
            evento.preventDefault();

            const colunas = container.querySelectorAll('.coluna-dia');
            const primeira = colunas[0].getBoundingClientRect();
            const larguraDia = primeira.width;
            const alturaSlot = primeira.height / ((fimGrade - inicioGrade) / SLOT);
            const duracao = bloco.fim - bloco.inicio;
            const original = { dia: bloco.dia, inicio: bloco.inicio, fim: bloco.fim };

            // Distância (em slots) entre o ponto clicado e o topo do bloco.
            const deslocamento = Math.floor((evento.clientY - elemento.getBoundingClientRect().top) / alturaSlot);

            elemento.setPointerCapture(evento.pointerId);
            elemento.classList.add('arrastando');

            function mover(eventoMover) {
                const topo = colunas[0].getBoundingClientRect().top;
                const esquerda = colunas[0].getBoundingClientRect().left;

                const dia = Math.min(Math.max(Math.floor((eventoMover.clientX - esquerda) / larguraDia), 0), 6);
                const slot = Math.round((eventoMover.clientY - topo) / alturaSlot) - deslocamento;
                const maxInicio = fimGrade - duracao;
                const inicio = Math.min(Math.max(inicioGrade + slot * SLOT, inicioGrade), maxInicio);

                Object.assign(bloco, { dia, inicio, fim: inicio + duracao });
                atualizarBloco(bloco);
                elemento.classList.toggle('conflito', !cabe(bloco, bloco));
            }

            function soltar() {
                elemento.removeEventListener('pointermove', mover);
                elemento.classList.remove('arrastando');

                // Soltou em cima de outro bloco: volta para onde estava.
                if (!cabe(bloco, bloco)) {
                    Object.assign(bloco, original);
                    atualizarBloco(bloco);
                }

                elemento.classList.remove('conflito');
            }

            elemento.addEventListener('pointermove', mover);
            elemento.addEventListener('pointerup', soltar, { once: true });
            elemento.addEventListener('pointercancel', soltar, { once: true });
        });
    }

    function ativarTeclado(elemento, bloco) {
        const movimentos = {
            ArrowUp: { dia: 0, minutos: -SLOT },
            ArrowDown: { dia: 0, minutos: SLOT },
            ArrowLeft: { dia: -1, minutos: 0 },
            ArrowRight: { dia: 1, minutos: 0 },
        };

        elemento.addEventListener('keydown', (evento) => {
            const movimento = movimentos[evento.key];
            if (!movimento) return;

            evento.preventDefault();

            const candidato = {
                dia: bloco.dia + movimento.dia,
                inicio: bloco.inicio + movimento.minutos,
                fim: bloco.fim + movimento.minutos,
            };

            if (candidato.dia < 0 || candidato.dia > 6 || !cabe(candidato, bloco)) return;

            Object.assign(bloco, candidato);
            atualizarBloco(bloco);
        });
    }

    // ----- API pública -----

    function montar(respostas, elemento) {
        respostasAtuais = respostas;
        container = elemento;
        blocos = [];

        definirIntervalo(respostas.acordar, respostas.dormir);
        adicionarFixos(respostas);
        adicionarEstudos(respostas);
        desenhar();
    }

    function reorganizar() {
        if (respostasAtuais) montar(respostasAtuais, container);
    }

    function obterSemana() {
        return blocos.map(({ dia, inicio, fim, tipo, titulo, cor, fixo }) => ({
            dia: DIAS[dia],
            inicio: formatarHora(inicio),
            fim: formatarHora(fim),
            tipo,
            titulo,
            cor,
            fixo,
        }));
    }

    return { montar, reorganizar, obterSemana };
})();

window.GradeOnboarding = GradeOnboarding;
