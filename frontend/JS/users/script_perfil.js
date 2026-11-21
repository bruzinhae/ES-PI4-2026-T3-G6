// Bruna Barbour Fernandes RA: 23007950
/**
 * Perfil do usuário — carrega e salva os dados via API (JS/users/api.js).
 *
 * É a tela do CRUD de usuários depois do cadastro:
 *   READ   → carregarPerfil busca a conta logada e preenche os campos;
 *   UPDATE → Salvar envia o formulário (PATCH), além da troca de foto e de senha;
 *   DELETE → Excluir conta apaga a conta e todos os dados dela.
 * Também mostra a parte de segurança (sessões ativas, última troca de senha) e
 * permite exportar os dados em JSON.
 */

// Desenha o cabeçalho e o menu lateral (JS/componentes/layout.js). Nenhum item do menu
// fica marcado, porque o perfil não é uma das páginas do menu.
renderLayout({
    paginaAtiva: '',
});

// Imagem usada quando o usuário não tem foto.
const FOTO_PADRAO = 'assets/icons/avatar-padrao.svg';
// Quantas horas de meta semanal enchem a barra de progresso por completo.
const HORAS_BARRA_CHEIA = 40;
// Campos que a API espera como número (os inputs sempre devolvem texto).
const CAMPOS_NUMERICOS = ['semestre', 'metaSemanalHoras'];

// Elementos da tela. `campos` pega todos os inputs/selects do formulário de dados;
// o atributo name de cada um é o nome do campo na API (nome, email, curso...).
const botaoSalvar = document.getElementById('botao-salvar');
const botaoDescartar = document.getElementById('botao-descartar');
const campos = document.querySelectorAll('.grade-campos input, .grade-campos select');
const campoMeta = document.querySelector('[name="metaSemanalHoras"]');
const trilhaMeta = document.getElementById('trilha-meta-preenchida');

// Última versão do usuário vinda da API. Serve para o botão Descartar voltar a ela.
let usuarioAtual = null;

// Monta o texto do resumo, ex.: "Engenharia de Software • 4º Semestre Matutino".
function descreverCurso(usuario) {
    const partes = [];

    if (usuario.curso) {
        partes.push(usuario.curso);
    }

    if (usuario.semestre) {
        // Primeira letra do turno em maiúscula (matutino → Matutino).
        const turno = usuario.turno ? ` ${usuario.turno[0].toUpperCase()}${usuario.turno.slice(1)}` : '';
        partes.push(`${usuario.semestre}º Semestre${turno}`);
    }

    return partes.join(' • ') || 'Complete seus dados acadêmicos';
}

// Ajusta a largura da barra da meta semanal (no máximo 100%).
function atualizarTrilhaMeta() {
    const horas = Number(campoMeta.value) || 0;
    trilhaMeta.style.width = `${Math.min(100, (horas / HORAS_BARRA_CHEIA) * 100)}%`;
}

// Coloca os dados do usuário na tela: campos do formulário, foto, resumo e selos.
function preencherTela(usuario) {
    usuarioAtual = usuario;

    // Cada campo recebe o valor da propriedade com o mesmo nome; null vira campo vazio.
    campos.forEach((campo) => {
        campo.value = usuario[campo.name] ?? '';
    });

    const foto = document.getElementById('foto-perfil');
    foto.src = usuario.urlAvatar || FOTO_PADRAO;
    foto.alt = `Foto de ${usuario.nome}`;

    // A foto também aparece no cabeçalho do layout; atualiza lá para ficar igual.
    document.querySelectorAll('.botao-perfil img, .painel-perfil-cabecalho img').forEach((imagem) => {
        imagem.src = usuario.urlAvatar || FOTO_PADRAO;
    });

    document.getElementById('resumo-nome').textContent = usuario.nome;
    document.getElementById('resumo-curso').textContent = descreverCurso(usuario);
    // E-mail confirmado: mostra o selo. Não confirmado: mostra a nota com o botão de reenviar.
    document.getElementById('selo-verificado').hidden = !usuario.emailVerificado;
    document.getElementById('nota-confirmacao').hidden = Boolean(usuario.emailVerificado);
    // "Remover foto" só faz sentido se houver foto.
    document.getElementById('botao-remover-foto').hidden = !usuario.urlAvatar;

    atualizarTrilhaMeta();
}

