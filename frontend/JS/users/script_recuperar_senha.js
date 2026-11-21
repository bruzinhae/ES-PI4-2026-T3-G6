// Bruna Barbour Fernandes RA: 23007950
/**
 * Recuperação de senha — pede o link por e-mail se a conta existir.
 *
 * Primeiro passo do "esqueci minha senha": o usuário informa o e-mail e a API envia um
 * link com token para a tela de nova senha (script_nova_senha.js).
 */

// IIFE: isola as variáveis deste script.
(function () {
    const formulario = document.getElementById('formulario-recuperar');
    const campoEmail = document.getElementById('campo-email');
    // Mensagem de "verifique seu e-mail", escondida até o envio dar certo.
    const feedback = document.getElementById('feedback-recuperar');

    // Tira o destaque de erro do campo e apaga a mensagem abaixo dele.
    function limparErro(controle) {
        controle?.classList.remove('invalido');

        const msg = controle?.parentElement?.querySelector('.mensagem-erro');

        if (msg) {
            msg.remove();
        }
    }

    // Marca o campo como inválido e mostra a mensagem logo abaixo.
    function marcarErro(controle, texto) {
        if (!controle) {
            return;
        }

        limparErro(controle);
        controle.classList.add('invalido');

        const msg = document.createElement('p');
        msg.className = 'mensagem-erro';
        msg.textContent = texto;
        controle.parentElement?.appendChild(msg);
    }

    // Formato básico de e-mail: algo@algo.algo, sem espaços.
    function emailValido(valor) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
    }

    // Ao digitar outro e-mail, some o erro e também o aviso de envio anterior.
    campoEmail?.addEventListener('input', () => {
        limparErro(campoEmail.closest('.controle-campo'));

        if (feedback) {
            feedback.hidden = true;
        }
    });

    formulario?.addEventListener('submit', async (evento) => {
        evento.preventDefault(); // envio pela API, sem recarregar a página

        const email = campoEmail.value.trim();
        const controleEmail = campoEmail.closest('.controle-campo');

        limparErro(controleEmail);

        if (!email) {
            marcarErro(controleEmail, 'Informe seu e-mail.');
            return;
        }

        if (!emailValido(email)) {
            marcarErro(controleEmail, 'Digite um e-mail válido.');
            return;
        }

        const botaoEnviar = formulario.querySelector('[type="submit"]');
        botaoEnviar.disabled = true; // evita pedir vários e-mails seguidos

        try {
            await AcaiApi.recuperarSenha(email);
        } catch (erro) {
            marcarErro(controleEmail, erro.message);
            return;
        } finally {
            botaoEnviar.disabled = false;
        }

        // A mensagem é a mesma exista a conta ou não (a tela não revela quais e-mails têm conta).
        if (feedback) {
            feedback.hidden = false;
        }
    });
})();
