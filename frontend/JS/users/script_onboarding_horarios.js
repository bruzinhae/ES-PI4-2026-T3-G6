inicializarMenusOnboarding();
marcarPassoOnboarding('horarios');

const calendario = document.querySelector('.calendario');
const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const horaInicial = 6;
const horaFinal = 23;
const faixasPorHora = 2;
const totalFaixas = (horaFinal - horaInicial) * faixasPorHora;
const totalMinutosSemana = 7 * 24 * 60;

const CLASSE = {
    aulas: 'roxo',
    trabalho: 'azul',
    sono: 'escuro',
    saude: 'verde',
    pausa: 'amarelo',
    translado: 'deslocamento',
    outro: 'roxo',
};

const ICONE = {
    aulas: '🎓',
    trabalho: '💼',
    sono: '🌙',
    saude: '↗',
    pausa: '🍴',
    translado: '🚗',
    outro: '✦',
};

const PRESETS = {
    Aulas: { categoria: 'aulas', minutos: 120, prioridade: 9, fixo: true },
    Trabalho: { categoria: 'trabalho', minutos: 240, prioridade: 8, fixo: true },
    Sono: { categoria: 'sono', minutos: 480, prioridade: 10, fixo: true },
    Saúde: { categoria: 'saude', minutos: 60, prioridade: 4, fixo: false },
    Pausa: { categoria: 'pausa', minutos: 60, prioridade: 5, fixo: false },
    Translado: { categoria: 'translado', minutos: 60, prioridade: 6, fixo: true },
};

const rotinas = document.querySelectorAll('.rotina[draggable="true"]');
const selectDisciplina = document.getElementById('disciplina-aula');

const cache = new Map();
let disciplinas = [];
let metaHoras = 10;
let rotinaArrastada = null;
let compromissoArrastado = null;
let soltoNaGrade = false;

function idDo(bloco) {
    return String(bloco._id || bloco.id);
}

function inicioDaSemana(data = new Date()) {
    const inicio = new Date(data.getFullYear(), data.getMonth(), data.getDate());
    inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7));
    return inicio;
}

function datasDaSemana() {
    const inicio = inicioDaSemana();
    return dias.map((_, indice) => {
        const data = new Date(inicio);
        data.setDate(inicio.getDate() + indice);
        return data;
    });
}

