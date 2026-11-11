function calcularPorcentagemProgresso(estudado, total) {
    if (total <= 0) return 0;
    if (estudado >= total) return 100;
    return Math.round((estudado / total) * 100);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { calcularPorcentagemProgresso };
}

if (typeof document !== 'undefined' && document.getElementById('lista-metas')) {
    renderLayout({ paginaAtiva: 'metas' });

    const FILTROS = [
        { id: 'ativa', rotulo: 'Em andamento', titulo: 'Metas em andamento' },
        { id: '', rotulo: 'Todas as metas', titulo: 'Todas as metas' },
        { id: 'concluida', rotulo: 'Concluídas', titulo: 'Metas concluídas' },
    ];

    const VISUAIS = {
        geral: {
            icone: 'assets/icons/metas/card-bandeira.svg',
            classe: 'icone-roxo',
            cor: '#4F3466',
            etiqueta: 'Objetivo geral',
            classeEtiqueta: 'etiqueta-roxa',
        },
        disciplina: {
            icone: 'assets/icons/metas/card-codigo.svg',
            classe: 'icone-azul',
            cor: '#2563EB',
            etiqueta: 'Disciplina',
            classeEtiqueta: 'etiqueta-cinza',
        },
        projeto: {
            icone: 'assets/icons/metas/card-tcc.svg',
            classe: 'icone-verde',
            cor: '#10B981',
            etiqueta: 'Projeto',
            classeEtiqueta: 'etiqueta-cinza',
        },
        habito: {
            icone: 'assets/icons/metas/card-habito.svg',
            classe: 'icone-verde',
            cor: '#10B981',
            etiqueta: 'Hábito',
            classeEtiqueta: 'etiqueta-cinza',
        },
    };

    const PRIORIDADE = {
        alta: { ordem: 1, texto: 'Alta prioridade', classe: 'etiqueta-ambar etiqueta-suave' },
        media: { ordem: 2, texto: 'Média prioridade', classe: 'etiqueta-azul' },
        baixa: { ordem: 3, texto: 'Baixa prioridade', classe: 'etiqueta-verde' },
    };

    const lista = document.getElementById('lista-metas');
    const ordenar = document.getElementById('ordenar-metas');
    const modal = document.getElementById('modal-meta');
    const formulario = document.getElementById('form-meta');
    const listaMarcosFormulario = document.getElementById('lista-marcos-formulario');
    const erroForm = document.getElementById('erro-meta');

    let metas = [];
    let painel = null;
    let leitura = null;
    let pedidoLeitura = 0;
    let filtroIndice = 0;
    let metaEmEdicao = null;

    function escapar(texto) {
        return String(texto ?? '').replace(/[&<>"']/g, (caractere) => `&#${caractere.charCodeAt(0)};`);
    }

    function formatarPrazo(valor) {
        if (!valor) {
            return 'Sem prazo';
        }
        return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long' }).format(new Date(valor));
    }

    function chavePrazo(valor) {
        if (!valor) {
            return '9999-12-31';
        }
        const data = new Date(valor);
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const dia = String(data.getDate()).padStart(2, '0');
        return `${data.getFullYear()}-${mes}-${dia}`;
    }

    function visualDaMeta(meta) {
        const base = VISUAIS[meta.tipo] || VISUAIS.geral;
        if (meta.atrasada || (meta.prioridade === 'alta' && meta.progresso < 40)) {
            return {
                ...base,
                icone: 'assets/icons/metas/card-atencao.svg',
                classe: 'icone-vermelho',
                cor: '#DC2626',
            };
        }
        return base;
    }

    function detalheDaMeta(meta) {
        if (meta.totalMarcos) {
            return `${meta.atingidos} de ${meta.totalMarcos} marcos atingidos`;
        }
        if (meta.metaSemanalHoras) {
            return `${meta.horasRealizadas} de ${meta.metaSemanalHoras} horas nesta semana`;
        }
        return 'Sem marcos para medir o progresso';
    }

    function etiquetaExtra(meta) {
        if (meta.atrasada) {
            return '<span class="etiqueta etiqueta-ambar">Prazo vencido</span>';
        }
        if (meta.critica) {
            return '<span class="etiqueta etiqueta-rosa">Prazo próximo</span>';
        }
        if (meta.tipo === 'habito') {
            return '<span class="etiqueta etiqueta-verde">Semanal</span>';
        }
        return '';
    }

    function cartaoMeta(meta) {
        const visual = visualDaMeta(meta);
        const prioridade = PRIORIDADE[meta.prioridade] || PRIORIDADE.media;
        const etiquetaTipo = meta.disciplinaNome || visual.etiqueta;
        const prazoCritico = meta.critica || meta.atrasada ? ' prazo-critico' : '';

        return `
            <article class="meta" data-id="${escapar(meta.id)}" data-prioridade="${prioridade.ordem}" data-prazo="${chavePrazo(meta.prazo)}" data-progresso="${meta.progresso}">
                <div class="meta-linha">
                    <div class="meta-esquerda">
                        <div class="meta-icone ${visual.classe}">
                            <img src="${visual.icone}" alt="" width="18" height="18">
                        </div>
                        <div class="meta-corpo">
                            <div class="meta-cabecalho">
                                <div class="meta-titulo-linha">
                                    <h3>${escapar(meta.titulo)}</h3>
                                    <span class="etiqueta ${visual.classeEtiqueta}">${escapar(etiquetaTipo)}</span>
                                </div>
                                <div class="meta-etiquetas">
                                    <span class="etiqueta ${prioridade.classe}">${prioridade.texto}</span>
                                    ${etiquetaExtra(meta)}
                                </div>
                            </div>
                            <div class="meta-detalhes">
                                <span class="prazo${prazoCritico}">
                                    <img src="assets/icons/metas/${meta.atrasada || meta.critica ? 'alerta-prazo.svg' : 'calendario-prazo.svg'}" alt="" width="12" height="13">
                                    <span>Prazo: ${escapar(formatarPrazo(meta.prazo))}</span>
                                </span>
                                <span class="separador">•</span>
                                <span class="${meta.atrasada ? 'detalhe-ambar' : 'detalhe-texto'}">${escapar(detalheDaMeta(meta))}</span>
                            </div>
                        </div>
                    </div>
                    <div class="meta-direita">
                        <div class="meta-progresso">
                            <div class="meta-progresso-topo">
                                <span>Progresso</span>
                                <strong style="color: ${visual.cor}">${meta.progresso}%</strong>
                            </div>
                            <div class="trilha">
                                <span style="width: ${meta.progresso}%; background: ${visual.cor}"></span>
                            </div>
                        </div>
                        <div class="meta-acoes">
                            <button type="button" class="botao-detalhes" data-editar="${escapar(meta.id)}">Ver<br>Detalhes</button>
                            <button type="button" class="botao-editar" data-editar="${escapar(meta.id)}" aria-label="Editar meta">
                                <img src="assets/icons/metas/editar.svg" alt="" width="14" height="14">
                            </button>
                        </div>
                    </div>
                </div>
            </article>`;
    }

    function pintarLista() {
        if (!metas.length) {
            lista.innerHTML = '<p class="metas-vazias">Nenhuma meta neste filtro. Use “Nova meta” para começar.</p>';
            return;
        }
        lista.innerHTML = metas.map(cartaoMeta).join('');
    }

    function ordenarLista() {
        const criterio = ordenar.value;
        const artigos = Array.from(lista.querySelectorAll('.meta'));
        const valor = {
            prioridade: (item) => Number(item.dataset.prioridade),
            prazo: (item) => new Date(item.dataset.prazo).getTime(),
            progresso: (item) => Number(item.dataset.progresso),
        }[criterio];
        if (!valor) {
            return;
        }
        artigos.sort((a, b) => valor(a) - valor(b)).forEach((item) => lista.appendChild(item));
    }

    function pintarPainel() {
        const semestre = painel?.semestre || { concluidas: 0, total: 0, percentual: 0, pendentes: 0, variacaoPercentual: null };
        const consistencia = painel?.consistencia || { percentual: 0, cumpridas: 0, previstas: 0, nota: '' };
        const prazo = painel?.prazo || { diasRestantes: null, nota: '' };
        const previsao = painel?.previsao || { rotulo: '—', percentual: 0, nota: '' };
        const filtro = FILTROS[filtroIndice];

        document.getElementById('kpi-semestre-valor').textContent = `${semestre.concluidas}/${semestre.total}`;
        document.getElementById('kpi-semestre-percentual').textContent = `(${semestre.percentual}%)`;
        document.getElementById('kpi-semestre-nota').textContent = semestre.pendentes
            ? `${semestre.pendentes} meta${semestre.pendentes === 1 ? '' : 's'} ainda em andamento`
            : 'Nenhuma meta em andamento';

        const variacao = document.getElementById('kpi-semestre-variacao');
        if (semestre.variacaoPercentual === null || semestre.variacaoPercentual === undefined) {
            variacao.hidden = true;
        } else {
            const sinal = semestre.variacaoPercentual > 0 ? '+' : '';
            document.getElementById('kpi-semestre-variacao-texto').textContent = `${sinal}${semestre.variacaoPercentual}% vs mês ant.`;
            variacao.hidden = false;
        }

        document.getElementById('kpi-consistencia-valor').textContent = `${consistencia.percentual}%`;
        document.getElementById('kpi-consistencia-complemento').textContent = `${consistencia.cumpridas}/${consistencia.previstas} sessões`;
        document.getElementById('kpi-consistencia-barra').style.width = `${consistencia.percentual}%`;
        document.getElementById('kpi-consistencia-nota').textContent = consistencia.nota;

        const dias = prazo.diasRestantes;
        const tituloDias = document.getElementById('kpi-dias-titulo');
        const complementoDias = document.getElementById('kpi-dias-complemento');
        const seloDias = document.getElementById('kpi-dias-selo');
        document.getElementById('kpi-dias-nota').textContent = prazo.nota;

        if (dias === null) {
            document.getElementById('kpi-dias-valor').textContent = '—';
            complementoDias.textContent = 'dias';
            tituloDias.textContent = 'Dias restantes no semestre';
            seloDias.hidden = true;
        } else if (dias < 0) {
            const atraso = Math.abs(dias);
            document.getElementById('kpi-dias-valor').textContent = String(atraso);
            complementoDias.textContent = atraso === 1 ? 'dia atrás' : 'dias atrás';
            tituloDias.textContent = 'Último prazo';
            seloDias.hidden = false;
            seloDias.textContent = 'Prazo vencido';
        } else if (dias === 0) {
            document.getElementById('kpi-dias-valor').textContent = 'Hoje';
            complementoDias.textContent = '';
            tituloDias.textContent = 'Dias restantes no semestre';
            seloDias.hidden = false;
            seloDias.textContent = 'Último dia';
        } else {
            document.getElementById('kpi-dias-valor').textContent = String(dias);
            complementoDias.textContent = dias === 1 ? 'dia' : 'dias';
            tituloDias.textContent = 'Dias restantes no semestre';
            seloDias.hidden = false;
            seloDias.textContent = dias <= 21 ? 'Reta final' : 'Em curso';
        }

        document.getElementById('kpi-previsao-valor').textContent = previsao.rotulo;
        document.getElementById('kpi-previsao-nota').textContent = previsao.nota;
        const seloPrevisao = document.getElementById('kpi-previsao-selo');
        if (!painel || previsao.rotulo === 'Sem base') {
            seloPrevisao.hidden = true;
        } else {
            seloPrevisao.hidden = false;
            seloPrevisao.textContent = `${previsao.percentual}% médio`;
        }

        document.getElementById('titulo-lista-metas').textContent = filtro.titulo;
        document.getElementById('rotulo-filtro-metas').textContent = `${filtro.rotulo} (${metas.length})`;
        const ativas = semestre.pendentes;
        document.getElementById('selo-ativas').textContent = ativas === 1 ? '1 ativa' : `${ativas} ativas`;

        const recentes = painel?.marcosRecentes || [];
        const destino = document.getElementById('lista-marcos-recentes');
        destino.innerHTML = recentes.length
            ? recentes.map((marco) => {
                const nota = marco.nota === null || marco.nota === undefined ? '' : ` (${marco.nota})`;
                if (marco.atingido) {
                    return `<span class="marco marco-verde"><img src="assets/icons/metas/check-marco.svg" alt="" width="10" height="7"><span>${escapar(marco.titulo)}${escapar(nota)}</span></span>`;
                }
                return `<span class="marco marco-ambar"><img src="assets/icons/metas/relogio-marco.svg" alt="" width="10" height="12"><span>${escapar(marco.titulo)} (Pendente)</span></span>`;
            }).join('')
            : '<span class="detalhe-cinza">Nenhum marco cadastrado.</span>';

        const insight = alvoDoBanner();
        const base = painel?.insight || { texto: 'Cadastre uma meta para acompanhar o semestre.', metaId: null, marcoId: null };
        document.getElementById('texto-insight').textContent = base.texto;
        const textoSofia = document.getElementById('texto-sofia');
        textoSofia.hidden = !leitura?.texto;
        textoSofia.textContent = leitura?.texto || '';
        document.getElementById('botao-editar-foco').textContent = insight.metaId ? 'Editar meta' : 'Nova meta';
        document.getElementById('botao-concluir-marco').hidden = !insight.marcoId;
        pintarSugestoes();
        const selo = document.getElementById('selo-sofia-metas');
        if (selo) {
            if (leitura?.sugestoes?.length) {
                selo.textContent = 'Marcos sugeridos';
            } else if (leitura?.modelo) {
                selo.textContent = 'Leitura pronta';
            } else if (leitura) {
                selo.textContent = 'Sem metas';
            } else {
                selo.textContent = 'Pronta para sugerir';
            }
        }
    }

    function pintarSugestoes() {
        const destino = document.getElementById('sugestoes-sofia');
        const sugestoes = leitura?.metaId ? (leitura.sugestoes || []) : [];
        destino.innerHTML = sugestoes.map((item) => `
            <div class="sugestao-marco">
                <span>${escapar(item.titulo)}</span>
                ${item.dataSugerida ? `<small title="Data sugerida pelo servidor, entre hoje e o prazo da meta">${escapar(dataCurta(item.dataSugerida))}</small>` : ''}
                <button type="button" data-incluir="${escapar(item.titulo)}">Incluir</button>
            </div>`).join('');
    }

    // "2026-11-20" -> "até 20/11" (sem passar por Date, para o fuso do navegador não mudar o dia).
    function dataCurta(data) {
        const [, mes, dia] = String(data).split('-');
        return mes && dia ? `até ${dia}/${mes}` : '';
    }

    function alvoDoBanner() {
        const base = painel?.insight || { metaId: null, marcoId: null };
        const metaId = leitura?.metaId || base.metaId || null;
        const meta = metas.find((item) => item.id === metaId) || null;
        const pendente = (meta?.marcos || []).find((marco) => marco.atingido !== true) || null;
        let marcoId = pendente?.id || null;

        if (!marcoId && !meta) {
            marcoId = (leitura?.metaId ? leitura.marcoId : base.marcoId) || null;
        }

        return { metaId, marcoId };
    }

    function mostrarErro(mensagem) {
        erroForm.hidden = false;
        erroForm.textContent = mensagem;
    }

    function linhaMarco(marco = {}) {
        const item = document.createElement('li');
        item.className = 'marco-formulario';
        if (marco.id) {
            item.dataset.id = marco.id;
        }
        if (marco.atingidoEm) {
            item.dataset.atingidoEm = marco.atingidoEm;
        }
        item.innerHTML = `
            <input type="checkbox" aria-label="Marco atingido" ${marco.atingido ? 'checked' : ''}>
            <input type="text" value="${escapar(marco.titulo || '')}" placeholder="Título do marco" maxlength="160">
            <input type="number" value="${marco.nota ?? ''}" min="0" max="10" step="0.1" placeholder="Nota" aria-label="Nota">
            <button type="button" aria-label="Remover marco">×</button>`;
        item.querySelector('button').addEventListener('click', () => item.remove());
        listaMarcosFormulario.appendChild(item);
    }

    function atualizarCamposTipo() {
        const tipo = formulario.elements.tipo.value;
        document.getElementById('campo-disciplina').hidden = tipo !== 'disciplina';
        document.getElementById('campo-horas').hidden = tipo !== 'habito';
        document.getElementById('sugerir-marcos').hidden = tipo === 'habito';
        const nota = document.getElementById('nota-marcos');
        nota.hidden = tipo !== 'habito';
        nota.textContent = tipo === 'habito' ? 'Hábito é medido pelas horas da semana.' : '';
    }

    async function preencherDisciplinas(selecionada) {
        const select = formulario.elements.disciplinaId;
        const atual = selecionada || '';
        select.innerHTML = '<option value="">Sem vínculo</option>';
        try {
            const disciplinas = await AcaiApi.listarDisciplinasAtivas();
            disciplinas.forEach((disciplina) => {
                const opcao = document.createElement('option');
                opcao.value = disciplina.id;
                opcao.textContent = disciplina.nome;
                select.appendChild(opcao);
            });
        } catch {
            // O vínculo fica opcional se a lista não carregar.
        }
        select.value = atual;
    }

    function abrirModal(meta) {
        metaEmEdicao = meta || null;
        erroForm.hidden = true;
        formulario.reset();
        listaMarcosFormulario.innerHTML = '';
        document.getElementById('titulo-modal-meta').textContent = meta ? 'Editar meta' : 'Nova meta';
        document.getElementById('excluir-meta').hidden = !meta;
        formulario.elements.titulo.value = meta?.titulo || '';
        formulario.elements.tipo.value = meta?.tipo || 'geral';
        formulario.elements.prioridade.value = meta?.prioridade || 'media';
        formulario.elements.situacao.value = meta?.situacao || 'ativa';
        formulario.elements.prazo.value = chavePrazo(meta?.prazo) === '9999-12-31' ? '' : chavePrazo(meta?.prazo);
        formulario.elements.metaSemanalHoras.value = meta?.metaSemanalHoras ?? '';
        (meta?.marcos || []).forEach(linhaMarco);
        atualizarCamposTipo();
        preencherDisciplinas(meta?.disciplinaId || '');
        modal.hidden = false;
        formulario.elements.titulo.focus();
    }

    function fecharModal() {
        modal.hidden = true;
        metaEmEdicao = null;
    }

    function marcosDoFormulario() {
        return Array.from(listaMarcosFormulario.children).map((item) => {
            const [atingido, titulo, nota] = item.querySelectorAll('input');
            return {
                ...(item.dataset.id ? { id: item.dataset.id } : {}),
                titulo: titulo.value.trim(),
                atingido: atingido.checked,
                atingidoEm: atingido.checked ? (item.dataset.atingidoEm || null) : null,
                nota: nota.value === '' ? null : Number(nota.value),
            };
        }).filter((marco) => marco.titulo);
    }

    async function carregar({ manterLeitura = false } = {}) {
        if (!manterLeitura) {
            leitura = null;
        }
        const filtro = FILTROS[filtroIndice];
        try {
            const resposta = await AcaiApi.listarMetas(filtro.id ? { situacao: filtro.id } : {});
            metas = resposta.metas || [];
            painel = resposta.painel;
            pintarLista();
            ordenarLista();
            pintarPainel();
        } catch (erro) {
            lista.innerHTML = `<p class="aviso aviso-erro">${escapar(erro.message || 'Não foi possível carregar as metas.')}</p>`;
            document.getElementById('texto-insight').textContent = 'Não foi possível carregar o resumo das metas.';
        }
    }

    document.getElementById('filtro-metas').addEventListener('click', () => {
        filtroIndice = (filtroIndice + 1) % FILTROS.length;
        carregar({ manterLeitura: true });
    });

    ordenar.addEventListener('change', ordenarLista);
    document.getElementById('abrir-cadastro-meta').addEventListener('click', () => abrirModal(null));
    document.getElementById('fechar-modal-meta').addEventListener('click', fecharModal);
    document.getElementById('adicionar-marco').addEventListener('click', () => linhaMarco());
    formulario.elements.tipo.addEventListener('change', atualizarCamposTipo);

    modal.addEventListener('click', (evento) => {
        if (evento.target === modal) {
            fecharModal();
        }
    });

    document.addEventListener('keydown', (evento) => {
        if (evento.key === 'Escape' && !modal.hidden) {
            fecharModal();
        }
    });

    lista.addEventListener('click', (evento) => {
        const botao = evento.target.closest('[data-editar]');
        if (!botao) {
            return;
        }
        const meta = metas.find((item) => item.id === botao.dataset.editar);
        if (meta) {
            abrirModal(meta);
        }
    });

    async function metaDoInsight() {
        const id = alvoDoBanner().metaId;
        if (!id) {
            return null;
        }
        return metas.find((item) => item.id === id) || AcaiApi.obterMeta(id);
    }

    document.getElementById('botao-analisar-metas').addEventListener('click', async () => {
        const botao = document.getElementById('botao-analisar-metas');
        const selo = document.getElementById('selo-sofia-metas');
        const pedido = ++pedidoLeitura;
        botao.disabled = true;
        botao.textContent = 'Sugerindo...';
        selo.textContent = 'Sugerindo';
        try {
            const resultado = await AcaiApi.analisarMetas();
            if (pedido !== pedidoLeitura) {
                return;
            }
            leitura = resultado;
            pintarPainel();
        } catch (erro) {
            if (pedido !== pedidoLeitura) {
                return;
            }
            const textoSofia = document.getElementById('texto-sofia');
            textoSofia.hidden = false;
            textoSofia.textContent = erro.message || 'Não foi possível sugerir marcos.';
            selo.textContent = 'Tente de novo';
        } finally {
            if (pedido === pedidoLeitura) {
                botao.disabled = false;
                botao.textContent = 'Sugerir marcos';
            }
        }
    });

    document.getElementById('sugestoes-sofia').addEventListener('click', async (evento) => {
        const botao = evento.target.closest('[data-incluir]');
        if (!botao || botao.disabled) {
            return;
        }
        const titulo = botao.dataset.incluir;
        botao.disabled = true;
        botao.textContent = '...';
        try {
            const meta = await metaDoInsight();
            if (!meta) {
                return;
            }
            const marcos = [
                ...meta.marcos.map((marco) => ({
                    id: marco.id,
                    titulo: marco.titulo,
                    atingido: marco.atingido,
                    atingidoEm: marco.atingidoEm,
                    nota: marco.nota,
                })),
                { titulo, atingido: false, nota: null },
            ];
            await AcaiApi.atualizarMeta(meta.id, { marcos });
            if (leitura?.sugestoes) {
                leitura.sugestoes = leitura.sugestoes.filter((item) => item.titulo !== titulo);
            }
            await carregar({ manterLeitura: true });
        } catch (erro) {
            const textoSofia = document.getElementById('texto-sofia');
            textoSofia.hidden = false;
            textoSofia.textContent = erro.message || 'Não foi possível incluir o marco.';
            botao.disabled = false;
            botao.textContent = 'Incluir';
        }
    });

    document.getElementById('sugerir-marcos').addEventListener('click', async () => {
        const botao = document.getElementById('sugerir-marcos');
        const titulo = formulario.elements.titulo.value.trim();
        if (titulo.length < 2) {
            mostrarErro('Escreva o título da meta antes de pedir marcos.');
            return;
        }
        botao.disabled = true;
        botao.textContent = 'Sugerindo...';
        erroForm.hidden = true;
        try {
            const sugestao = await AcaiApi.sugerirMarcosMeta({
                titulo,
                tipo: formulario.elements.tipo.value,
                disciplinaId: formulario.elements.disciplinaId.value || null,
                prazo: formulario.elements.prazo.value || null,
                existentes: marcosDoFormulario().map((marco) => marco.titulo),
            });
            (sugestao.marcos || []).forEach((nome) => linhaMarco({ titulo: nome }));
            if (!sugestao.marcos?.length) {
                mostrarErro(sugestao.aviso || 'A Sofia não encontrou marcos novos para esse título.');
            }
        } catch (erro) {
            mostrarErro(erro.message || 'Não foi possível sugerir marcos.');
        } finally {
            botao.disabled = false;
            botao.textContent = 'Sugerir marcos';
        }
    });

    document.getElementById('botao-editar-foco').addEventListener('click', async () => {
        try {
            abrirModal(await metaDoInsight());
        } catch (erro) {
            document.getElementById('texto-sofia').hidden = false;
            document.getElementById('texto-sofia').textContent = erro.message || 'Não foi possível abrir a meta.';
        }
    });

    document.getElementById('botao-concluir-marco').addEventListener('click', async () => {
        const botao = document.getElementById('botao-concluir-marco');
        const rotulo = botao.querySelector('span');
        const alvo = alvoDoBanner();
        const textoSofia = document.getElementById('texto-sofia');

        if (!alvo.metaId) {
            textoSofia.hidden = false;
            textoSofia.textContent = 'Essa meta ainda não tem um marco para concluir.';
            botao.hidden = true;
            return;
        }

        botao.disabled = true;
        if (rotulo) {
            rotulo.textContent = 'Concluindo...';
        }

        try {
            const meta = await AcaiApi.obterMeta(alvo.metaId);
            const pendente = (meta?.marcos || []).find((marco) => marco.id === alvo.marcoId && marco.atingido !== true)
                || (meta?.marcos || []).find((marco) => marco.atingido !== true);

            if (!meta || !pendente) {
                textoSofia.hidden = false;
                textoSofia.textContent = 'Essa meta não tem marco pendente.';
                botao.hidden = true;
                return;
            }

            const marcos = meta.marcos.map((marco) => ({
                id: marco.id,
                titulo: marco.titulo,
                atingido: marco.id === pendente.id ? true : marco.atingido === true,
                atingidoEm: marco.id === pendente.id ? null : marco.atingidoEm,
                nota: marco.nota ?? null,
            }));
            await AcaiApi.atualizarMeta(meta.id, { marcos });
            leitura = null;
            await carregar();
        } catch (erro) {
            textoSofia.hidden = false;
            textoSofia.textContent = erro.message || 'Não foi possível concluir o marco.';
        } finally {
            botao.disabled = false;
            if (rotulo) {
                rotulo.textContent = 'Concluir marco';
            }
        }
    });

    formulario.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        erroForm.hidden = true;
        const tipo = formulario.elements.tipo.value;
        const horas = formulario.elements.metaSemanalHoras.value;
        if (tipo === 'habito' && !horas) {
            mostrarErro('Informe quantas horas por semana esse hábito pede.');
            return;
        }
        const dados = {
            titulo: formulario.elements.titulo.value.trim(),
            tipo,
            prioridade: formulario.elements.prioridade.value,
            situacao: formulario.elements.situacao.value,
            prazo: formulario.elements.prazo.value || null,
            disciplinaId: tipo === 'disciplina' ? (formulario.elements.disciplinaId.value || null) : null,
            metaSemanalHoras: tipo === 'habito' ? Number(horas) : null,
            marcos: marcosDoFormulario(),
        };
        try {
            if (metaEmEdicao) {
                await AcaiApi.atualizarMeta(metaEmEdicao.id, dados);
            } else {
                await AcaiApi.criarMeta(dados);
            }
            fecharModal();
            await carregar();
        } catch (erro) {
            mostrarErro(erro.message || 'Não foi possível salvar a meta.');
        }
    });

    document.getElementById('excluir-meta').addEventListener('click', async () => {
        if (!metaEmEdicao) {
            return;
        }
        const confirmado = await AcaiAvisos.confirmar({
            titulo: 'Excluir meta',
            texto: `"${metaEmEdicao.titulo}" sai da sua lista, junto com os marcos dela.`,
            confirmar: 'Excluir meta',
        });
        if (!confirmado) {
            return;
        }
        try {
            await AcaiApi.excluirMeta(metaEmEdicao.id);
            fecharModal();
            await carregar();
            AcaiAvisos.mostrar('Meta excluída.', 'ok');
        } catch (erro) {
            mostrarErro(erro.message || 'Não foi possível excluir a meta.');
        }
    });

    carregar();
}
