/**
 * Recuperação de senha — pede o link por e-mail se a conta existir.
 */

(function () {
    const formulario = document.getElementById('formulario-recuperar');
    const campoEmail = document.getElementById('campo-email');
    const feedback = document.getElementById('feedback-recuperar');

    function limparErro(controle) {
        controle?.classList.remove('invalido');

        const msg = controle?.parentElement?.querySelector('.mensagem-erro');

        if (msg) {
            msg.remove();
        }
    }

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

    function emailValido(valor) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
    }

    campoEmail?.addEventListener('input', () => {
        limparErro(campoEmail.closest('.controle-campo'));

        if (feedback) {
            feedback.hidden = true;
        }
    });

    formulario?.addEventListener('submit', async (evento) => {
        evento.preventDefault();

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
        botaoEnviar.disabled = true;

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

