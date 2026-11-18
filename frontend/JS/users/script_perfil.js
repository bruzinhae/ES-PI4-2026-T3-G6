/**
 * Perfil do usuário — carrega e salva os dados via API (JS/users/api.js).
 */

renderLayout({
    paginaAtiva: '',
});

const FOTO_PADRAO = 'assets/icons/avatar-padrao.svg';
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
    foto.src = usuario.urlAvatar || FOTO_PADRAO;
    foto.alt = `Foto de ${usuario.nome}`;

    document.querySelectorAll('.botao-perfil img, .painel-perfil-cabecalho img').forEach((imagem) => {
        imagem.src = usuario.urlAvatar || FOTO_PADRAO;
    });

    document.getElementById('resumo-nome').textContent = usuario.nome;
    document.getElementById('resumo-curso').textContent = descreverCurso(usuario);
    document.getElementById('selo-verificado').hidden = !usuario.emailVerificado;
    document.getElementById('nota-confirmacao').hidden = Boolean(usuario.emailVerificado);
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

        AcaiAvisos.mostrar(erro.message);
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
        const usuario = await AcaiApi.atualizarUsuarioAtual(lerFormulario());
        preencherTela(usuario);
        mostrarRetornoSalvar('Salvo');
        if (usuario.confirmacaoEnviada === true) {
            AcaiAvisos.mostrar('Enviamos um e-mail para confirmar o novo endereço.', 'ok');
        } else if (usuario.confirmacaoEnviada === false) {
            AcaiAvisos.mostrar('O e-mail mudou, mas a confirmação não saiu. Use Reenviar e-mail.');
        }
    } catch (erro) {
        botaoSalvar.disabled = false;
        AcaiAvisos.mostrar(erro.message);
    }
});

const arquivoFoto = document.getElementById('arquivo-foto');
const erroFoto = document.getElementById('erro-foto');

function mostrarErroFoto(texto) {
    if (!erroFoto) {
        return;
    }

    erroFoto.textContent = texto;
    erroFoto.hidden = !texto;
}

document.getElementById('botao-alterar-foto')?.addEventListener('click', () => {
    arquivoFoto?.click();
});

arquivoFoto?.addEventListener('change', async () => {
    const arquivo = arquivoFoto.files?.[0];
    arquivoFoto.value = '';

    if (!arquivo) {
        return;
    }

    mostrarErroFoto('');

    if (!['image/png', 'image/jpeg'].includes(arquivo.type)) {
        mostrarErroFoto('Envie uma imagem PNG ou JPG.');
        return;
    }

    if (arquivo.size > 5 * 1024 * 1024) {
        mostrarErroFoto('A foto deve ter no máximo 5 MB.');
        return;
    }

    try {
        preencherTela(await AcaiApi.enviarFotoAtual(arquivo));
        mostrarErroFoto('');
    } catch (erro) {
        mostrarErroFoto(erro.message);
    }
});

document.getElementById('botao-remover-foto')?.addEventListener('click', async () => {
    try {
        preencherTela(await AcaiApi.removerFotoAtual());
        mostrarErroFoto('');
    } catch (erro) {
        mostrarErroFoto(erro.message);
    }
});

document.getElementById('botao-excluir-conta')?.addEventListener('click', async () => {
    const confirmado = await AcaiAvisos.confirmar({
        titulo: 'Excluir conta',
        texto: 'A conta, as disciplinas, as tarefas, as metas, as sessões e as conversas saem de vez. Essa ação não pode ser desfeita.',
        confirmar: 'Excluir conta',
    });

    if (!confirmado) {
        return;
    }

    try {
        await AcaiApi.excluirUsuarioAtual();
        window.location.href = 'index_criar_conta.html';
    } catch (erro) {
        AcaiAvisos.mostrar(erro.message);
    }
});

document.getElementById('reenviar-confirmacao')?.addEventListener('click', async () => {
    const botao = document.getElementById('reenviar-confirmacao');
    botao.disabled = true;

    try {
        const resposta = await AcaiApi.reenviarConfirmacaoEmail();
        AcaiAvisos.mostrar(resposta.mensagem || 'Enviamos outro e-mail de confirmação.', resposta.confirmacaoEnviada ? 'ok' : 'aviso');
    } catch (erro) {
        AcaiAvisos.mostrar(erro.message);
    } finally {
        botao.disabled = false;
    }
});

