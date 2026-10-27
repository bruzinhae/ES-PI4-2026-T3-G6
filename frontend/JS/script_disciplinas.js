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
    const grade = document.querySelector('#cartoes-blocos-fixos');
    const formulario = document.querySelector('#form-bloco-fixo');
    const modal = document.querySelector('#modal-bloco-fixo');
    const recorrencia = document.querySelector('#bloco-recorrencia');
    const checksDias = [...formulario.querySelectorAll('[name="diasSemana"]')];
    const campoData = document.querySelector('.campo-data-bloco');
    const seletorDisciplina = document.querySelector('#bloco-disciplina');
    const disciplinasProntas = carregarDisciplinas();
    let editandoId = null;
    let blocos = [];

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
    function escapar(valor) { const el = document.createElement('span'); el.textContent = valor ?? ''; return el.innerHTML; }
    function exibirErro(mensagem) { document.querySelector('#erro-form-bloco').textContent = mensagem || 'N\u00e3o foi poss\u00edvel salvar o bloco. Tente novamente.'; }
    function formatoData(valor) { return valor ? String(valor).slice(0, 10) : ''; }
    function formatarDuracao(minutos) {
        const h = Math.floor(minutos / 60), m = minutos % 60;
        return [h ? `${h}h` : '', m ? `${m}min` : ''].filter(Boolean).join(' ');
    }
    function textoDias(bloco) {
        if (bloco.recorrencia === 'unico') return bloco.data ? new Date(`${formatoData(bloco.data)}T12:00:00`).toLocaleDateString('pt-BR') : 'Data\u00fanica';
        return (bloco.diasSemana || []).map(Number).sort().map(dia => dias[dia]).join(', ');
    }
    function renderizar() {
        grade.replaceChildren();
        document.querySelector('#total-blocos').textContent = `${blocos.length} ${blocos.length === 1 ? 'bloco' : 'blocos'}`;
        if (!blocos.length) {
            const vazio = document.createElement('p'); vazio.className = 'bloco-fixo-vazio';
            vazio.textContent = 'Nenhum compromisso cadastrado. Adicione seu primeiro bloco fixo para organizar a rotina.';
            grade.append(vazio); return;
        }
        blocos.forEach(bloco => {
            const id = idDo(bloco);
            const card = document.createElement('article'); card.className = 'bloco-fixo-card';
            const topo = document.createElement('div'); topo.className = 'bloco-fixo-card-topo';
            topo.innerHTML = `<div><h4>${escapar(bloco.nome)}</h4><span class="bloco-fixo-categoria">${escapar(categorias[bloco.categoria] || bloco.categoria)}</span></div><div class="bloco-fixo-card-acoes"><button type="button" data-acao="editar" aria-label="Editar ${escapar(bloco.nome)}">Editar</button><button type="button" data-acao="excluir" aria-label="Excluir ${escapar(bloco.nome)}">Excluir</button></div>`;
            const detalhe = document.createElement('p');
            detalhe.textContent = `${textoDias(bloco)}  \u00b7 ${bloco.horaInicio} \u00b7 ${formatarDuracao(Number(bloco.duracaoMinutos))}${bloco.local ? ` \u00b7 ${bloco.local}` : ''}${bloco.fixo ? ' | Inegoci\u00e1vel' : ''}`;
            topo.querySelector('[data-acao="editar"]').addEventListener('click', () => abrirModal(id));
            topo.querySelector('[data-acao="excluir"]').addEventListener('click', async () => {
                if (!window.confirm(`Excluir o bloco \u201c${bloco.nome}\u201d?`)) return;
                try { await AcaiApi.excluirBlocoFixo(id); await carregar(); }
                catch (erro) { window.alert(erro.message); }
            });
            card.append(topo, detalhe); grade.append(card);
        });
    }
    async function carregar() {
        grade.setAttribute('aria-busy', 'true');
        try { blocos = await AcaiApi.listarBlocosFixos(); renderizar(); }
        catch (erro) { grade.innerHTML = `<p class="bloco-fixo-vazio">${escapar(erro.message || 'N\u00e3o foi poss\u00edvel carregar os blocos.')}</p>`; }
        finally { grade.removeAttribute('aria-busy'); }
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
    document.querySelectorAll('.fechar-modal-bloco,.botao-cancelar-bloco').forEach(botao => botao.addEventListener('click', fecharModal));
    modal.addEventListener('click', evento => { if (evento.target === modal) fecharModal(); });
    document.addEventListener('keydown', evento => { if (evento.key === 'Escape' && modal.classList.contains('aberto')) fecharModal(); });
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