// Lê o formulário e monta o objeto que vai para o PATCH.
// Campo vazio vira null (= "não preenchido"); semestre e meta viram número.
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

// Troca o texto do botão Salvar por um retorno ("Salvo") por 1,4 s e depois o restaura.
function mostrarRetornoSalvar(texto) {
    const rotulo = botaoSalvar.querySelector('span');
    const textoOriginal = rotulo.textContent;

    rotulo.textContent = texto;

    window.setTimeout(() => {
        rotulo.textContent = textoOriginal;
        botaoSalvar.disabled = false;
    }, 1400);
}

// READ — busca a conta logada na API e preenche a tela.
async function carregarPerfil() {
    // Sem usuário salvo neste navegador, não há perfil para mostrar.
    if (!AcaiApi.temUsuarioAtual()) {
        window.location.href = 'index_criar_conta.html';
        return;
    }

    try {
        preencherTela(await AcaiApi.obterUsuarioAtual());
    } catch (erro) {
        // 404/400 = a conta salva no navegador não existe mais: limpa e manda para o cadastro.
        if (erro.status === 404 || erro.status === 400) {
            AcaiApi.esquecerUsuario();
            window.location.href = 'index_criar_conta.html';
            return;
        }

        AcaiAvisos.mostrar(erro.message);
    }
}

// A barra da meta acompanha o valor enquanto o usuário digita.
campoMeta?.addEventListener('input', atualizarTrilhaMeta);

// Descartar: volta os campos para o que está salvo na API.
botaoDescartar?.addEventListener('click', () => {
    if (usuarioAtual) {
        preencherTela(usuarioAtual);
    }
});