function textoQuando(data) {
    if (!data) return 'Ainda não houve troca de senha nesta conta.';
    const dias = Math.floor((Date.now() - new Date(data).getTime()) / 86400000);
    if (dias <= 0) return 'Senha alterada hoje.';
    if (dias === 1) return 'Senha alterada ontem.';
    return `Senha alterada há ${dias} dias.`;
}

async function carregarSeguranca(usuario) {
    const textoSenha = document.getElementById('texto-senha');
    if (textoSenha) textoSenha.textContent = textoQuando(usuario.senhaAlteradaEm);
    try {
        const sessoes = await AcaiApi.listarSessoesAuth();
        const atual = sessoes.find((item) => item.atual);
        const outras = sessoes.length - (atual ? 1 : 0);
        const agente = atual?.agente ? atual.agente.split(') ')[0].slice(0, 80) : 'Este navegador';
        document.getElementById('texto-sessoes').textContent = outras
            ? `${agente} • sessão atual, mais ${outras} ${outras === 1 ? 'dispositivo' : 'dispositivos'}`
            : `${agente} • única sessão ativa`;
    } catch {
        document.getElementById('texto-sessoes').textContent = 'Não foi possível listar as sessões.';
    }
    try {
        const [disciplinas, planos] = await Promise.all([
            AcaiApi.listarDisciplinas({ situacao: 'ativa' }),
            AcaiApi.listarPlanosIa(),
        ]);
        document.getElementById('uso-disciplinas').textContent = String(disciplinas.length);
        const mes = new Date().getMonth();
        const doMes = planos.filter((plano) => new Date(plano.criadoEm).getMonth() === mes).length;
        document.getElementById('uso-ia').textContent = `${doMes} neste mês`;
    } catch {
        document.getElementById('uso-disciplinas').textContent = '—';
    }
}

const originalPreencher = preencherTela;
preencherTela = function preencherComSeguranca(usuario) {
    originalPreencher(usuario);
    carregarSeguranca(usuario);
};

const formSenha = document.getElementById('form-senha');
document.getElementById('botao-alterar-senha')?.addEventListener('click', () => {
    formSenha.hidden = false;
});
document.getElementById('cancelar-senha')?.addEventListener('click', () => {
    formSenha.reset();
    formSenha.hidden = true;
});
formSenha?.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const erro = document.getElementById('erro-senha');
    const dados = new FormData(formSenha);
    if (dados.get('senha') !== dados.get('confirmacao')) {
        erro.hidden = false;
        erro.textContent = 'A confirmação não confere com a nova senha.';
        return;
    }
    try {
        const usuario = await AcaiApi.atualizarUsuarioAtual({
            senhaAtual: dados.get('senhaAtual'),
            senha: dados.get('senha'),
        });
        preencherTela(usuario);
        formSenha.reset();
        formSenha.hidden = true;
        erro.hidden = true;
        AcaiAvisos.mostrar('Senha alterada. As outras sessões foram encerradas.', 'ok');
    } catch (falha) {
        erro.hidden = false;
        erro.textContent = falha.message;
    }
});

document.getElementById('botao-encerrar-sessoes')?.addEventListener('click', async () => {
    try {
        await AcaiApi.encerrarOutrasSessoes();
        if (usuarioAtual) await carregarSeguranca(usuarioAtual);
        AcaiAvisos.mostrar('As outras sessões foram encerradas.', 'ok');
    } catch (erro) {
        AcaiAvisos.mostrar(erro.message);
    }
});

document.getElementById('botao-exportar-dados')?.addEventListener('click', async () => {
    try {
        const dados = await AcaiApi.exportarUsuario(usuarioAtual.id);
        const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'acaistudy-dados.json';
        link.click();
        URL.revokeObjectURL(url);
    } catch (erro) {
        AcaiAvisos.mostrar(erro.message);
    }
});

carregarPerfil();
