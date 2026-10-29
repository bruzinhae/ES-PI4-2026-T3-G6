renderLayout({
    paginaAtiva: 'disciplinas',
});

const CORES_HEX = {
    roxo: '#4F3466',
    azul: '#6750A4',
    verde: '#10B981',
    ambar: '#C9A74D',
};

const ETIQUETA_CLASSE = {
    roxo: 'etiqueta-lilas',
    azul: 'etiqueta-violeta',
    verde: 'etiqueta-lilas',
    ambar: 'etiqueta-ambar',
};

// CRUD de disciplinas via API autenticada.
(() => {
    const cartoes = document.getElementById('cartoes-disciplinas');
    const avisoVazio = document.getElementById('disciplinas-vazias');
    const filtrarArea = document.getElementById('filtrar-area');
    const ordenar = document.getElementById('ordenar-disciplinas');
    const seloAtivas = document.getElementById('selo-disciplinas-ativas');
    const modal = document.getElementById('modal-disciplina');
    const formulario = document.getElementById('form-disciplina');
    const erroForm = document.getElementById('erro-form-disciplina');
    let disciplinas = [];
    let editandoId = null;

    const comparadores = {
        horas: (a, b) => Number(b.dataset.horas) - Number(a.dataset.horas),
        nome: (a, b) => a.dataset.nome.localeCompare(b.dataset.nome, 'pt-BR'),
    };

    function escapar(texto) {
        return String(texto ?? '').replace(/[&<>"']/g, (c) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
        }[c]));
    }

    function formatarMedia(valor) {
        if (valor === null || valor === undefined || valor === '') return 'Sem média';
        return `Média ${String(valor).replace('.', ',')}`;
    }

    function formatarHoras(horas) {
        if (!horas) return '0h';
        return Number.isInteger(horas) ? `${horas}h` : `${horas}h`.replace('.', ',');
    }

    function atualizarFiltroAreas() {
        const selecionada = filtrarArea.value || 'todas';
        const areas = [...new Set(disciplinas.map((item) => item.area).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
        filtrarArea.replaceChildren();
        const todas = document.createElement('option');
        todas.value = 'todas';
        todas.textContent = 'Filtrar por Área';
        filtrarArea.append(todas);
        areas.forEach((area) => {
            const opcao = document.createElement('option');
            opcao.value = area;
            opcao.textContent = area;
            filtrarArea.append(opcao);
        });
        filtrarArea.value = areas.includes(selecionada) ? selecionada : 'todas';
    }

    function atualizarIndicadores() {
        const ativas = disciplinas.filter((item) => item.situacao === 'ativa');
        const totalHoras = ativas.reduce((soma, item) => soma + Number(item.horasSemanais || 0), 0);
        const meta = ativas.find((item) => item.metaSemanalHoras)?.metaSemanalHoras
            || disciplinas.find((item) => item.metaSemanalHoras)?.metaSemanalHoras;
        const percentual = meta ? Math.round((totalHoras / meta) * 100) : null;
        seloAtivas.textContent = `${ativas.length} ${ativas.length === 1 ? 'disciplina ativa' : 'disciplinas ativas'}`;
        document.getElementById('indicador-horas-academicas').textContent = `${formatarHoras(Math.round(totalHoras * 10) / 10)} / semana`;
        document.getElementById('indicador-horas-nota').textContent = meta
            ? `${percentual}% da meta de ${meta}h nas matérias`
            : 'Defina a meta de horas no perfil para ver o percentual';
        document.getElementById('indicador-total-ativas').textContent = String(ativas.length);
    }

    function montarCartao(disciplina) {
        const cor = CORES_HEX[disciplina.cor] || CORES_HEX.roxo;
        const classeEtiqueta = ETIQUETA_CLASSE[disciplina.cor] || 'etiqueta-lilas';
        const horas = Number(disciplina.horasSemanais || 0);
        const progresso = disciplina.progresso;
        const creditos = disciplina.creditos != null ? `${disciplina.creditos} créditos` : 'Sem créditos';
        const professor = [disciplina.professor, disciplina.local].filter(Boolean).join(' • ') || 'Professor e local não informados';
        const artigo = document.createElement('article');
        artigo.className = 'cartao-disciplina';
        artigo.style.setProperty('--cor', cor);
        artigo.dataset.id = disciplina.id;
        artigo.dataset.area = disciplina.area || '';
        artigo.dataset.horas = String(horas);
        artigo.dataset.nome = disciplina.nome || '';
        artigo.innerHTML = `
            <div class="cartao-conteudo">
                <div class="cartao-topo">
                    <span class="etiqueta ${classeEtiqueta}">${escapar(disciplina.area)}</span>
                    <div class="cartao-acoes">
                        <button type="button" data-acao="editar" aria-label="Editar disciplina">
                            <img src="assets/icons/disciplinas/editar.svg" alt="" width="10.5" height="10.5">
                        </button>
                        <button type="button" data-acao="excluir" aria-label="Excluir disciplina">
                            <img src="assets/icons/disciplinas/mais-opcoes.svg" alt="" width="2.33" height="9.33">
                        </button>
                    </div>
                </div>
                <h3>${escapar(disciplina.nome)}</h3>
                <div class="cartao-info">
                    <p class="creditos">${escapar(creditos)} • ${escapar(formatarHoras(horas))}/sem alocadas</p>
                    <p class="media-disciplina">${escapar(formatarMedia(disciplina.media))}</p>
                    <p class="professor">${escapar(professor)}</p>
                </div>
                <button type="button" class="botao-grade" data-acao="grade">Colocar na grade</button>
            </div>
            <div class="cartao-progresso">
                <div class="progresso-topo">
                    <span>Da meta semanal</span>
                    <strong style="color: ${cor}">${progresso === null || progresso === undefined ? '—' : `${progresso}%`}</strong>
                </div>
                <div class="trilha">
                    <span style="width: ${Math.min(100, Number(progresso) || 0)}%; background: ${cor}"></span>
                </div>
            </div>
        `;
        artigo.querySelector('[data-acao="editar"]').addEventListener('click', () => abrirModal(disciplina.id));
        artigo.querySelector('[data-acao="excluir"]').addEventListener('click', () => excluirDisciplina(disciplina));
        artigo.querySelector('[data-acao="grade"]').addEventListener('click', () => {
            window.dispatchEvent(new CustomEvent('acaistudy:agendar-disciplina', { detail: { disciplina } }));
        });
        return artigo;
    }

    function atualizarLista() {
        const area = filtrarArea.value;
        const lista = Array.from(cartoes.children);
        lista
            .sort(comparadores[ordenar.value] || comparadores.nome)
            .forEach((cartao) => {
                cartao.hidden = area !== 'todas' && cartao.dataset.area !== area;
                cartoes.appendChild(cartao);
            });
    }

    function renderizar() {
        cartoes.replaceChildren(...disciplinas.map(montarCartao));
        avisoVazio.hidden = disciplinas.length > 0;
        avisoVazio.textContent = 'Nenhuma disciplina cadastrada ainda. Clique em Nova Disciplina para começar.';
        avisoVazio.classList.remove('aviso-erro');
        avisoVazio.classList.add('aviso-info');
        atualizarFiltroAreas();
        atualizarIndicadores();
        atualizarLista();
        window.dispatchEvent(new CustomEvent('acaistudy:disciplinas-atualizadas', { detail: { disciplinas } }));
    }

    async function carregar() {
        try {
            disciplinas = await AcaiApi.listarDisciplinas({ situacao: 'ativa' });
            renderizar();
        } catch (erro) {
            disciplinas = [];
            renderizar();
            avisoVazio.hidden = false;
            avisoVazio.textContent = erro.message || 'Não foi possível carregar as disciplinas.';
            avisoVazio.classList.remove('aviso-info');
            avisoVazio.classList.add('aviso-erro');
        }
    }

    function abrirModal(id = null) {
        editandoId = id;
        formulario.reset();
        erroForm.textContent = '';
        formulario.elements.dificuldade.value = '3';
        formulario.elements.cor.value = 'roxo';
        formulario.elements.situacao.value = 'ativa';
        const disciplina = disciplinas.find((item) => item.id === id);
        if (disciplina) {
            formulario.elements.nome.value = disciplina.nome || '';
            formulario.elements.area.value = disciplina.area || '';
            formulario.elements.cor.value = disciplina.cor || 'roxo';
            formulario.elements.professor.value = disciplina.professor || '';
            formulario.elements.local.value = disciplina.local || '';
            formulario.elements.creditos.value = disciplina.creditos ?? '';
            formulario.elements.media.value = disciplina.media ?? '';
            formulario.elements.dificuldade.value = String(disciplina.dificuldade ?? 3);
            formulario.elements.periodoLetivo.value = disciplina.periodoLetivo || '';
            formulario.elements.situacao.value = disciplina.situacao || 'ativa';
        }
        document.getElementById('titulo-modal-disciplina').textContent = disciplina ? 'Editar disciplina' : 'Nova disciplina';
        document.getElementById('salvar-disciplina').textContent = disciplina ? 'Salvar alterações' : 'Salvar disciplina';
        modal.classList.add('aberto');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-bloco-aberto');
        formulario.elements.nome.focus();
    }

    function fecharModal() {
        modal.classList.remove('aberto');
        modal.setAttribute('aria-hidden', 'true');
        if (!document.getElementById('modal-bloco-fixo')?.classList.contains('aberto')) {
            document.body.classList.remove('modal-bloco-aberto');
        }
    }

    async function excluirDisciplina(disciplina) {
        const confirmado = await AcaiAvisos.confirmar({
            titulo: 'Excluir disciplina',
            texto: `"${disciplina.nome}" sai da sua lista. Os horários na grade continuam, só deixam de estar ligados a ela.`,
            confirmar: 'Excluir disciplina',
        });
        if (!confirmado) return;
        try {
            await AcaiApi.excluirDisciplina(disciplina.id);
            await carregar();
            AcaiAvisos.mostrar('Disciplina excluída.', 'ok');
        } catch (erro) {
            AcaiAvisos.mostrar(erro.message || 'Não foi possível excluir a disciplina.');
        }
    }

    document.getElementById('abrir-cadastro-disciplina')?.addEventListener('click', () => abrirModal());
    document.getElementById('fechar-modal-disciplina')?.addEventListener('click', fecharModal);
    document.getElementById('cancelar-disciplina')?.addEventListener('click', fecharModal);
    modal?.addEventListener('click', (evento) => {
        if (evento.target === modal) fecharModal();
    });
    document.addEventListener('keydown', (evento) => {
        if (evento.key === 'Escape' && modal.classList.contains('aberto')) fecharModal();
    });
    filtrarArea.addEventListener('change', atualizarLista);
    ordenar.addEventListener('change', atualizarLista);

    formulario.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        erroForm.textContent = '';
        const dados = Object.fromEntries(new FormData(formulario).entries());
        dados.nome = dados.nome.trim();
        dados.area = dados.area.trim();
        dados.professor = dados.professor.trim() || null;
        dados.local = dados.local.trim() || null;
        dados.periodoLetivo = dados.periodoLetivo.trim() || null;
        dados.dificuldade = Number(dados.dificuldade);
        dados.creditos = dados.creditos === '' ? null : Number(dados.creditos);
        dados.media = dados.media === '' ? null : Number(String(dados.media).replace(',', '.'));

        const botao = document.getElementById('salvar-disciplina');
        botao.disabled = true;
        try {
            if (editandoId) await AcaiApi.atualizarDisciplina(editandoId, dados);
            else await AcaiApi.criarDisciplina(dados);
            await carregar();
            fecharModal();
        } catch (erro) {
            erroForm.textContent = erro.message || 'Não foi possível salvar a disciplina.';
        } finally {
            botao.disabled = false;
        }
    });

    carregar();
})();