// UPDATE — salva os dados do perfil.
botaoSalvar?.addEventListener('click', async () => {
    botaoSalvar.disabled = true; // volta a ficar ativo dentro de mostrarRetornoSalvar

    try {
        const usuario = await AcaiApi.atualizarUsuarioAtual(lerFormulario());
        preencherTela(usuario);
        mostrarRetornoSalvar('Salvo');
        // confirmacaoEnviada só vem quando o e-mail foi trocado.
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

// ---- Foto de perfil ----

// Input de arquivo escondido e o texto de erro que fica embaixo da foto.
const arquivoFoto = document.getElementById('arquivo-foto');
const erroFoto = document.getElementById('erro-foto');

// Mostra o erro da foto; texto vazio esconde a mensagem.
function mostrarErroFoto(texto) {
    if (!erroFoto) {
        return;
    }

    erroFoto.textContent = texto;
    erroFoto.hidden = !texto;
}

// O botão visível só "clica" no input de arquivo escondido, que abre o seletor do sistema.
document.getElementById('botao-alterar-foto')?.addEventListener('click', () => {
    arquivoFoto?.click();
});

// Arquivo escolhido: valida no navegador e envia para a API.
arquivoFoto?.addEventListener('change', async () => {
    const arquivo = arquivoFoto.files?.[0];
    // Limpa o input para que escolher o mesmo arquivo de novo dispare o change outra vez.
    arquivoFoto.value = '';

    if (!arquivo) {
        return;
    }

    mostrarErroFoto('');

    // Mesmas regras do backend (avatarArquivo.js): PNG ou JPG, até 5 MB.
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

// Remove a foto (a API volta urlAvatar para null e a tela mostra a imagem padrão).
document.getElementById('botao-remover-foto')?.addEventListener('click', async () => {
    try {
        preencherTela(await AcaiApi.removerFotoAtual());
        mostrarErroFoto('');
    } catch (erro) {
        mostrarErroFoto(erro.message);
    }
});

// DELETE — exclui a conta depois de pedir confirmação (a ação não tem volta).
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

// Pede um novo e-mail de confirmação da conta.
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

// ---- Segurança e uso ----

// Texto da última troca de senha ("hoje", "ontem", "há N dias").
// 86400000 = milissegundos em um dia.
function textoQuando(data) {
    if (!data) return 'Ainda não houve troca de senha nesta conta.';
    const dias = Math.floor((Date.now() - new Date(data).getTime()) / 86400000);
    if (dias <= 0) return 'Senha alterada hoje.';
    if (dias === 1) return 'Senha alterada ontem.';
    return `Senha alterada há ${dias} dias.`;
}

// Preenche o bloco de segurança (senha e sessões) e o de uso (disciplinas e planos da IA).
// Cada parte tem seu próprio try, para que uma falha não apague a outra.
async function carregarSeguranca(usuario) {
    const textoSenha = document.getElementById('texto-senha');
    if (textoSenha) textoSenha.textContent = textoQuando(usuario.senhaAlteradaEm);
    try {
        const sessoes = await AcaiApi.listarSessoesAuth();
        const atual = sessoes.find((item) => item.atual);
        const outras = sessoes.length - (atual ? 1 : 0);
        // Encurta o user-agent do navegador para caber na linha.
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
        // Conta só os planos da IA criados no mês atual.
        const mes = new Date().getMonth();
        const doMes = planos.filter((plano) => new Date(plano.criadoEm).getMonth() === mes).length;
        document.getElementById('uso-ia').textContent = `${doMes} neste mês`;
    } catch {
        document.getElementById('uso-disciplinas').textContent = '—';
    }
}

// Envolve o preencherTela original: toda vez que a tela é preenchida, a parte de
// segurança também é recarregada. Assim não é preciso lembrar de chamar as duas.
const originalPreencher = preencherTela;
preencherTela = function preencherComSeguranca(usuario) {
    originalPreencher(usuario);
    carregarSeguranca(usuario);
};

// ---- Troca de senha (com o usuário logado) ----

// O formulário de senha fica escondido até clicar em "Alterar senha".
const formSenha = document.getElementById('form-senha');
document.getElementById('botao-alterar-senha')?.addEventListener('click', () => {
    formSenha.hidden = false;
});
document.getElementById('cancelar-senha')?.addEventListener('click', () => {
    formSenha.reset(); // limpa as senhas digitadas
    formSenha.hidden = true;
});
formSenha?.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const erro = document.getElementById('erro-senha');
    // FormData lê os campos pelo atributo name (senhaAtual, senha, confirmacao).
    const dados = new FormData(formSenha);
    if (dados.get('senha') !== dados.get('confirmacao')) {
        erro.hidden = false;
        erro.textContent = 'A confirmação não confere com a nova senha.';
        return;
    }
    try {
        // O backend confere a senha atual antes de trocar (ver usuarioService.atualizar).
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

// Encerra o login em todos os outros dispositivos (a sessão atual continua).
document.getElementById('botao-encerrar-sessoes')?.addEventListener('click', async () => {
    try {
        await AcaiApi.encerrarOutrasSessoes();
        if (usuarioAtual) await carregarSeguranca(usuarioAtual);
        AcaiAvisos.mostrar('As outras sessões foram encerradas.', 'ok');
    } catch (erro) {
        AcaiAvisos.mostrar(erro.message);
    }
});

// Exportar dados (LGPD): baixa um arquivo JSON com os dados da conta.
document.getElementById('botao-exportar-dados')?.addEventListener('click', async () => {
    try {
        const dados = await AcaiApi.exportarUsuario(usuarioAtual.id);
        // Cria um arquivo na memória, um link temporário para ele e "clica" no link para baixar.
        const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'acaistudy-dados.json';
        link.click();
        URL.revokeObjectURL(url); // libera a memória do arquivo temporário
    } catch (erro) {
        AcaiAvisos.mostrar(erro.message);
    }
});

// Ponto de partida: carrega o perfil assim que o script roda.
carregarPerfil();
