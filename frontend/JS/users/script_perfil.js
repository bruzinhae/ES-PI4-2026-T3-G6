/**
 * Perfil do usuário — carrega e salva os dados via API (JS/users/api.js).
 */

renderLayout({
    paginaAtiva: '',
});

const AVATAR_PADRAO = 'assets/icons/perfil/avatar-704c8e.png';
const HORAS_BARRA_CHEIA = 40;
const CAMPOS_NUMERICOS = ['semestre', 'metaSemanalHoras'];

const botaoSalvar = document.getElementById('botao-salvar');
const botaoDescartar = document.getElementById('botao-descartar');
const campos = document.querySelectorAll('.grade-campos input, .grade-campos select');
const campoMeta = document.querySelector('[name="metaSemanalHoras"]');
const trilhaMeta = document.getElementById('trilha-meta-preenchida');

let usuarioAtual = null;

function descreverCurso(usuario) {
    const partes = [];

    if (usuario.curso) {
        partes.push(usuario.curso);
    }

    if (usuario.semestre) {
        const turno = usuario.turno ? ` ${usuario.turno[0].toUpperCase()}${usuario.turno.slice(1)}` : '';
        partes.push(`${usuario.semestre}º Semestre${turno}`);
    }

    return partes.join(' • ') || 'Complete seus dados acadêmicos';
}

function atualizarTrilhaMeta() {
    const horas = Number(campoMeta.value) || 0;
    trilhaMeta.style.width = `${Math.min(100, (horas / HORAS_BARRA_CHEIA) * 100)}%`;
}

function preencherTela(usuario) {
    usuarioAtual = usuario;

    campos.forEach((campo) => {
        campo.value = usuario[campo.name] ?? '';
    });

    const foto = document.getElementById('foto-perfil');
    foto.src = usuario.urlAvatar || AVATAR_PADRAO;
    foto.alt = `Foto de ${usuario.nome}`;

    document.getElementById('resumo-nome').textContent = usuario.nome;
    document.getElementById('resumo-curso').textContent = descreverCurso(usuario);
    document.getElementById('selo-verificado').hidden = !usuario.emailVerificado;
    document.getElementById('botao-remover-foto').hidden = !usuario.urlAvatar;

    atualizarTrilhaMeta();
}

function lerFormulario() {
    const dados = {};

    campos.forEach((campo) => {
        const valor = campo.value.trim();

        if (CAMPOS_NUMERICOS.includes(campo.name)) {
            dados[campo.name] = valor === '' ? null : Number(valor);
        } else {
            dados[campo.name] = valor === '' ? null : valor;
        }
    });

    return dados;
}

function mostrarRetornoSalvar(texto) {
    const rotulo = botaoSalvar.querySelector('span');
    const textoOriginal = rotulo.textContent;

    rotulo.textContent = texto;

    window.setTimeout(() => {
        rotulo.textContent = textoOriginal;
        botaoSalvar.disabled = false;
    }, 1400);
}

async function carregarPerfil() {
    // Sem usuário salvo neste navegador, não há perfil para mostrar.
    if (!AcaiApi.temUsuarioAtual()) {
        window.location.href = 'index_criar_conta.html';
        return;
    }

    try {
        preencherTela(await AcaiApi.obterUsuarioAtual());
    } catch (erro) {
        if (erro.status === 404 || erro.status === 400) {
            AcaiApi.esquecerUsuario();
            window.location.href = 'index_criar_conta.html';
            return;
        }

        alert(erro.message);
    }
}

campoMeta?.addEventListener('input', atualizarTrilhaMeta);

botaoDescartar?.addEventListener('click', () => {
    if (usuarioAtual) {
        preencherTela(usuarioAtual);
    }
});

botaoSalvar?.addEventListener('click', async () => {
    botaoSalvar.disabled = true;

    try {
        preencherTela(await AcaiApi.atualizarUsuarioAtual(lerFormulario()));
        mostrarRetornoSalvar('Salvo');
    } catch (erro) {
        botaoSalvar.disabled = false;
        alert(erro.message);
    }
});

document.getElementById('botao-alterar-foto')?.addEventListener('click', async () => {
    const url = prompt('Cole o link (URL) da sua nova foto de perfil:', usuarioAtual?.urlAvatar ?? '');

    if (url === null) {
        return;
    }

    try {
        preencherTela(await AcaiApi.atualizarUsuarioAtual({ urlAvatar: url.trim() || null }));
    } catch (erro) {
        alert(erro.message);
    }
});

document.getElementById('botao-remover-foto')?.addEventListener('click', async () => {
    try {
        preencherTela(await AcaiApi.atualizarUsuarioAtual({ urlAvatar: null }));
    } catch (erro) {
        alert(erro.message);
    }
});

document.getElementById('botao-excluir-conta')?.addEventListener('click', async () => {
    const confirmado = confirm('Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.');

    if (!confirmado) {
        return;
    }

    try {
        await AcaiApi.excluirUsuarioAtual();
        window.location.href = 'index_criar_conta.html';
    } catch (erro) {
        alert(erro.message);
    }
});

carregarPerfil();
