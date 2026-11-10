/**
 * Onboarding compartilhado.
 * A ordem dos passos segue o que a conta usa na grade:
 * semestre e disciplinas, blocos fixos, metas e preferências da semana.
 * A Sofia não monta a grade: ela só analisa os relatórios.
 */
const AVATAR_PADRAO_ONBOARDING = 'assets/icons/avatar-padrao.svg';

function aplicarUsuarioNoCabecalho(usuario) {
    if (!usuario) {
        return;
    }

    const nome = usuario.nome || 'Sua conta';
    const curso = usuario.curso || 'Curso ainda não informado';
    const avatar = usuario.urlAvatar || AVATAR_PADRAO_ONBOARDING;

    document.querySelectorAll('.nome-usuario').forEach((elemento) => {
        elemento.textContent = nome;
    });

    document.querySelectorAll('.curso-usuario').forEach((elemento) => {
        elemento.textContent = curso;
    });

    document.querySelectorAll('.avatar-usuario').forEach((imagem) => {
        imagem.src = avatar;
        imagem.alt = '';
    });

    const botao = document.getElementById('botao-perfil');

    if (botao) {
        botao.setAttribute('aria-label', `Perfil e configurações — ${nome}`);
    }
}

function marcarPassoOnboarding(passo) {
    try {
        localStorage.setItem('acaistudy-onboarding-passo', passo);
    } catch {
        // Sem armazenamento local o login volta ao primeiro passo.
    }
}

async function carregarCabecalhoOnboarding() {
    try {
        const bruto = localStorage.getItem('acaistudy-usuario');

        if (bruto) {
            aplicarUsuarioNoCabecalho(JSON.parse(bruto));
        }
    } catch {
        // O próximo pedido à API preenche o cabeçalho.
    }

    try {
        const usuario = await AcaiApi.obterUsuarioAtual();
        aplicarUsuarioNoCabecalho(usuario);
        return usuario;
    } catch {
        return null;
    }
}

async function encerrarSessaoOnboarding() {
    await AcaiApi.sair();
    window.location.href = 'index_login.html';
}

async function salvarESair(botao) {
    if (botao) {
        botao.disabled = true;
    }

    try {
        if (typeof window.salvarPassoOnboarding === 'function') {
            await window.salvarPassoOnboarding();
        }

        await encerrarSessaoOnboarding();
    } catch (erro) {
        AcaiAvisos.mostrar(erro.message || 'Não foi possível salvar este passo.');

        if (botao) {
            botao.disabled = false;
        }
    }
}
function criarMenuSuspenso({ menuSeletor, botaoId, painelId, aoAbrir }) {
    const menu = document.querySelector(menuSeletor);
    const botao = document.getElementById(botaoId);
    const painel = document.getElementById(painelId);

    if (!menu || !botao || !painel) {
        return null;
    }

    function fechar() {
        painel.hidden = true;
        botao.setAttribute('aria-expanded', 'false');
        menu.classList.remove('aberto');
    }

    function abrir() {
        aoAbrir?.();
        painel.hidden = false;
        botao.setAttribute('aria-expanded', 'true');
        menu.classList.add('aberto');
    }

    botao.addEventListener('click', (evento) => {
        evento.stopPropagation();

        if (painel.hidden) {
            abrir();
        } else {
            fechar();
        }
    });

    painel.addEventListener('click', (evento) => {
        evento.stopPropagation();
    });

    document.addEventListener('click', fechar);

    document.addEventListener('keydown', (evento) => {
        if (evento.key === 'Escape') {
            fechar();
        }
    });

    return { abrir, fechar };
}

function inicializarMenusOnboarding() {
    const menus = {
        ajuda: null,
        perfil: null,
    };

    menus.ajuda = criarMenuSuspenso({
        menuSeletor: '.menu-ajuda',
        botaoId: 'botao-ajuda',
        painelId: 'painel-ajuda',
        aoAbrir: () => menus.perfil?.fechar(),
    });

    menus.perfil = criarMenuSuspenso({
        menuSeletor: '.menu-perfil',
        botaoId: 'botao-perfil',
        painelId: 'painel-perfil',
        aoAbrir: () => menus.ajuda?.fechar(),
    });

    document.getElementById('salvar-sair')?.addEventListener('click', (evento) => {
        salvarESair(evento.currentTarget);
    });

    document.querySelector('.botao-sair')?.addEventListener('click', (evento) => {
        evento.preventDefault();
        salvarESair(evento.currentTarget);
    });

    document.getElementById('pular-onboarding')?.addEventListener('click', async (evento) => {
        const botao = evento.currentTarget;
        botao.disabled = true;

        try {
            if (typeof window.salvarPassoOnboarding === 'function') {
                await window.salvarPassoOnboarding();
            }
        } catch (erro) {
            AcaiAvisos.mostrar(`Não foi possível salvar este passo: ${erro.message}`);
            botao.disabled = false;
            return;
        }

        finalizarOnboarding(botao);
    });

    carregarCabecalhoOnboarding();

    return menus;
}

// Encerra o onboarding (botões "Concluir" e "Pular"): grava onboardingConcluido no banco e
// segue para o calendário. Se a API falhar, avisa e fica na tela (o usuário pode tentar de novo).
async function finalizarOnboarding(botao) {
    if (botao) {
        botao.disabled = true;
    }

    try {
        await AcaiApi.atualizarUsuarioAtual({ onboardingConcluido: true });
    } catch (erro) {
        AcaiAvisos.mostrar(`Não foi possível concluir o onboarding: ${erro.message}`);

        if (botao) {
            botao.disabled = false;
        }

        return;
    }

    localStorage.setItem('acaistudy-onboarding-completo', '1');
    window.location.href = 'index_calendario.html';
}

window.inicializarMenusOnboarding = inicializarMenusOnboarding;
window.finalizarOnboarding = finalizarOnboarding;
window.marcarPassoOnboarding = marcarPassoOnboarding;
window.aplicarUsuarioNoCabecalho = aplicarUsuarioNoCabecalho;
window.carregarCabecalhoOnboarding = carregarCabecalhoOnboarding;

// Quem já concluiu o onboarding (flag no banco) não vê mais estas telas: vai para a grade.
if (window.AcaiApi) {
    AcaiApi.onboardingConcluido().then((concluido) => {
        if (concluido) {
            window.location.replace('index_calendario.html');
        }
    });
}
