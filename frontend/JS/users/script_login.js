// Bruna Barbour Fernandes RA: 23007950
/**
 * Tela de login — toggle de senha e envio do formulário (confere e-mail e senha na API).
 *
 * Fluxo: valida os campos no navegador (para dar retorno rápido), chama AcaiApi.entrar
 * (JS/users/api.js), que guarda o token da sessão, e leva o usuário para a página inicial.
 * Também cuida do "Lembrar de mim" e do aviso de senha redefinida.
 */

// Função que se chama sozinha (IIFE): as variáveis ficam presas aqui dentro e não
// se misturam com as de outros scripts da página.
(function () {
    // Elementos da página usados pelo script.
    const formulario = document.getElementById('formulario-login');
    const campoEmail = document.getElementById('campo-email');
    const campoSenha = document.getElementById('campo-senha');
    const botaoVisibilidade = document.getElementById('botao-visibilidade');

    // Ícones do botão de mostrar/ocultar a senha.
    const ICONE_OLHO = 'assets/icons/login/olho.svg';
    const ICONE_OLHO_OCULTO = 'assets/icons/login/olho-oculto.svg';

    // Tira o destaque vermelho do campo e apaga a mensagem de erro abaixo dele.
    function limparErro(controle) {
        controle?.classList.remove('invalido');

        const msg = controle?.parentElement?.querySelector('.mensagem-erro');

        if (msg) {
            msg.remove();
        }
    }

    // Destaca o campo como inválido e escreve a mensagem de erro logo abaixo.
    function marcarErro(controle, texto) {
        if (!controle) {
            return;
        }

        limparErro(controle); // evita duas mensagens no mesmo campo
        controle.classList.add('invalido');

        const msg = document.createElement('p');
        msg.className = 'mensagem-erro';
        msg.textContent = texto; // textContent (e não innerHTML) para não interpretar HTML
        controle.parentElement?.appendChild(msg);
    }

    // Formato básico de e-mail: algo@algo.algo, sem espaços.
    function emailValido(valor) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
    }

    // Mostrar/ocultar senha: alterna o tipo do input entre "password" e "text".
    botaoVisibilidade?.addEventListener('click', () => {
        const visivel = campoSenha.type === 'text';
        const icone = botaoVisibilidade.querySelector('[data-icone-olho]');

        campoSenha.type = visivel ? 'password' : 'text';
        // Atributos ARIA avisam leitores de tela sobre o estado do botão.
        botaoVisibilidade.setAttribute('aria-pressed', String(!visivel));
        botaoVisibilidade.setAttribute('aria-label', visivel ? 'Mostrar senha' : 'Ocultar senha');

        if (icone) {
            icone.src = visivel ? ICONE_OLHO : ICONE_OLHO_OCULTO;
        }
    });

    // Ao digitar de novo, o erro daquele campo some.
    campoEmail?.addEventListener('input', () => {
        limparErro(campoEmail.closest('.controle-campo'));
    });

    campoSenha?.addEventListener('input', () => {
        limparErro(campoSenha.closest('.controle-campo'));
    });

    // Envio do formulário.
    formulario?.addEventListener('submit', async (evento) => {
        // Impede o envio padrão (que recarregaria a página); o envio é feito pelo fetch da API.
        evento.preventDefault();

        const email = campoEmail.value.trim();
        const senha = campoSenha.value; // senha não leva trim: espaço pode fazer parte dela
        const controleEmail = campoEmail.closest('.controle-campo');
        const controleSenha = campoSenha.closest('.controle-campo');
        let valido = true;

        limparErro(controleEmail);
        limparErro(controleSenha);

        // Validações locais. Todas rodam para mostrar todos os erros de uma vez.
        if (!email) {
            marcarErro(controleEmail, 'Informe seu e-mail.');
            valido = false;
        } else if (!emailValido(email)) {
            marcarErro(controleEmail, 'Digite um e-mail válido.');
            valido = false;
        }

        if (!senha) {
            marcarErro(controleSenha, 'Informe sua senha.');
            valido = false;
        } else if (senha.length < 6) {
            marcarErro(controleSenha, 'A senha deve ter ao menos 6 caracteres.');
            valido = false;
        }

        if (!valido) {
            return;
        }

        const botaoEntrar = formulario.querySelector('[type="submit"]');

        // Desliga o botão enquanto espera a API, para não enviar duas vezes.
        botaoEntrar.disabled = true;

        try {
            await AcaiApi.entrar(email, senha);
        } catch (erro) {
            // A API responde igual para e-mail sem conta e senha errada (não revela quais
            // e-mails existem), então qualquer erro aparece no campo de senha.
            marcarErro(controleSenha, erro.message);
            return;
        } finally {
            // Roda dando certo ou errado: o botão volta a funcionar.
            botaoEntrar.disabled = false;
        }

        // "Lembrar de mim": guarda só o e-mail (nunca a senha) no navegador.
        if (document.getElementById('campo-lembrar')?.checked) {
            localStorage.setItem('acaistudy-lembrar-email', email);
        } else {
            localStorage.removeItem('acaistudy-lembrar-email');
        }

        // A página inicial depende da conta (ex.: onboarding ainda não concluído).
        window.location.href = await AcaiApi.paginaInicial();
    });

    // Chegou aqui vindo da tela de nova senha (?senha=redefinida)? Mostra o aviso de sucesso.
    if (new URLSearchParams(window.location.search).get('senha') === 'redefinida') {
        const feedbackSenha = document.getElementById('feedback-senha');

        if (feedbackSenha) {
            feedbackSenha.hidden = false;
        }
    }

    // Se o e-mail foi lembrado num login anterior, já preenche o campo e marca a caixa.
    const emailSalvo = localStorage.getItem('acaistudy-lembrar-email');

    if (emailSalvo && campoEmail) {
        campoEmail.value = emailSalvo;

        const lembrar = document.getElementById('campo-lembrar');

        if (lembrar) {
            lembrar.checked = true;
        }
    }
})();
