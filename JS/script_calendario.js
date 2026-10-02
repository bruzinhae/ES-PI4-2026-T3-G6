const calendario = document.querySelector('.calendario');
const rotinas = document.querySelectorAll('.rotina[draggable="true"]');
const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const datas = ['03 Fev', '04 Fev', '05 Fev', '06 Fev', '07 Fev', '08 Fev', '09 Fev'];
const horaInicial = 6; // horário que começa 
const horaFinal = 23; // horário que termina
const faixasPorHora = 2;
const totalFaixas = (horaFinal - horaInicial) * faixasPorHora;
const eventosIniciais = Array.from(calendario.querySelectorAll('.compromisso')).map((bloco) => {
    const indiceOriginal = Array.from(calendario.children).indexOf(bloco);
    const linhaAntiga = Math.floor(indiceOriginal / 8) + 1;
    const colunaAntiga = indiceOriginal % 8 + 1;
    const horariosPorLinha = { 2: 6, 3: 7, 4: 8, 5: 12, 6: 13, 7: 15, 8: 22 };
    const texto = bloco.textContent;
    const inicioExplicito = texto.match(/(\d{1,2}):(\d{2})\s*[-–]/);
    let hora = inicioExplicito ? Number(inicioExplicito[1]) : horariosPorLinha[linhaAntiga] || 6;
    let minuto = inicioExplicito ? Number(inicioExplicito[2]) : 0;
    if (bloco.classList.contains('evento-sono') && !inicioExplicito) hora = 22;

    const duracaoExplicita = texto.match(/\((\d+)h\)/i);
    let duracaoMinutos = duracaoExplicita ? Number(duracaoExplicita[1]) * 60 : 60;
    if (bloco.classList.contains('evento-sono') || bloco.classList.contains('sono-noturno')) {
        duracaoMinutos = duracaoExplicita ? Number(duracaoExplicita[1]) * 60 : 8 * 60;
    }
    if (inicioExplicito && !duracaoExplicita) {
        const intervalo = texto.match(/\d{1,2}:(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/);
        if (intervalo) {
            const inicio = hora * 60 + minuto;
            let fim = Number(intervalo[2]) * 60 + Number(intervalo[3]);
            if (fim <= inicio) fim += 24 * 60;
            duracaoMinutos = fim - inicio;
        }
    }

    return {
        elemento: bloco,
        indiceDia: Math.max(0, Math.min(6, colunaAntiga - 2)),
        indiceFaixa: Math.max(0, Math.min(totalFaixas - 1, (hora - horaInicial) * faixasPorHora + minuto / 30)),
        duracaoFaixas: Math.max(1, Math.ceil(duracaoMinutos / 30)),
    };
});

let rotinaArrastada = null;
let compromissoArrastado = null;
const quadroModalConcluido = document.querySelector('#quadro-modal-concluido');
let modalConclusaoPronto = false;
let dadosConclusaoPendente = null;
let diaComemorado = null;

function exibirConclusaoPendente() {
    if (!modalConclusaoPronto || !dadosConclusaoPendente) return;
    quadroModalConcluido.contentWindow.postMessage({ tipo: 'abrir-modal-concluido', dados: dadosConclusaoPendente }, '*');
    dadosConclusaoPendente = null;
}

quadroModalConcluido.addEventListener('load', () => {
    modalConclusaoPronto = true;
    exibirConclusaoPendente();
});

function criarCelulaGrade(nomeClasse, texto, linha, coluna) {
    const celula = document.createElement('div');
    celula.className = nomeClasse;
    if (texto) celula.textContent = texto;
    celula.style.gridRow = linha;
    celula.style.gridColumn = coluna;
    calendario.appendChild(celula);
    return celula;
}

function montarCalendario() {
    calendario.replaceChildren();
    criarCelulaGrade('canto', 'HORA', 1, 1);
    dias.forEach((dia, indice) => {
        const cabecalho = criarCelulaGrade(`dia${indice === 3 ? ' selecionado' : ''}`, '', 1, indice + 2);
        cabecalho.innerHTML = `<small>${dia.toUpperCase()}</small><strong>${datas[indice]}</strong>`;
    });

    for (let indiceFaixa = 0; indiceFaixa < totalFaixas; indiceFaixa += 1) {
        const minutosDesdeInicio = indiceFaixa * 30;
        const hora = horaInicial + Math.floor(minutosDesdeInicio / 60);
        const minuto = minutosDesdeInicio % 60;
        const rotulo = `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
        const linha = indiceFaixa + 2;
        criarCelulaGrade('horario', rotulo, linha, 1);
        dias.forEach((_, indiceDia) => {
            const faixa = criarCelulaGrade('faixa-calendario', '', linha, indiceDia + 2);
            faixa.dataset.indiceDia = indiceDia;
            faixa.dataset.indiceFaixa = indiceFaixa;
            faixa.setAttribute('aria-label', `${dias[indiceDia]} às ${rotulo}`);
        });
    }

    eventosIniciais.forEach(({ elemento, indiceDia, indiceFaixa, duracaoFaixas }) => {
        elemento.classList.add('evento-calendario');
        elemento.dataset.indiceDia = indiceDia;
        elemento.dataset.indiceFaixa = indiceFaixa;
        elemento.dataset.duracaoFaixas = duracaoFaixas;
        posicionarCompromisso(elemento, indiceDia, indiceFaixa, duracaoFaixas);
        calendario.appendChild(elemento);
    });
}

function posicionarCompromisso(bloco, indiceDia, indiceFaixa, duracaoFaixas) {
    const linha = indiceFaixa + 2;
    const duracaoVisivel = Math.min(duracaoFaixas, totalFaixas - indiceFaixa);
    bloco.style.gridRow = `${linha} / span ${duracaoVisivel}`;
    bloco.style.gridColumn = indiceDia + 2;
    bloco.dataset.indiceDia = indiceDia;
    bloco.dataset.indiceFaixa = indiceFaixa;
    bloco.dataset.duracaoFaixas = duracaoFaixas;

    const rotuloHorario = bloco.querySelector('.horario-movido');
    if (rotuloHorario) rotuloHorario.textContent = `${dias[indiceDia]} · ${formatarHorario(indiceFaixa)}`;
}

function formatarHorario(indiceFaixa) {
    const minutos = horaInicial * 60 + indiceFaixa * 30;
    return `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;
}

function obterPosicaoDeSoltura(alvo) {
    const faixa = alvo.closest('.faixa-calendario');
    if (faixa) return { indiceDia: Number(faixa.dataset.indiceDia), indiceFaixa: Number(faixa.dataset.indiceFaixa) };

    // Permite soltar sobre outro compromisso e usar a faixa onde ele começa.
    const evento = alvo.closest('.evento-calendario');
    if (evento) return { indiceDia: Number(evento.dataset.indiceDia), indiceFaixa: Number(evento.dataset.indiceFaixa) };
    return null;
}

function ativarArrasteDeRotina(rotina) {
    rotina.draggable = true;
    rotina.addEventListener('dragstart', (evento) => {
        rotinaArrastada = rotina;
        rotina.classList.add('arrastando');
        evento.dataTransfer.effectAllowed = 'copy';
        evento.dataTransfer.setData('text/plain', rotina.dataset.rotina);
    });
    rotina.addEventListener('dragend', () => {
        rotina.classList.remove('arrastando');
        rotinaArrastada = null;
        calendario.classList.remove('pronto-para-soltar');
    });
}

function ativarArrasteDeCompromisso(bloco) {
    if (!bloco.querySelector('.botao-conclusao')) {
        const botaoConclusao = document.createElement('button');
        botaoConclusao.type = 'button';
        botaoConclusao.className = 'botao-conclusao';
        botaoConclusao.setAttribute('aria-pressed', 'false');
        botaoConclusao.setAttribute('aria-label', 'Marcar tarefa como concluída');
        botaoConclusao.textContent = '✓';
        botaoConclusao.addEventListener('pointerdown', (evento) => evento.stopPropagation());
        botaoConclusao.addEventListener('mousedown', (evento) => evento.stopPropagation());
        botaoConclusao.addEventListener('click', (evento) => {
            evento.preventDefault();
            evento.stopPropagation();
            const concluido = bloco.classList.toggle('concluido');
            botaoConclusao.setAttribute('aria-pressed', String(concluido));
            botaoConclusao.setAttribute('aria-label', concluido ? 'Marcar tarefa como não concluída' : 'Marcar tarefa como concluída');
            botaoConclusao.title = concluido ? 'Tarefa concluída' : 'Marcar como concluída';
            verificarMetaDiaria(bloco);
        });
        bloco.appendChild(botaoConclusao);
    }

    bloco.draggable = true;
    bloco.addEventListener('dragstart', (evento) => {
        if (evento.target.closest('.botao-conclusao')) {
            evento.preventDefault();
            return;
        }
        compromissoArrastado = bloco;
        bloco.classList.add('arrastando');
        evento.dataTransfer.effectAllowed = 'move';
        evento.dataTransfer.setData('text/plain', bloco.dataset.rotina || bloco.textContent.trim());
    });
    bloco.addEventListener('dragend', (evento) => {
        bloco.classList.remove('arrastando');
        if (evento.dataTransfer.dropEffect === 'none') bloco.remove();
        compromissoArrastado = null;
        calendario.classList.remove('pronto-para-soltar');
    });
}

function verificarMetaDiaria(blocoAtualizado) {
    const dia = Number(blocoAtualizado.dataset.indiceDia);
    const tarefasDoDia = Array.from(calendario.querySelectorAll('.evento-calendario'))
        .filter((bloco) => Number(bloco.dataset.indiceDia) === dia && !bloco.classList.contains('evento-sono') && !bloco.classList.contains('sono-noturno'));
    if (!tarefasDoDia.length) return;

    const todasConcluidas = tarefasDoDia.every((bloco) => bloco.classList.contains('concluido'));
    if (!todasConcluidas) {
        if (diaComemorado === dia) diaComemorado = null;
        return;
    }
    if (diaComemorado === dia) return;
    diaComemorado = dia;
    const minutosTotais = tarefasDoDia.reduce((total, bloco) => total + (Number(bloco.dataset.duracaoFaixas) || 1) * 30, 0);
    dadosConclusaoPendente = {
        tarefas: tarefasDoDia.length,
        duracao: formatarDuracao(minutosTotais),
        dia: dias[dia],
    };
    exibirConclusaoPendente();
}

function formatarDuracao(minutos) {
    const horas = Math.floor(minutos / 60);
    const resto = minutos % 60;
    if (!horas) return `${resto} min`;
    return resto ? `${horas}h ${resto}min` : `${horas}h`;
}

montarCalendario();
calendario.querySelectorAll('.evento-calendario').forEach(ativarArrasteDeCompromisso);

rotinas.forEach(ativarArrasteDeRotina);

calendario.addEventListener('dragover', (evento) => {
    const posicao = obterPosicaoDeSoltura(evento.target);
    if ((!rotinaArrastada && !compromissoArrastado) || !posicao) return;
    evento.preventDefault();
    evento.dataTransfer.dropEffect = compromissoArrastado ? 'move' : 'copy';
    calendario.classList.add('pronto-para-soltar');
});

calendario.addEventListener('dragleave', (evento) => {
    if (!calendario.contains(evento.relatedTarget)) calendario.classList.remove('pronto-para-soltar');
});

calendario.addEventListener('drop', (evento) => {
    const posicao = obterPosicaoDeSoltura(evento.target);
    if ((!rotinaArrastada && !compromissoArrastado) || !posicao) return;
    evento.preventDefault();
    calendario.classList.remove('pronto-para-soltar');

    if (compromissoArrastado) {
        posicionarCompromisso(compromissoArrastado, posicao.indiceDia, posicao.indiceFaixa, Number(compromissoArrastado.dataset.duracaoFaixas));
        return;
    }

    const bloco = document.createElement('div');
    const corRotina = Array.from(rotinaArrastada.classList).find((nome) => ['roxo', 'azul', 'escuro', 'verde', 'amarelo', 'deslocamento'].includes(nome));
    const duracaoHoras = { Aulas: 2, Trabalho: 4, Sono: 8, Saúde: 1, Pausa: 1, Translado: 1 };
    const duracaoFaixas = Number(rotinaArrastada.dataset.duracaoFaixas) || duracaoHoras[rotinaArrastada.dataset.rotina] * faixasPorHora;
    bloco.className = `evento-adicionado evento-calendario ${corRotina}`;
    bloco.dataset.rotina = rotinaArrastada.dataset.rotina;
    const tituloBloco = document.createElement('span');
    tituloBloco.textContent = `${rotinaArrastada.dataset.icone || '✦'} ${rotinaArrastada.dataset.rotina}`;
    const horarioBloco = document.createElement('small');
    horarioBloco.className = 'horario-movido';
    bloco.append(tituloBloco, horarioBloco);
    posicionarCompromisso(bloco, posicao.indiceDia, posicao.indiceFaixa, duracaoFaixas);
    ativarArrasteDeCompromisso(bloco);
    calendario.appendChild(bloco);
});

function adicionarBlocoPersonalizado(dados) {
    const cartao = document.createElement('div');
    cartao.className = `rotina ${dados.cor}`;
    cartao.dataset.rotina = dados.nome;
    cartao.dataset.icone = dados.icone;
    cartao.dataset.categoria = dados.categoria;
    cartao.dataset.duracaoFaixas = dados.duracaoFaixas;
    cartao.dataset.prioridade = dados.prioridade;
    cartao.dataset.diaPreferido = dados.diaPreferido;
    cartao.dataset.horarioPreferido = dados.horarioPreferido;

    const icone = document.createElement('div');
    icone.className = 'icone-rotina';
    icone.textContent = dados.icone;
    const detalhes = document.createElement('div');
    const titulo = document.createElement('strong');
    titulo.textContent = dados.nome;
    const preferencia = document.createElement('small');
    preferencia.textContent = `Preferência: ${dados.textoDia} · ${dados.horarioPreferido || 'sem horário'}`;
    detalhes.append(titulo, preferencia);
    const duracao = document.createElement('span');
    duracao.textContent = dados.duracaoTexto;
    const etiqueta = document.createElement('label');
    etiqueta.textContent = dados.categoria;
    cartao.append(icone, detalhes, duracao, etiqueta);
    ativarArrasteDeRotina(cartao);

    const botaoCriacao = document.querySelector('#abrir-modal-bloco');
    document.querySelector('.cartao-lateral').insertBefore(cartao, botaoCriacao);
}

window.adicionarBlocoPersonalizado = adicionarBlocoPersonalizado;

const quadroModal = document.querySelector('#quadro-modal');
let modalPronto = false;
let aberturaPendente = false;

document.querySelector('#abrir-modal-bloco').addEventListener('click', () => {
    if (!modalPronto) aberturaPendente = true;
    quadroModal.contentWindow.postMessage({ tipo: 'abrir-modal' }, '*');
});

quadroModal.addEventListener('load', () => {
    if (!aberturaPendente) return;
    aberturaPendente = false;
    quadroModal.contentWindow.postMessage({ tipo: 'abrir-modal' }, '*');
});

window.addEventListener('message', (evento) => {
    if (evento.source === quadroModalConcluido.contentWindow && evento.data) {
        if (evento.data.tipo === 'modal-concluido-pronto') {
            modalConclusaoPronto = true;
            exibirConclusaoPendente();
        }
        if (evento.data.tipo === 'modal-concluido-aberto' || evento.data.tipo === 'modal-concluido-fechado') {
            const aberto = evento.data.tipo === 'modal-concluido-aberto';
            quadroModalConcluido.classList.toggle('ativo', aberto);
            quadroModalConcluido.setAttribute('aria-hidden', String(!aberto));
        }
        if (evento.data.tipo === 'abrir-progresso') {
            quadroModalConcluido.contentWindow.postMessage({ tipo: 'fechar-modal-concluido' }, '*');
        }
        return;
    }
    if (evento.source !== quadroModal.contentWindow || !evento.data) return;

    if (evento.data.tipo === 'modal-pronto') {
        modalPronto = true;
        if (aberturaPendente) {
            aberturaPendente = false;
            quadroModal.contentWindow.postMessage({ tipo: 'abrir-modal' }, '*');
        }
    }

    if (evento.data.tipo === 'modal-aberto') {
        quadroModal.classList.add('ativo');
        quadroModal.setAttribute('aria-hidden', 'false');
    }

    if (evento.data.tipo === 'modal-fechado') {
        quadroModal.classList.remove('ativo');
        quadroModal.setAttribute('aria-hidden', 'true');
        document.querySelector('#abrir-modal-bloco').focus();
    }

    if (evento.data.tipo === 'bloco-salvo') {
        adicionarBlocoPersonalizado(evento.data.dados);
    }
});