// CRUD de blocos fixos via API autenticada.
(() => {
    const dias = ['Segunda', 'Ter\u00e7a', 'Quarta', 'Quinta', 'Sexta', 'S\u00e1bado', 'Domingo'];
    const formulario = document.querySelector('#form-bloco-fixo');
    const modal = document.querySelector('#modal-bloco-fixo');
    const recorrencia = document.querySelector('#bloco-recorrencia');
    const agenda = document.querySelector('#agenda-semana');
    const avisoAgenda = document.querySelector('#agenda-vazia');
    const inicioHoje = inicioDaSemana(new Date());
    const checksDias = [...formulario.querySelectorAll('[name="diasSemana"]')];
    const campoData = document.querySelector('.campo-data-bloco');
    const seletorDisciplina = document.querySelector('#bloco-disciplina');
    const disciplinasPorId = new Map();
    const disciplinasProntas = carregarDisciplinas();
    let editandoId = null;
    let nomeSugerido = '';
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

    function guardarDisciplinas(lista = []) {
        disciplinasPorId.clear();
        lista.forEach((disciplina) => {
            if (disciplina?.id) disciplinasPorId.set(String(disciplina.id), disciplina);
        });
    }

    async function carregarDisciplinas() {
        try {
            const disciplinas = await AcaiApi.listarDisciplinasAtivas();
            const valorAtual = seletorDisciplina.value;
            seletorDisciplina.querySelectorAll('option:not([value=""])').forEach((opcao) => opcao.remove());
            disciplinas.forEach((disciplina) => {
                const opcao = document.createElement('option');
                opcao.value = disciplina.id;
                opcao.textContent = disciplina.nome;
                seletorDisciplina.append(opcao);
                if (!disciplinasPorId.has(String(disciplina.id))) {
                    disciplinasPorId.set(String(disciplina.id), disciplina);
                }
            });
            if ([...seletorDisciplina.options].some((opcao) => opcao.value === valorAtual)) {
                seletorDisciplina.value = valorAtual;
            }
        } catch { /* A lista de blocos continua utilizavel sem vinculo com disciplina. */ }
    }

    window.addEventListener('acaistudy:disciplinas-atualizadas', (evento) => {
        guardarDisciplinas(evento.detail?.disciplinas);
        carregarDisciplinas();
        if (agenda.childElementCount) renderizar();
    });
    window.addEventListener('acaistudy:agendar-disciplina', (evento) => {
        abrirModal(null, evento.detail?.disciplina);
    });
    function idDo(bloco) { return bloco._id || bloco.id; }
    function exibirErro(mensagem) { document.querySelector('#erro-form-bloco').textContent = mensagem || 'N\u00e3o foi poss\u00edvel salvar o bloco. Tente novamente.'; }
    function formatoData(valor) { return valor ? String(valor).slice(0, 10) : ''; }
    function formatarDuracao(minutos) {
        const h = Math.floor(minutos / 60), m = minutos % 60;
        return [h ? `${h}h` : '', m ? `${m}min` : ''].filter(Boolean).join(' ');
    }
    function minutosDe(hora) {
        const [h, m] = String(hora).slice(0, 5).split(':').map(Number);
        return h * 60 + m;
    }
    function horaDe(minutos) {
        return `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;
    }
    function duracaoInformada() {
        const inicio = formulario.elements.horaInicio.value;
        const fim = formulario.elements.horaFim.value;
        const texto = document.getElementById('bloco-duracao-texto');
        if (!inicio || !fim) {
            texto.textContent = 'O bloco fica neste intervalo, no mesmo dia.';
            return null;
        }
        const duracao = minutosDe(fim) - minutosDe(inicio);
        if (duracao <= 0) {
            texto.textContent = 'O horário de fim precisa ser depois do início.';
            return null;
        }
        if (duracao < 15) {
            texto.textContent = 'O bloco precisa durar pelo menos 15 minutos.';
            return null;
        }
        texto.textContent = `Duração: ${formatarDuracao(duracao)}.`;
        return duracao;
    }
    function sugerirFim() {
        const inicio = formulario.elements.horaInicio.value;
        if (!inicio || formulario.elements.horaFim.value) {
            duracaoInformada();
            return;
        }
        const fim = minutosDe(inicio) + 60;
        if (fim <= 23 * 60 + 59) {
            formulario.elements.horaFim.value = horaDe(fim);
        }
        duracaoInformada();
    }

    // Divide a largura apenas entre compromissos que realmente se sobrepõem.
    // Assim cada bloco mantém a posição vertical do horário e deixa de cobrir o outro.
    function posicionarFaixas(ocorrencias) {
        const ordenadas = [...ocorrencias].sort((a, b) => a.inicio - b.inicio || b.fim - a.fim);
        const posicionadas = [];
        let indice = 0;
        while (indice < ordenadas.length) {
            const grupo = [ordenadas[indice++]];
            let fimGrupo = grupo[0].fim;
            while (indice < ordenadas.length && ordenadas[indice].inicio < fimGrupo) {
                grupo.push(ordenadas[indice]);
                fimGrupo = Math.max(fimGrupo, ordenadas[indice].fim);
                indice += 1;
            }

            const fimFaixa = [];
            const atribuicoes = grupo.map(ocorrencia => {
                let faixa = fimFaixa.findIndex(fim => fim <= ocorrencia.inicio);
                if (faixa === -1) faixa = fimFaixa.length;
                fimFaixa[faixa] = ocorrencia.fim;
                return { ...ocorrencia, faixa };
            });
            const totalFaixas = fimFaixa.length;
            posicionadas.push(...atribuicoes.map(item => ({ ...item, totalFaixas })));
        }
        return posicionadas;
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
        corpo.style.setProperty('--altura-agenda', `${totalHoras * 60}px`);

        const colunaHoras = document.createElement('div');
        colunaHoras.className = 'agenda-horas';
        colunaHoras.style.gridColumn = '1';
        colunaHoras.style.gridRow = '1';
        colunaHoras.setAttribute('aria-hidden', 'true');
        for (let hora = inicioMinutos; hora < fimMinutos; hora += 60) {
            const marca = document.createElement('span');
            marca.textContent = formatarHora(hora);
            colunaHoras.append(marca);
        }
        corpo.append(colunaHoras);

        const eventosPorDia = diasDaSemana.map((data, indice) =>
            posicionarFaixas(ocorrencias.filter(ocorrencia => chaveData(ocorrencia.data) === chaveData(data))
                .map(ocorrencia => ({ ...ocorrencia, indiceDia: indice })))
        );
        diasDaSemana.forEach((data, indice) => {
            const coluna = document.createElement('div');
            coluna.className = 'agenda-dia';
            coluna.style.gridColumn = String(indice + 2);
            coluna.style.gridRow = '1';
            coluna.setAttribute('role', 'group');
            coluna.setAttribute('aria-label', `${dias[indice]} ${chaveData(data)}`);
            corpo.append(coluna);
        });
        const eventosAgrupados = [];
        eventosPorDia.forEach((eventosDoDia, indiceDia) => {
            eventosDoDia.forEach(ocorrencia => {
                const anterior = ocorrencia.totalFaixas === 1 && ocorrencia.bloco.recorrencia === 'semanal'
                    ? [...eventosAgrupados].reverse().find(grupo =>
                        idDo(grupo.bloco) === idDo(ocorrencia.bloco)
                        && grupo.diaFim === indiceDia - 1
                        && grupo.inicio === ocorrencia.inicio
                        && grupo.fim === ocorrencia.fim
                        && grupo.totalFaixas === 1
                    )
                    : null;
                if (anterior) anterior.diaFim = indiceDia;
                else eventosAgrupados.push({ ...ocorrencia, diaInicio: indiceDia, diaFim: indiceDia });
            });
        });

        const camadaEventos = document.createElement('div');
        camadaEventos.className = 'agenda-eventos';
        camadaEventos.style.gridColumn = '2 / 9';
        camadaEventos.style.gridRow = '1';
        eventosAgrupados.forEach(ocorrencia => {
            const compromisso = document.createElement('article');
            compromisso.className = `agenda-compromisso categoria-${ocorrencia.bloco.categoria || 'outro'}${ocorrencia.bloco.fixo ? ' inegociavel' : ''}${ocorrencia.fim - ocorrencia.inicio <= 30 ? ' compacto' : ''}`;
            compromisso.style.top = `${ocorrencia.inicio - inicioMinutos}px`;
            compromisso.style.height = `${Math.max(15, ocorrencia.fim - ocorrencia.inicio)}px`;
            const quantidadeDias = ocorrencia.diaFim - ocorrencia.diaInicio + 1;
            const inicioHorizontal = (ocorrencia.diaInicio + ocorrencia.faixa / ocorrencia.totalFaixas) * 100 / 7;
            const larguraHorizontal = quantidadeDias * 100 / (7 * ocorrencia.totalFaixas);
            compromisso.style.left = `calc(${inicioHorizontal}% + 2px)`;
            compromisso.style.width = `calc(${larguraHorizontal}% - 4px)`;
            const disciplinaVinculo = disciplinasPorId.get(String(ocorrencia.bloco.disciplinaId?._id || ocorrencia.bloco.disciplinaId || ''));
            if (disciplinaVinculo) {
                const corVinculo = CORES_HEX[disciplinaVinculo.cor] || CORES_HEX.roxo;
                compromisso.style.background = `${corVinculo}22`;
                compromisso.style.color = corVinculo;
            }
            compromisso.title = `${ocorrencia.bloco.nome}, ${formatarHora(ocorrencia.inicio)} a ${formatarHora(ocorrencia.fim)}${ocorrencia.bloco.local ? `, ${ocorrencia.bloco.local}` : ''}`;
            compromisso.setAttribute('aria-label', compromisso.title);
            const conteudo = document.createElement('div');
            conteudo.className = 'agenda-compromisso-conteudo';
            const nome = document.createElement('strong');
            nome.textContent = ocorrencia.bloco.nome;
            const horario = document.createElement('span');
            horario.className = 'agenda-compromisso-horario';
            horario.textContent = `${formatarHora(ocorrencia.inicio)}\u2013${formatarHora(ocorrencia.fim)}`;
            conteudo.append(nome, horario);
            compromisso.append(conteudo);

            const menu = document.createElement('div');
            menu.className = 'agenda-menu';
            const botaoMenu = document.createElement('button');
            botaoMenu.className = 'agenda-menu-alternador';
            botaoMenu.type = 'button';
            botaoMenu.textContent = '\u22ef';
            botaoMenu.setAttribute('aria-label', `Op\u00e7\u00f5es para ${ocorrencia.bloco.nome}`);
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
                const confirmado = await AcaiAvisos.confirmar({
                    titulo: 'Excluir bloco',
                    texto: `"${ocorrencia.bloco.nome}" sai da grade desta semana e das próximas.`,
                    confirmar: 'Excluir bloco',
                });
                if (!confirmado) return;
                try {
                    await AcaiApi.excluirBlocoFixo(idDo(ocorrencia.bloco));
                    await carregar();
                    AcaiAvisos.mostrar('Bloco excluído.', 'ok');
                } catch (erro) {
                    AcaiAvisos.mostrar(erro.message || 'Não foi possível excluir o bloco.');
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
            camadaEventos.append(compromisso);
        });
        corpo.append(camadaEventos);

        agenda.append(cabecalho, corpo);
        avisoAgenda.hidden = ocorrencias.length > 0;
        avisoAgenda.classList.remove('aviso-erro');
        avisoAgenda.classList.add('aviso-info');
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
    function atualizarIndicadorGrade() {
        const ids = new Set(blocos
            .map((bloco) => String(bloco.disciplinaId?._id || bloco.disciplinaId || ''))
            .filter(Boolean));
        const total = document.getElementById('indicador-na-grade');
        const nota = document.getElementById('indicador-na-grade-nota');
        if (total) total.textContent = String(ids.size);
        if (nota) {
            nota.textContent = ids.size
                ? `${ids.size === 1 ? '1 matéria está' : `${ids.size} matérias estão`} no calendário`
                : 'Use “Colocar na grade” no cartão da matéria';
        }
    }
    function renderizar() {
        document.querySelector('#total-blocos').textContent = `${blocos.length} ${blocos.length === 1 ? 'bloco' : 'blocos'}`;
        atualizarTotalBloqueado();
        atualizarIndicadorGrade();
        renderizarAgenda();
    }
    async function carregar() {
        try { blocos = await AcaiApi.listarBlocosFixos(); renderizar(); }
        catch (erro) {
            blocos = [];
            renderizar();
            avisoAgenda.textContent = erro.message || 'Não foi possível carregar os compromissos.';
            avisoAgenda.classList.remove('aviso-info');
            avisoAgenda.classList.add('aviso-erro');
            avisoAgenda.hidden = false;
        }
    }
    function preencherPelaDisciplina(disciplina, substituirNome) {
        if (!disciplina) return;
        const nome = formulario.elements.nome;
        if (substituirNome || !nome.value.trim() || nome.value === nomeSugerido) {
            nome.value = disciplina.nome;
            nomeSugerido = disciplina.nome;
        }
        if (!formulario.elements.local.value.trim() && disciplina.local) {
            formulario.elements.local.value = disciplina.local;
        }
        if (substituirNome) formulario.elements.categoria.value = 'aulas';
        formulario.elements.disciplinaId.value = disciplina.id;
    }

    async function abrirModal(id = null, disciplina = null) {
        await disciplinasProntas;
        editandoId = id;
        nomeSugerido = '';
        formulario.reset();
        document.querySelector('#erro-form-bloco').textContent = '';
        checksDias.forEach(check => { check.checked = false; });
        document.querySelector('#bloco-prioridade').value = '5';
        formulario.elements.horaFim.value = '';
        const bloco = id ? blocos.find(item => idDo(item) === id) : null;
        if (bloco) {
            formulario.elements.nome.value = bloco.nome;
            formulario.elements.categoria.value = bloco.categoria;
            const disciplinaId = bloco.disciplinaId?._id || bloco.disciplinaId || '';
            if (disciplinaId && ![...seletorDisciplina.options].some(opcao => opcao.value === disciplinaId)) {
                const opcao = document.createElement('option'); opcao.value = disciplinaId; opcao.textContent = 'Disciplina vinculada'; seletorDisciplina.append(opcao);
            }
            formulario.elements.disciplinaId.value = disciplinaId;
            formulario.elements.recorrencia.value = bloco.recorrencia;
            formulario.elements.horaInicio.value = String(bloco.horaInicio).slice(0, 5);
            const fimMinutos = minutosDe(bloco.horaInicio) + Number(bloco.duracaoMinutos);
            formulario.elements.horaFim.value = fimMinutos >= 1440 ? '23:59' : horaDe(fimMinutos);
            formulario.elements.prioridade.value = bloco.prioridade;
            formulario.elements.local.value = bloco.local || '';
            formulario.elements.fixo.checked = Boolean(bloco.fixo);
            formulario.elements.data.value = formatoData(bloco.data);
            checksDias.forEach(check => { check.checked = (bloco.diasSemana || []).includes(Number(check.value)); });
        } else if (disciplina) {
            preencherPelaDisciplina(disciplina, true);
            formulario.elements.fixo.checked = true;
        }
        alternarRecorrencia();
        duracaoInformada();
        document.querySelector('#titulo-modal-bloco-fixo').textContent = bloco ? 'Editar bloco fixo' : disciplina ? 'Colocar na grade' : 'Novo bloco fixo';
        modal.querySelector('.botao-salvar-bloco').textContent = bloco ? 'Salvar alterações' : 'Salvar bloco';
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
    modal.querySelectorAll('.fechar-modal-bloco,.botao-cancelar-bloco').forEach(botao => botao.addEventListener('click', fecharModal));
    modal.addEventListener('click', evento => { if (evento.target === modal) fecharModal(); });
    document.addEventListener('keydown', evento => {
        if (evento.key !== 'Escape') return;
        if (document.getElementById('modal-disciplina')?.classList.contains('aberto')) return;
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
    seletorDisciplina.addEventListener('change', () => {
        preencherPelaDisciplina(disciplinasPorId.get(seletorDisciplina.value), false);
    });
    formulario.elements.horaInicio.addEventListener('change', sugerirFim);
    formulario.elements.horaFim.addEventListener('change', duracaoInformada);
    formulario.addEventListener('submit', async evento => {
        evento.preventDefault();
        const dados = Object.fromEntries(new FormData(formulario).entries());
        dados.diasSemana = recorrencia.value === 'semanal' ? checksDias.filter(check => check.checked).map(check => Number(check.value)) : [];
        dados.prioridade = Number(dados.prioridade); dados.fixo = formulario.elements.fixo.checked;
        dados.local = dados.local.trim(); dados.nome = dados.nome.trim(); dados.data = dados.data || null; dados.disciplinaId = dados.disciplinaId.trim() || null;
        dados.horaInicio = String(dados.horaInicio || '').slice(0, 5);
        delete dados.horaFim;
        const erro = document.querySelector('#erro-form-bloco'); erro.textContent = '';
        if (dados.recorrencia === 'semanal' && !dados.diasSemana.length) { exibirErro('Selecione ao menos um dia da semana.'); return; }
        const duracao = duracaoInformada();
        if (!duracao) { exibirErro(document.getElementById('bloco-duracao-texto').textContent); return; }
        dados.duracaoMinutos = duracao;
        if (conflita(dados)) { exibirErro('Este horário se sobrepõe a outro bloco cadastrado nos mesmos dias.'); return; }
        const botao = modal.querySelector('.botao-salvar-bloco'); botao.disabled = true;
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