function formatarHorario(indiceFaixa) {
    const minutos = horaInicial * 60 + indiceFaixa * 30;
    return `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;
}

function minutosDe(hora) {
    const [horas, minutos] = String(hora || '00:00').split(':').map(Number);
    return horas * 60 + minutos;
}

function duracaoQueCabe(horaInicio, desejada) {
    const restante = 24 * 60 - minutosDe(horaInicio);
    const cabivel = Math.floor(restante / 30) * 30;
    return Math.max(30, Math.min(desejada, cabivel));
}

function indiceFaixaDe(horaInicio) {
    const minutos = minutosDe(horaInicio);
    const inicioGrade = horaInicial * 60;
    const fimGrade = horaFinal * 60;
    if (minutos < inicioGrade || minutos >= fimGrade) return null;
    return Math.floor((minutos - inicioGrade) / 30);
}

function criarCelula(nomeClasse, texto, linha, coluna) {
    const celula = document.createElement('div');
    celula.className = nomeClasse;
    if (texto) celula.textContent = texto;
    celula.style.gridRow = String(linha);
    celula.style.gridColumn = String(coluna);
    calendario.appendChild(celula);
    return celula;
}

function montarGrade() {
    const datas = datasDaSemana();
    const hoje = new Date();
    const chaveHoje = `${hoje.getFullYear()}-${hoje.getMonth()}-${hoje.getDate()}`;

    calendario.replaceChildren();
    criarCelula('canto', 'HORA', 1, 1);

    datas.forEach((data, indice) => {
        const chave = `${data.getFullYear()}-${data.getMonth()}-${data.getDate()}`;
        const cabecalho = criarCelula(`dia${chave === chaveHoje ? ' selecionado' : ''}`, '', 1, indice + 2);
        const rotulo = document.createElement('small');
        rotulo.textContent = dias[indice].toUpperCase();
        const numero = document.createElement('strong');
        numero.textContent = `${String(data.getDate()).padStart(2, '0')} ${meses[data.getMonth()]}`;
        cabecalho.append(rotulo, numero);
    });

    for (let indiceFaixa = 0; indiceFaixa < totalFaixas; indiceFaixa += 1) {
        const linha = indiceFaixa + 2;
        criarCelula('horario', formatarHorario(indiceFaixa), linha, 1);
        dias.forEach((dia, indiceDia) => {
            const faixa = criarCelula('faixa-calendario', '', linha, indiceDia + 2);
            faixa.dataset.indiceDia = String(indiceDia);
            faixa.dataset.indiceFaixa = String(indiceFaixa);
            faixa.setAttribute('aria-label', `${dia} às ${formatarHorario(indiceFaixa)}`);
        });
    }

    const inicio = datas[0];
    const fim = datas[6];
    const intervalo = document.getElementById('intervalo-semana');
    if (intervalo) {
        intervalo.textContent = `${inicio.getDate()} ${meses[inicio.getMonth()]} – ${fim.getDate()} ${meses[fim.getMonth()]}`;
    }
}

function posicionar(bloco, indiceDia, indiceFaixa, duracaoFaixas) {
    const duracaoVisivel = Math.min(duracaoFaixas, totalFaixas - indiceFaixa);
    bloco.style.gridRow = `${indiceFaixa + 2} / span ${duracaoVisivel}`;
    bloco.style.gridColumn = String(indiceDia + 2);
    bloco.dataset.indiceDia = String(indiceDia);
    bloco.dataset.indiceFaixa = String(indiceFaixa);
    bloco.dataset.duracaoFaixas = String(duracaoFaixas);
    bloco.dataset.dia = String(indiceDia);

    const rotulo = bloco.querySelector('.horario-movido');
    if (rotulo) {
        const inicio = formatarHorario(indiceFaixa);
        const fimMinutos = horaInicial * 60 + (indiceFaixa + duracaoVisivel) * 30;
        const fim = `${String(Math.floor(fimMinutos / 60)).padStart(2, '0')}:${String(fimMinutos % 60).padStart(2, '0')}`;
        rotulo.textContent = `${dias[indiceDia]} · ${inicio}–${fim}`;
    }
}

function obterPosicao(alvo) {
    const faixa = alvo.closest('.faixa-calendario');
    if (faixa) {
        return { indiceDia: Number(faixa.dataset.indiceDia), indiceFaixa: Number(faixa.dataset.indiceFaixa) };
    }

    const eventoEl = alvo.closest('.evento-calendario');
    if (eventoEl) {
        return { indiceDia: Number(eventoEl.dataset.indiceDia), indiceFaixa: Number(eventoEl.dataset.indiceFaixa) };
    }

    return null;
}

function ativarArrasteDeRotina(rotina) {
    rotina.draggable = true;
    rotina.addEventListener('dragstart', (evento) => {
        rotinaArrastada = rotina;
        compromissoArrastado = null;
        rotina.classList.add('arrastando');
        evento.dataTransfer.effectAllowed = 'copy';
        evento.dataTransfer.setData('text/plain', rotina.dataset.rotina || '');
    });
    rotina.addEventListener('dragend', () => {
        rotina.classList.remove('arrastando');
        rotinaArrastada = null;
        calendario.classList.remove('pronto-para-soltar');
    });
}

function ativarArrasteDeCompromisso(bloco) {
    bloco.draggable = true;
    bloco.addEventListener('dragstart', (evento) => {
        compromissoArrastado = bloco;
        rotinaArrastada = null;
        soltoNaGrade = false;
        bloco.classList.add('arrastando');
        evento.dataTransfer.effectAllowed = 'move';
        evento.dataTransfer.setData('text/plain', bloco.dataset.id || '');
    });
    bloco.addEventListener('dragend', () => {
        bloco.classList.remove('arrastando');
        calendario.classList.remove('pronto-para-soltar');
        if (!soltoNaGrade && compromissoArrastado === bloco) {
            removerOcorrencia(bloco);
        }
        compromissoArrastado = null;
    });
}

function desenharBloco(bloco, dia) {
    const faixa = indiceFaixaDe(bloco.horaInicio);
    if (faixa === null) return;

    const elemento = document.createElement('div');
    elemento.className = `evento-adicionado evento-calendario ${CLASSE[bloco.categoria] || 'roxo'}`;
    elemento.dataset.id = bloco.id;
    elemento.dataset.duracaoMinutos = String(bloco.duracaoMinutos);

    const titulo = document.createElement('span');
    titulo.textContent = `${ICONE[bloco.categoria] || '✦'} ${bloco.nome}`;
    const horario = document.createElement('small');
    horario.className = 'horario-movido';
    elemento.append(titulo, horario);

    const faixas = Math.max(1, Math.ceil(bloco.duracaoMinutos / 30));
    posicionar(elemento, dia, faixa, faixas);
    ativarArrasteDeCompromisso(elemento);
    calendario.appendChild(elemento);
}

function desenharTodos() {
    calendario.querySelectorAll('.evento-calendario').forEach((elemento) => elemento.remove());
    cache.forEach((bloco) => {
        if (bloco.recorrencia !== 'semanal') return;
        (bloco.diasSemana || []).forEach((dia) => desenharBloco(bloco, dia));
    });
    atualizarResumo();
}

function normalizar(bloco) {
    return {
        id: idDo(bloco),
        nome: bloco.nome,
        categoria: bloco.categoria,
        recorrencia: bloco.recorrencia,
        diasSemana: [...(bloco.diasSemana || [])].map(Number),
        horaInicio: bloco.horaInicio,
        duracaoMinutos: Number(bloco.duracaoMinutos),
        prioridade: Number(bloco.prioridade),
        fixo: Boolean(bloco.fixo),
        disciplinaId: bloco.disciplinaId ? String(bloco.disciplinaId) : null,
        local: bloco.local || null,
    };
}

function horasDe(minutos) {
    const horas = minutos / 60;
    return Number.isInteger(horas) ? String(horas) : horas.toFixed(1).replace('.', ',');
}

function atualizarResumo() {
    const porCategoria = { aulas: 0, trabalho: 0, sono: 0, saude: 0, pausa: 0, translado: 0, outro: 0 };
    let foraDaGrade = 0;

    cache.forEach((bloco) => {
        if (bloco.recorrencia !== 'semanal') return;
        const minutos = bloco.duracaoMinutos * (bloco.diasSemana?.length || 0);
        porCategoria[bloco.categoria] = (porCategoria[bloco.categoria] || 0) + minutos;
        if (indiceFaixaDe(bloco.horaInicio) === null) foraDaGrade += minutos;
    });

    const ocupado = Object.values(porCategoria).reduce((soma, valor) => soma + valor, 0);
    const livre = Math.max(0, totalMinutosSemana - ocupado);
    const total = Math.max(totalMinutosSemana, ocupado);

    const faixas = {
        sono: porCategoria.sono,
        aula: porCategoria.aulas,
        trabalho: porCategoria.trabalho,
        saude: porCategoria.saude,
        refeicao: porCategoria.pausa + porCategoria.translado + porCategoria.outro,
        estudo: livre,
    };

    Object.entries(faixas).forEach(([chave, minutos]) => {
        const faixa = document.getElementById(`faixa-${chave}`);
        if (faixa) faixa.style.width = `${(minutos / total) * 100}%`;
    });

    const legenda = document.getElementById('legenda-distribuicao');
    if (legenda) {
        const itens = [
            ['ponto-sono', 'Sono', porCategoria.sono],
            ['ponto-aula', 'Aulas', porCategoria.aulas],
            ['ponto-trabalho', 'Trabalho', porCategoria.trabalho],
            ['ponto-estudo', 'Livre', livre],
        ];
        legenda.replaceChildren();
        itens.forEach(([ponto, rotulo, minutos]) => {
            const item = document.createElement('div');
            const marca = document.createElement('span');
            marca.className = `ponto ${ponto}`;
            item.append(marca, document.createTextNode(` ${rotulo}: ${horasDe(minutos)}h`));
            legenda.appendChild(item);
        });
    }

    const legendaRodape = document.getElementById('legenda-rodape');
    if (legendaRodape) {
        legendaRodape.replaceChildren();
        [
            ['ponto-roxo', 'Aulas', porCategoria.aulas],
            ['ponto-azul', 'Trabalho', porCategoria.trabalho],
            ['ponto-verde', 'Saúde', porCategoria.saude],
            ['ponto-escuro', 'Sono', porCategoria.sono],
        ].forEach(([ponto, rotulo, minutos]) => {
            const item = document.createElement('span');
            const marca = document.createElement('i');
            marca.className = ponto;
            item.append(marca, document.createTextNode(` ${rotulo} (${horasDe(minutos)}h)`));
            legendaRodape.appendChild(item);
        });
    }

    const fixas = document.getElementById('horas-fixas');
    const livres = document.getElementById('horas-livres');
    if (fixas) fixas.textContent = `● ${horasDe(ocupado)}h bloqueadas`;
    if (livres) livres.textContent = `• ${horasDe(livre)}h livres · meta de estudo ${metaHoras}h`;

    const estado = document.getElementById('estado-rodape');
    if (!estado) return;

    if (cache.size === 0) {
        estado.innerHTML = 'ⓘ <strong>Passo 2 de 4</strong> • Nenhum horário bloqueado ainda';
        return;
    }

    const avisoFora = foraDaGrade > 0 ? ` · ${horasDe(foraDaGrade)}h fora da grade` : '';
    estado.innerHTML = `ⓘ <strong>Passo 2 de 4 em andamento</strong> • ${horasDe(ocupado)}h bloqueadas · meta de ${metaHoras}h${avisoFora}`;
}

function disciplinaSelecionada() {
    const id = selectDisciplina?.value;
    return disciplinas.find((item) => item.id === id) || null;
}

function dadosDoArraste(rotina) {
    const preset = PRESETS[rotina.dataset.rotina];
    if (preset) {
        return {
            nome: rotina.dataset.rotina,
            categoria: preset.categoria,
            duracaoMinutos: preset.minutos,
            prioridade: preset.prioridade,
            fixo: preset.fixo,
        };
    }

    return {
        nome: rotina.dataset.rotina,
        categoria: rotina.dataset.categoria || 'outro',
        duracaoMinutos: (Number(rotina.dataset.duracaoFaixas) || 4) * 30,
        prioridade: Number(rotina.dataset.prioridade) || 5,
        fixo: Number(rotina.dataset.prioridade) >= 7,
    };
}

async function criarNaGrade(rotina, posicao) {
    const base = dadosDoArraste(rotina);
    let horaInicio = formatarHorario(posicao.indiceFaixa);
    let duracao = duracaoQueCabe(horaInicio, base.duracaoMinutos);

    if (duracao < base.duracaoMinutos) {
        AcaiAvisos.mostrar('O bloco foi encurtado para não passar da meia-noite. Ajuste o restante depois, em Disciplinas.');
    }

    const payload = {
        nome: base.nome,
        categoria: base.categoria,
        recorrencia: 'semanal',
        diasSemana: [posicao.indiceDia],
        horaInicio,
        duracaoMinutos: duracao,
        prioridade: base.prioridade,
        fixo: base.fixo,
    };

    if (base.categoria === 'aulas') {
        const disciplina = disciplinaSelecionada();
        if (disciplina) {
            payload.nome = `Aula de ${disciplina.nome}`.slice(0, 200);
            payload.disciplinaId = disciplina.id;
        } else if (disciplinas.length === 0) {
            AcaiAvisos.mostrar('Cadastre as disciplinas no passo anterior para ligar a aula a uma matéria.');
        }
    }

    const criado = normalizar(await AcaiApi.criarBlocoFixo(payload));
    cache.set(criado.id, criado);
    desenharTodos();
}

async function moverOcorrencia(elemento, posicao) {
    const id = elemento.dataset.id;
    const diaAntigo = Number(elemento.dataset.dia);
    const bloco = cache.get(id);
    if (!bloco) return;

    const horaInicio = formatarHorario(posicao.indiceFaixa);
    const duracao = duracaoQueCabe(horaInicio, Number(elemento.dataset.duracaoMinutos) || bloco.duracaoMinutos);
    const diaNovo = posicao.indiceDia;

    elemento.dataset.duracaoMinutos = String(duracao);
    posicionar(
        elemento,
        diaNovo,
        posicao.indiceFaixa,
        Math.max(1, Math.ceil(duracao / 30))
    );

    try {
        if ((bloco.diasSemana || []).length <= 1) {
            const atualizado = normalizar(await AcaiApi.atualizarBlocoFixo(id, {
                diasSemana: [diaNovo],
                horaInicio,
                duracaoMinutos: duracao,
            }));
            cache.set(id, atualizado);
        } else {
            const restantes = bloco.diasSemana.filter((dia) => dia !== diaAntigo);
            const atualizado = normalizar(await AcaiApi.atualizarBlocoFixo(id, { diasSemana: restantes }));
            cache.set(id, atualizado);
            const criado = normalizar(await AcaiApi.criarBlocoFixo({
                nome: bloco.nome,
                categoria: bloco.categoria,
                recorrencia: 'semanal',
                diasSemana: [diaNovo],
                horaInicio,
                duracaoMinutos: duracao,
                prioridade: bloco.prioridade,
                fixo: bloco.fixo,
                ...(bloco.disciplinaId ? { disciplinaId: bloco.disciplinaId } : {}),
                ...(bloco.local ? { local: bloco.local } : {}),
            }));
            cache.set(criado.id, criado);
            elemento.dataset.id = criado.id;
        }
        atualizarResumo();
    } catch (erro) {
        AcaiAvisos.mostrar(erro.message || 'Não foi possível mover o bloco.');
        const blocos = await AcaiApi.listarBlocosFixos();
        cache.clear();
        blocos.forEach((item) => {
            const normal = normalizar(item);
            cache.set(normal.id, normal);
        });
        desenharTodos();
    }
}

async function removerOcorrencia(elemento) {
    const id = elemento.dataset.id;
    const dia = Number(elemento.dataset.dia);
    const bloco = cache.get(id);
    elemento.remove();
    if (!id || !bloco) {
        atualizarResumo();
        return;
    }

    try {
        const restantes = (bloco.diasSemana || []).filter((item) => item !== dia);
        if (restantes.length === 0) {
            await AcaiApi.excluirBlocoFixo(id);
            cache.delete(id);
        } else {
            const atualizado = normalizar(await AcaiApi.atualizarBlocoFixo(id, { diasSemana: restantes }));
            cache.set(id, atualizado);
        }
        atualizarResumo();
    } catch (erro) {
        AcaiAvisos.mostrar(erro.message || 'Não foi possível remover o bloco.');
        desenharTodos();
    }
}

function preencherDisciplinas() {
    if (!selectDisciplina) return;
    selectDisciplina.replaceChildren();

    if (disciplinas.length === 0) {
        const opcao = document.createElement('option');
        opcao.value = '';
        opcao.textContent = 'Nenhuma disciplina no passo 1';
        selectDisciplina.appendChild(opcao);
        selectDisciplina.disabled = true;
        return;
    }

    selectDisciplina.disabled = false;
    disciplinas.forEach((disciplina) => {
        const opcao = document.createElement('option');
        opcao.value = disciplina.id;
        opcao.textContent = disciplina.nome;
        selectDisciplina.appendChild(opcao);
    });
}

montarGrade();
rotinas.forEach(ativarArrasteDeRotina);

calendario.addEventListener('dragover', (evento) => {
    if ((!rotinaArrastada && !compromissoArrastado) || !obterPosicao(evento.target)) return;
    evento.preventDefault();
    evento.dataTransfer.dropEffect = compromissoArrastado ? 'move' : 'copy';
    calendario.classList.add('pronto-para-soltar');
});

calendario.addEventListener('dragleave', (evento) => {
    if (!calendario.contains(evento.relatedTarget)) calendario.classList.remove('pronto-para-soltar');
});

calendario.addEventListener('drop', async (evento) => {
    if (compromissoArrastado) soltoNaGrade = true;
    const posicao = obterPosicao(evento.target);
    if ((!rotinaArrastada && !compromissoArrastado) || !posicao) return;
    evento.preventDefault();
    calendario.classList.remove('pronto-para-soltar');

    if (compromissoArrastado) {
        soltoNaGrade = true;
        const elemento = compromissoArrastado;
        try {
            await moverOcorrencia(elemento, posicao);
        } catch (erro) {
            AcaiAvisos.mostrar(erro.message || 'Não foi possível mover o bloco.');
        }
        return;
    }

    const rotina = rotinaArrastada;
    try {
        await criarNaGrade(rotina, posicao);
    } catch (erro) {
        AcaiAvisos.mostrar(erro.message || 'Não foi possível gravar o bloco.');
    }
});

function adicionarBlocoPersonalizado(dados) {
    const cartao = document.createElement('div');
    cartao.className = `rotina ${dados.cor}`;
    cartao.dataset.rotina = dados.nome;
    cartao.dataset.icone = dados.icone;
    cartao.dataset.categoria = dados.categoria;
    cartao.dataset.duracaoFaixas = dados.duracaoFaixas;
    cartao.dataset.prioridade = dados.prioridade;

    const icone = document.createElement('div');
    icone.className = 'icone-rotina';
    icone.textContent = dados.icone;
    const detalhes = document.createElement('div');
    const titulo = document.createElement('strong');
    titulo.textContent = dados.nome;
    const configuracao = document.createElement('small');
    configuracao.textContent = dados.categoria;
    detalhes.append(titulo, configuracao);
    const duracao = document.createElement('span');
    duracao.textContent = dados.duracaoTexto;
    const etiqueta = document.createElement('label');
    etiqueta.textContent = dados.categoria;
    cartao.append(icone, detalhes, duracao, etiqueta);
    ativarArrasteDeRotina(cartao);
    document.querySelector('.cartao-lateral').insertBefore(cartao, document.querySelector('#abrir-modal-bloco'));
}

window.adicionarBlocoPersonalizado = adicionarBlocoPersonalizado;

const quadroModal = document.querySelector('#quadro-modal');
let modalPronto = false;
let aberturaPendente = false;

document.querySelector('#abrir-modal-bloco')?.addEventListener('click', () => {
    if (!modalPronto) aberturaPendente = true;
    quadroModal?.contentWindow?.postMessage({ tipo: 'abrir-modal' }, '*');
});

quadroModal?.addEventListener('load', () => {
    if (!aberturaPendente) return;
    aberturaPendente = false;
    quadroModal.contentWindow.postMessage({ tipo: 'abrir-modal' }, '*');
});

window.addEventListener('message', (evento) => {
    if (!quadroModal || evento.source !== quadroModal.contentWindow || !evento.data) return;

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
        document.querySelector('#abrir-modal-bloco')?.focus();
    }

    if (evento.data.tipo === 'bloco-salvo') {
        adicionarBlocoPersonalizado(evento.data.dados);
    }
});

document.getElementById('botao-proximo')?.addEventListener('click', () => {
    window.location.href = 'index_onboarding_metas.html';
});

document.getElementById('botao-voltar')?.addEventListener('click', () => {
    window.location.href = 'index_onboarding_semestre.html';
});

window.salvarPassoOnboarding = async () => {};

async function iniciar() {
    try {
        const [conta, materias, blocos] = await Promise.all([
            AcaiApi.obterUsuarioAtual(),
            AcaiApi.listarDisciplinas({ situacao: 'ativa' }),
            AcaiApi.listarBlocosFixos(),
        ]);
        metaHoras = conta?.metaSemanalHoras || 10;
        disciplinas = materias;
        blocos.forEach((item) => {
            const bloco = normalizar(item);
            cache.set(bloco.id, bloco);
        });
    } catch (erro) {
        AcaiAvisos.mostrar(erro.message || 'Não foi possível carregar a rotina.');
    }

    preencherDisciplinas();
    desenharTodos();
}

iniciar();
