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


// Cadastro de blocos fixos. A tela ainda n?o possui endpoints de blocos; os dados
// ficam no navegador at? a integra??o com a API.
(() => {
    const chave = `acaistudy-blocos-fixos:${localStorage.getItem('acaistudy-usuario-id') || 'visitante'}`;
    const nomesDias = ['Segunda', 'Ter?a', 'Quarta', 'Quinta', 'Sexta', 'S?bado', 'Domingo'];
    const categorias = { aulas: 'Aulas e faculdade', trabalho: 'Trabalho e est?gio', sono: 'Sono e descanso', saude: 'Sa?de e exerc?cio', pausa: 'Refei??es e pausas', translado: 'Deslocamento', outro: 'Outro compromisso' };
    const grade = document.querySelector('#cartoes-blocos-fixos');
    const formulario = document.querySelector('#form-bloco-fixo');
    const modal = document.querySelector('#modal-bloco-fixo');
    const recorrencia = document.querySelector('#bloco-recorrencia');
    const checksDias = [...formulario.querySelectorAll('[name="diasSemana"]')];
    const seletorDisciplina = document.querySelector('#bloco-disciplina');
    document.querySelectorAll('#cartoes-disciplinas .cartao-disciplina h3').forEach(titulo => {
        const opcao = document.createElement('option'); opcao.value = titulo.textContent.trim(); opcao.textContent = titulo.textContent.trim(); seletorDisciplina.append(opcao);
    });
    const campoData = document.querySelector('.campo-data-bloco');
    let editandoId = null;
    let blocos = lerBlocos();

    function lerBlocos() {
        try { return JSON.parse(localStorage.getItem(chave) || '[]'); }
        catch { return []; }
    }
    function persistir() { localStorage.setItem(chave, JSON.stringify(blocos)); }
    function escapar(texto) { const el = document.createElement('span'); el.textContent = texto ?? ''; return el.innerHTML; }
    function formatarDuracao(minutos) {
        const h = Math.floor(minutos / 60), m = minutos % 60;
        return [h ? `${h}h` : '', m ? `${m}min` : ''].filter(Boolean).join(' ');
    }
    function textoDias(bloco) {
        if (bloco.recorrencia === 'unico') return bloco.data ? new Date(`${bloco.data}T12:00:00`).toLocaleDateString('pt-BR') : 'Data ?nica';
        return (bloco.diasSemana || []).map(Number).sort().map(d => nomesDias[d]).join(', ');
    }
    function renderizar() {
        grade.replaceChildren();
        document.querySelector('#total-blocos').textContent = `${blocos.length} ${blocos.length === 1 ? 'bloco' : 'blocos'}`;
        if (!blocos.length) {
            const vazio = document.createElement('p'); vazio.className = 'bloco-fixo-vazio';
            vazio.textContent = 'Nenhum compromisso cadastrado. Adicione seu primeiro bloco fixo para organizar a rotina.'; grade.append(vazio); return;
        }
        blocos.forEach((bloco) => {
            const card = document.createElement('article'); card.className = 'bloco-fixo-card';
            const data = document.createElement('div'); data.className = 'bloco-fixo-card-topo';
            data.innerHTML = `<div><h4>${escapar(bloco.nome)}</h4><span class="bloco-fixo-categoria">${escapar(categorias[bloco.categoria] || bloco.categoria)}</span></div><div class="bloco-fixo-card-acoes"><button type="button" data-acao="editar" aria-label="Editar ${escapar(bloco.nome)}">Editar</button><button type="button" data-acao="excluir" aria-label="Excluir ${escapar(bloco.nome)}">Excluir</button></div>`;
            const detalhes = document.createElement('p');
            detalhes.textContent = `${textoDias(bloco)} ? ${bloco.horaInicio} ? ${formatarDuracao(Number(bloco.duracaoMinutos))}${bloco.local ? ` ? ${bloco.local}` : ''}${bloco.fixo ? ' ? Inegoci?vel' : ''}`;
            data.querySelector('[data-acao="editar"]').addEventListener('click', () => abrirModal(bloco.id));
            data.querySelector('[data-acao="excluir"]').addEventListener('click', () => {
                if (!window.confirm(`Excluir o bloco ?${bloco.nome}??`)) return;
                blocos = blocos.filter(item => item.id !== bloco.id); persistir(); renderizar();
            });
            card.append(data, detalhes); grade.append(card);
        });
    }
    function abrirModal(id = null) {
        editandoId = id;
        formulario.reset();
        document.querySelector('#erro-form-bloco').textContent = '';
        checksDias.forEach(check => { check.checked = false; });
        document.querySelector('#bloco-duracao').value = '60';
        document.querySelector('#bloco-prioridade').value = '5';
        const bloco = blocos.find(item => item.id === id);
        if (bloco) {
            formulario.elements.nome.value = bloco.nome;
            formulario.elements.categoria.value = bloco.categoria;
            formulario.elements.disciplinaId.value = bloco.disciplinaId || '';
            formulario.elements.recorrencia.value = bloco.recorrencia;
            formulario.elements.horaInicio.value = bloco.horaInicio;
            formulario.elements.duracaoMinutos.value = bloco.duracaoMinutos;
            formulario.elements.prioridade.value = bloco.prioridade;
            formulario.elements.local.value = bloco.local || '';
            formulario.elements.fixo.checked = Boolean(bloco.fixo);
            formulario.elements.data.value = bloco.data || '';
            checksDias.forEach(check => { check.checked = (bloco.diasSemana || []).includes(Number(check.value)); });
        }
        alternarRecorrencia();
        document.querySelector('#titulo-modal-bloco-fixo').textContent = bloco ? 'Editar bloco fixo' : 'Novo bloco fixo';
        document.querySelector('.botao-salvar-bloco').textContent = bloco ? 'Salvar altera??es' : 'Salvar bloco';
        modal.classList.add('aberto'); modal.setAttribute('aria-hidden', 'false'); document.body.classList.add('modal-bloco-aberto');
        formulario.elements.nome.focus();
    }
    function fecharModal() { modal.classList.remove('aberto'); modal.setAttribute('aria-hidden', 'true'); document.body.classList.remove('modal-bloco-aberto'); }
    function alternarRecorrencia() {
        const unico = recorrencia.value === 'unico';
        campoData.hidden = !unico;
        document.querySelector('#bloco-data').required = unico;
        checksDias.forEach(check => { check.required = false; check.disabled = unico; if (unico) check.checked = false; });
    }
    function conflito(dados) {
        const inicio = dados.horaInicio.split(':').map(Number).reduce((h, m) => h * 60 + m);
        const fim = inicio + Number(dados.duracaoMinutos);
        return blocos.some(outro => {
            if (outro.id === editandoId) return false;
            const diaData = data => (new Date(`${data}T12:00:00`).getDay() + 6) % 7;
            if (dados.recorrencia === 'unico' && outro.recorrencia === 'unico' && dados.data !== outro.data) return false;
            if (dados.recorrencia === 'unico' && outro.recorrencia === 'semanal' && !(outro.diasSemana || []).includes(diaData(dados.data))) return false;
            if (dados.recorrencia === 'semanal' && outro.recorrencia === 'unico' && !(dados.diasSemana || []).includes(diaData(outro.data))) return false;
            if (dados.recorrencia === 'semanal' && outro.recorrencia === 'semanal' && !(dados.diasSemana || []).some(dia => (outro.diasSemana || []).includes(dia))) return false;
            const outroInicio = outro.horaInicio.split(':').map(Number).reduce((h, m) => h * 60 + m);
            return inicio < outroInicio + Number(outro.duracaoMinutos) && outroInicio < fim;
        });
    }
    document.querySelector('#abrir-cadastro-bloco').addEventListener('click', () => abrirModal());
    document.querySelectorAll('.fechar-modal-bloco,.botao-cancelar-bloco').forEach(botao => botao.addEventListener('click', fecharModal));
    modal.addEventListener('click', event => { if (event.target === modal) fecharModal(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && modal.classList.contains('aberto')) fecharModal(); });
    recorrencia.addEventListener('change', alternarRecorrencia);
    formulario.addEventListener('submit', event => {
        event.preventDefault();
        const dados = Object.fromEntries(new FormData(formulario).entries());
        dados.diasSemana = recorrencia.value === 'semanal' ? checksDias.filter(check => check.checked).map(check => Number(check.value)) : [];
        dados.duracaoMinutos = Number(dados.duracaoMinutos); dados.prioridade = Number(dados.prioridade); dados.fixo = formulario.elements.fixo.checked;
        dados.local = dados.local.trim(); dados.nome = dados.nome.trim(); dados.data = dados.data || null;
        const erro = document.querySelector('#erro-form-bloco');
        if (!dados.nome) { erro.textContent = 'Informe o nome do compromisso.'; return; }
        if (dados.recorrencia === 'semanal' && !dados.diasSemana.length) { erro.textContent = 'Selecione ao menos um dia da semana.'; return; }
        const inicio = dados.horaInicio.split(':').map(Number).reduce((h, m) => h * 60 + m);
        if (inicio + dados.duracaoMinutos > 1440) { erro.textContent = 'O hor?rio e a dura??o ultrapassam o fim do dia.'; return; }
        if (conflito(dados)) { erro.textContent = 'Este hor?rio se sobrep?e a outro bloco semanal cadastrado.'; return; }
        if (editandoId) blocos = blocos.map(item => item.id === editandoId ? { ...item, ...dados } : item);
        else blocos.push({ id: (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`), ...dados });
        persistir(); renderizar(); fecharModal();
    });
    renderizar();
})();
