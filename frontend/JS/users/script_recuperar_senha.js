/**
 * Recuperação de senha — validação e feedback mock.
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

    formulario?.addEventListener('submit', (evento) => {
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

        if (feedback) {
            feedback.hidden = false;
        }

        // Fluxo mock: após “enviar” o e-mail, segue para criar nova senha
        window.setTimeout(() => {
            window.location.href = 'index_nova_senha.html';
        }, 1200);
    });
})();

