renderLayout({
    paginaAtiva: 'disciplinas',
});

const cartoes = document.getElementById('cartoes-disciplinas');
const filtrarArea = document.getElementById('filtrar-area');
const ordenar = document.getElementById('ordenar-disciplinas');
const alternadorSemana = document.querySelectorAll('.alternador button');

const listaCartoes = Array.from(cartoes.children);

// Mais horas e maior progresso vêm primeiro; nome segue ordem alfabética.
const comparadores = {
    horas: (a, b) => Number(b.dataset.horas) - Number(a.dataset.horas),
    progresso: (a, b) => Number(b.dataset.progresso) - Number(a.dataset.progresso),
    nome: (a, b) => a.dataset.nome.localeCompare(b.dataset.nome, 'pt-BR'),
};

function atualizarLista() {
    const area = filtrarArea.value;

    listaCartoes
        .sort(comparadores[ordenar.value])
        .forEach((cartao) => {
            cartao.hidden = area !== 'todas' && cartao.dataset.area !== area;
            cartoes.appendChild(cartao);
        });
}

filtrarArea.addEventListener('change', atualizarLista);
ordenar.addEventListener('change', atualizarLista);

alternadorSemana.forEach((botao) => {
    botao.addEventListener('click', () => {
        alternadorSemana.forEach((outro) => outro.classList.remove('ativo'));
        botao.classList.add('ativo');
    });
});


