/**
 * Menus do header de onboarding (ajuda e perfil).
 */
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
        alert(`Não foi possível concluir o onboarding: ${erro.message}`);

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

// Quem já concluiu o onboarding (flag no banco) não vê mais estas telas: vai para a grade.
if (window.AcaiApi) {
    AcaiApi.onboardingConcluido().then((concluido) => {
        if (concluido) {
            window.location.replace('index_calendario.html');
        }
    });
}