// CRUD de blocos fixos via API autenticada.
(() => {
    const dias = ['Segunda', 'Ter\u00e7a', 'Quarta', 'Quinta', 'Sexta', 'S\u00e1bado', 'Domingo'];
    const categorias = { aulas: 'Aulas e faculdade', trabalho: 'Trabalho e est\u00e1gio', sono: 'Sono e descanso', saude: 'Sa\u00fade e exerc\u00edcio', pausa: 'Refei\u00e7\u00f5es e pausas', translado: 'Deslocamento', outro: 'Outro compromisso' };
    const formulario = document.querySelector('#form-bloco-fixo');
    const modal = document.querySelector('#modal-bloco-fixo');
    const recorrencia = document.querySelector('#bloco-recorrencia');
    const agenda = document.querySelector('#agenda-semana');
    const avisoAgenda = document.querySelector('#agenda-vazia');
    const inicioHoje = inicioDaSemana(new Date());
    const checksDias = [...formulario.querySelectorAll('[name="diasSemana"]')];
    const campoData = document.querySelector('.campo-data-bloco');
    const seletorDisciplina = document.querySelector('#bloco-disciplina');
    const disciplinasProntas = carregarDisciplinas();
    let editandoId = null;
    let blocos = [];
    let inicioSemana = new Date(inicioHoje);

    function inicioDaSemana(data) {
        const inicio = new Date(data.getFullYear(), data.getMonth(), data.getDate());
        inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7));
        return inicio;
    }

    function chaveData(data) {
        return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
    }

    function formatarSemana(inicio, fim) {
        const mesmoMes = inicio.getMonth() === fim.getMonth() && inicio.getFullYear() === fim.getFullYear();
        const dia = new Intl.DateTimeFormat('pt-BR', { day: 'numeric' });
        const dataCompleta = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
        return mesmoMes
            ? `${dia.format(inicio)} a ${dataCompleta.format(fim)}`
            : `${dataCompleta.format(inicio)} a ${dataCompleta.format(fim)}`;
    }

    function formatarHora(minutos) {
        if (minutos === 1440) return '24:00';
        return `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;
    }

    async function carregarDisciplinas() {
        try {
            const disciplinas = await AcaiApi.listarDisciplinasAtivas();
            disciplinas.forEach(disciplina => {
                const opcao = document.createElement('option');
                opcao.value = disciplina._id; opcao.textContent = disciplina.nome;
                seletorDisciplina.append(opcao);
            });
        } catch { /* A lista de blocos continua utilizavel sem vinculo com disciplina. */ }
    }
    function idDo(bloco) { return bloco._id || bloco.id; }
    function exibirErro(mensagem) { document.querySelector('#erro-form-bloco').textContent = mensagem || 'N\u00e3o foi poss\u00edvel salvar o bloco. Tente novamente.'; }
    function formatoData(valor) { return valor ? String(valor).slice(0, 10) : ''; }
    function formatarDuracao(minutos) {
        const h = Math.floor(minutos / 60), m = minutos % 60;
        return [h ? `${h}h` : '', m ? `${m}min` : ''].filter(Boolean).join(' ');
    }
    function ocorrenciasDaSemana() {
        const diasDaSemana = Array.from({ length: 7 }, (_, indice) => {
            const data = new Date(inicioSemana);
            data.setDate(data.getDate() + indice);
            return data;
        });
        return blocos.flatMap(bloco => {
            const inicio = Number(bloco.horaInicio?.slice(0, 2)) * 60 + Number(bloco.horaInicio?.slice(3, 5));
            const duracao = Number(bloco.duracaoMinutos);
            if (!Number.isFinite(inicio) || !Number.isFinite(duracao) || duracao <= 0) return [];
            return diasDaSemana.flatMap((data, indice) => {
                const ocorreNoDia = bloco.recorrencia === 'semanal'
                    ? (bloco.diasSemana || []).map(Number).includes(indice)
                    : bloco.recorrencia === 'unico' && formatoData(bloco.data) === chaveData(data);
                return ocorreNoDia ? [{ bloco, data, inicio, fim: inicio + duracao }] : [];
            });
        }).sort((a, b) => a.inicio - b.inicio || a.bloco.nome.localeCompare(b.bloco.nome, 'pt-BR'));
    }

    function renderizarAgenda() {
        const ocorrencias = ocorrenciasDaSemana();
        const fimSemana = new Date(inicioSemana);
        fimSemana.setDate(fimSemana.getDate() + 6);
        document.querySelector('#semana-visivel').textContent = formatarSemana(inicioSemana, fimSemana);
        agenda.replaceChildren();

        const cabecalho = document.createElement('div');
        cabecalho.className = 'agenda-cabecalho';
        const canto = document.createElement('div');
        canto.className = 'agenda-canto';
        canto.textContent = 'Horário';
        cabecalho.append(canto);

        const diasDaSemana = Array.from({ length: 7 }, (_, indice) => {
            const data = new Date(inicioSemana);
            data.setDate(data.getDate() + indice);
            const celula = document.createElement('div');
            celula.className = `agenda-dia-cabecalho${chaveData(data) === chaveData(new Date()) ? ' dia-atual' : ''}`;
            const nomeDia = document.createElement('span');
            nomeDia.textContent = dias[indice];
            const dataDia = document.createElement('time');
            dataDia.dateTime = chaveData(data);
            dataDia.textContent = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(data);
            celula.append(nomeDia, dataDia);
            cabecalho.append(celula);
            return data;
        });

        const inicioMinutos = ocorrencias.length
            ? Math.min(7 * 60, ...ocorrencias.map(ocorrencia => Math.floor(ocorrencia.inicio / 60) * 60))
            : 7 * 60;
        const fimMinutos = ocorrencias.length
            ? Math.max(22 * 60, ...ocorrencias.map(ocorrencia => Math.ceil(ocorrencia.fim / 60) * 60))
            : 22 * 60;
        const totalHoras = Math.max(1, (fimMinutos - inicioMinutos) / 60);
        const corpo = document.createElement('div');
        corpo.className = 'agenda-corpo';
        corpo.style.setProperty('--horas-visiveis', totalHoras);
        corpo.style.setProperty('--altura-agenda', `${totalHoras * 72}px`);

        const colunaHoras = document.createElement('div');
        colunaHoras.className = 'agenda-horas';
        colunaHoras.setAttribute('aria-hidden', 'true');
        for (let hora = inicioMinutos; hora < fimMinutos; hora += 60) {
            const marca = document.createElement('span');
            marca.textContent = formatarHora(hora);
            colunaHoras.append(marca);
        }
        corpo.append(colunaHoras);

        diasDaSemana.forEach((data, indice) => {
            const coluna = document.createElement('div');
            coluna.className = 'agenda-dia';
            coluna.setAttribute('role', 'group');
            coluna.setAttribute('aria-label', `${dias[indice]} ${chaveData(data)}`);
            ocorrencias.filter(ocorrencia => chaveData(ocorrencia.data) === chaveData(data)).forEach(ocorrencia => {
                const compromisso = document.createElement('article');
                compromisso.className = `agenda-compromisso categoria-${ocorrencia.bloco.categoria || 'outro'}${ocorrencia.bloco.fixo ? ' inegociavel' : ''}${ocorrencia.fim - ocorrencia.inicio <= 30 ? ' compacto' : ''}`;
                compromisso.style.top = `${(ocorrencia.inicio - inicioMinutos) * 1.2}px`;
                compromisso.style.height = `${Math.max(18, (ocorrencia.fim - ocorrencia.inicio) * 1.2)}px`;
                compromisso.title = `${ocorrencia.bloco.nome}, ${formatarHora(ocorrencia.inicio)} a ${formatarHora(ocorrencia.fim)}${ocorrencia.bloco.local ? `, ${ocorrencia.bloco.local}` : ''}`;
                compromisso.setAttribute('aria-label', compromisso.title);
                const conteudo = document.createElement('div');
                conteudo.className = 'agenda-compromisso-conteudo';
                const nome = document.createElement('strong');
                nome.textContent = ocorrencia.bloco.nome;
                const categoria = document.createElement('span');
                categoria.className = 'agenda-compromisso-categoria';
                categoria.textContent = categorias[ocorrencia.bloco.categoria] || 'Outro compromisso';
                const horario = document.createElement('span');
                horario.className = 'agenda-compromisso-horario';
                horario.textContent = `${formatarHora(ocorrencia.inicio)}–${formatarHora(ocorrencia.fim)}`;
                conteudo.append(nome, categoria, horario);
                if (ocorrencia.bloco.local) {
                    const local = document.createElement('span');
                    local.className = 'agenda-compromisso-local';
                    local.textContent = ocorrencia.bloco.local;
                    conteudo.append(local);
                }
                compromisso.append(conteudo);

                const menu = document.createElement('div');
                menu.className = 'agenda-menu';
                const botaoMenu = document.createElement('button');
                botaoMenu.className = 'agenda-menu-alternador';
                botaoMenu.type = 'button';
                botaoMenu.textContent = '⋯';
                botaoMenu.setAttribute('aria-label', `Opções para ${ocorrencia.bloco.nome}`);
                botaoMenu.setAttribute('aria-expanded', 'false');
                const opcoes = document.createElement('div');
                opcoes.className = 'agenda-menu-opcoes';
                opcoes.hidden = true;
                const botaoEditar = document.createElement('button');
                botaoEditar.type = 'button';
                botaoEditar.textContent = 'Editar bloco';
                botaoEditar.addEventListener('click', () => {
                    opcoes.hidden = true;
                    botaoMenu.setAttribute('aria-expanded', 'false');
                    abrirModal(idDo(ocorrencia.bloco));
                });
                const botaoExcluir = document.createElement('button');
                botaoExcluir.type = 'button';
                botaoExcluir.className = 'agenda-acao-excluir';
                botaoExcluir.textContent = 'Excluir bloco';
                botaoExcluir.addEventListener('click', async () => {
                    if (!window.confirm(`Excluir o bloco “${ocorrencia.bloco.nome}”?`)) return;
                    try {
                        await AcaiApi.excluirBlocoFixo(idDo(ocorrencia.bloco));
                        await carregar();
                    } catch (erro) {
                        window.alert(erro.message);
                    }
                });
                opcoes.append(botaoEditar, botaoExcluir);
                botaoMenu.addEventListener('click', () => {
                    const abrir = opcoes.hidden;
                    agenda.querySelectorAll('.agenda-menu-opcoes').forEach(outro => { outro.hidden = true; });
                    agenda.querySelectorAll('.agenda-menu-alternador').forEach(outro => outro.setAttribute('aria-expanded', 'false'));
                    opcoes.hidden = !abrir;
                    botaoMenu.setAttribute('aria-expanded', String(abrir));
                });
                menu.append(botaoMenu, opcoes);
                compromisso.append(menu);
                coluna.append(compromisso);
            });
            corpo.append(coluna);
        });

        agenda.append(cabecalho, corpo);
        avisoAgenda.hidden = ocorrencias.length > 0;
        avisoAgenda.textContent = blocos.length
            ? 'Não há compromissos cadastrados para esta semana.'
            : 'Nenhum compromisso cadastrado. Adicione um bloco para visualizá-lo na grade.';
    }

    function atualizarTotalBloqueado() {
        const minutos = blocos.reduce((total, bloco) => {
            if (!bloco.fixo || bloco.recorrencia !== 'semanal') return total;
            return total + Number(bloco.duracaoMinutos) * (bloco.diasSemana || []).length;
        }, 0);
        document.querySelector('#horas-bloqueadas-semana').textContent = `${formatarDuracao(minutos) || '0h'} bloqueadas / semana`;
    }
    function renderizar() {
        document.querySelector('#total-blocos').textContent = `${blocos.length} ${blocos.length === 1 ? 'bloco' : 'blocos'}`;
        atualizarTotalBloqueado();
        renderizarAgenda();
    }
    async function carregar() {
        try { blocos = await AcaiApi.listarBlocosFixos(); renderizar(); }
        catch (erro) {
            blocos = [];
            renderizar();
            avisoAgenda.textContent = erro.message || 'Não foi possível carregar os compromissos.';
            avisoAgenda.hidden = false;
        }
    }
    async function abrirModal(id = null) {
        await disciplinasProntas;
        editandoId = id;
        formulario.reset();
        document.querySelector('#erro-form-bloco').textContent = '';
        checksDias.forEach(check => { check.checked = false; });
        document.querySelector('#bloco-duracao').value = '60';
        document.querySelector('#bloco-prioridade').value = '5';
        const bloco = blocos.find(item => idDo(item) === id);
        if (bloco) {
            formulario.elements.nome.value = bloco.nome;
            formulario.elements.categoria.value = bloco.categoria;
            const disciplinaId = bloco.disciplinaId?._id || bloco.disciplinaId || '';
            if (disciplinaId && ![...seletorDisciplina.options].some(opcao => opcao.value === disciplinaId)) {
                const opcao = document.createElement('option'); opcao.value = disciplinaId; opcao.textContent = 'Disciplina vinculada'; seletorDisciplina.append(opcao);
            }
            formulario.elements.disciplinaId.value = disciplinaId;
            formulario.elements.recorrencia.value = bloco.recorrencia;
            formulario.elements.horaInicio.value = bloco.horaInicio;
            formulario.elements.duracaoMinutos.value = bloco.duracaoMinutos;
            formulario.elements.prioridade.value = bloco.prioridade;
            formulario.elements.local.value = bloco.local || '';
            formulario.elements.fixo.checked = Boolean(bloco.fixo);
            formulario.elements.data.value = formatoData(bloco.data);
            checksDias.forEach(check => { check.checked = (bloco.diasSemana || []).includes(Number(check.value)); });
        }
        alternarRecorrencia();
        document.querySelector('#titulo-modal-bloco-fixo').textContent = bloco ? 'Editar bloco fixo' : 'Novo bloco fixo';
        document.querySelector('.botao-salvar-bloco').textContent = bloco ? 'Salvar altera\u00e7\u00f5es' : 'Salvar bloco';
        modal.classList.add('aberto'); modal.setAttribute('aria-hidden', 'false'); document.body.classList.add('modal-bloco-aberto');
        formulario.elements.nome.focus();
    }
    function fecharModal() { modal.classList.remove('aberto'); modal.setAttribute('aria-hidden', 'true'); document.body.classList.remove('modal-bloco-aberto'); }
    function alternarRecorrencia() {
        const unico = recorrencia.value === 'unico';
        campoData.hidden = !unico;
        document.querySelector('#bloco-data').required = unico;
        checksDias.forEach(check => { check.disabled = unico; if (unico) check.checked = false; });
    }
    function conflita(dados) {
        const min = hora => hora.split(':').map(Number).reduce((h, m) => h * 60 + m);
        const dia = data => (new Date(`${formatoData(data)}T12:00:00`).getDay() + 6) % 7;
        return blocos.some(outro => {
            if (idDo(outro) === editandoId) return false;
            if (dados.recorrencia === 'unico' && outro.recorrencia === 'unico' && formatoData(dados.data) !== formatoData(outro.data)) return false;
            if (dados.recorrencia === 'unico' && outro.recorrencia === 'semanal' && !outro.diasSemana.includes(dia(dados.data))) return false;
            if (dados.recorrencia === 'semanal' && outro.recorrencia === 'unico' && !dados.diasSemana.includes(dia(outro.data))) return false;
            if (dados.recorrencia === 'semanal' && outro.recorrencia === 'semanal' && !dados.diasSemana.some(d => outro.diasSemana.includes(d))) return false;
            return min(dados.horaInicio) < min(outro.horaInicio) + Number(outro.duracaoMinutos) && min(outro.horaInicio) < min(dados.horaInicio) + Number(dados.duracaoMinutos);
        });
    }
    document.querySelector('#abrir-cadastro-bloco').addEventListener('click', () => abrirModal());
    document.querySelector('#semana-anterior').addEventListener('click', () => {
        inicioSemana.setDate(inicioSemana.getDate() - 7);
        renderizarAgenda();
    });
    document.querySelector('#semana-proxima').addEventListener('click', () => {
        inicioSemana.setDate(inicioSemana.getDate() + 7);
        renderizarAgenda();
    });
    document.querySelector('#semana-atual').addEventListener('click', () => {
        inicioSemana = new Date(inicioHoje);
        renderizarAgenda();
    });
    document.addEventListener('click', evento => {
        if (evento.target.closest('.agenda-menu')) return;
        agenda.querySelectorAll('.agenda-menu-opcoes').forEach(opcoes => { opcoes.hidden = true; });
        agenda.querySelectorAll('.agenda-menu-alternador').forEach(botao => botao.setAttribute('aria-expanded', 'false'));
    });
    document.querySelectorAll('.fechar-modal-bloco,.botao-cancelar-bloco').forEach(botao => botao.addEventListener('click', fecharModal));
    modal.addEventListener('click', evento => { if (evento.target === modal) fecharModal(); });
    document.addEventListener('keydown', evento => {
        if (evento.key !== 'Escape') return;
        if (modal.classList.contains('aberto')) {
            fecharModal();
            return;
        }
        const aberto = agenda.querySelector('.agenda-menu-alternador[aria-expanded="true"]');
        if (aberto) {
            aberto.setAttribute('aria-expanded', 'false');
            aberto.nextElementSibling.hidden = true;
            aberto.focus();
        }
    });
    recorrencia.addEventListener('change', alternarRecorrencia);
    formulario.addEventListener('submit', async evento => {
        evento.preventDefault();
        const dados = Object.fromEntries(new FormData(formulario).entries());
        dados.diasSemana = recorrencia.value === 'semanal' ? checksDias.filter(check => check.checked).map(check => Number(check.value)) : [];
        dados.duracaoMinutos = Number(dados.duracaoMinutos); dados.prioridade = Number(dados.prioridade); dados.fixo = formulario.elements.fixo.checked;
        dados.local = dados.local.trim(); dados.nome = dados.nome.trim(); dados.data = dados.data || null; dados.disciplinaId = dados.disciplinaId.trim() || null;
        const erro = document.querySelector('#erro-form-bloco'); erro.textContent = '';
        if (dados.recorrencia === 'semanal' && !dados.diasSemana.length) { exibirErro('Selecione ao menos um dia da semana.'); return; }
        const [h, m] = dados.horaInicio.split(':').map(Number);
        if (h * 60 + m + dados.duracaoMinutos > 1440) { exibirErro('O hor\u00e1rio e a dura\u00e7\u00e3o ultrapassam o fim do dia.'); return; }
        if (conflita(dados)) { exibirErro('Este hor\u00e1rio se sobrep\u00f5e a outro bloco cadastrado nos mesmos dias.'); return; }
        const botao = document.querySelector('.botao-salvar-bloco'); botao.disabled = true;
        try {
            if (editandoId) await AcaiApi.atualizarBlocoFixo(editandoId, dados);
            else await AcaiApi.criarBlocoFixo(dados);
            await carregar(); fecharModal();
        } catch (erroApi) { exibirErro(erroApi.message); }
        finally { botao.disabled = false; }
    });
    renderizar();
    carregar();
})();
