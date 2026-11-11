/**
 * Confirmação de conta — o token vem do e-mail (?token=...) e só vale uma vez.
 */

(function () {
    const token = new URLSearchParams(window.location.search).get('token');
    const botao = document.getElementById('botao-confirmar');
    const aviso = document.getElementById('aviso-link');
    const textoAviso = document.getElementById('texto-aviso-link');
    const texto = document.getElementById('texto-confirmar');

    function mostrarAviso(mensagem) {
        if (textoAviso) {
            textoAviso.textContent = mensagem;
        }

        if (aviso) {
            aviso.hidden = false;
        }

        if (botao) {
            botao.style.display = 'none';
        }
    }

    async function preparar() {
        if (!token) {
            mostrarAviso('Este link de confirmação é inválido. Peça outro no perfil.');
            return;
        }

        try {
            await AcaiApi.conferirConfirmacaoEmail(token);

            if (botao) {
                botao.disabled = false;
            }
        } catch (erro) {
            mostrarAviso(erro.message);
        }
    }

    let confirmado = false;

    botao?.addEventListener('click', async () => {
        if (confirmado) {
            window.location.href = AcaiApi.temUsuarioAtual()
                ? await AcaiApi.paginaInicial()
                : 'index_login.html';
            return;
        }

        botao.disabled = true;

        try {
            await AcaiApi.confirmarEmail(token);
        } catch (erro) {
            botao.disabled = false;
            mostrarAviso(erro.message);
            return;
        }

        confirmado = true;

        if (texto) {
            texto.textContent = 'Conta confirmada. O perfil agora marca este e-mail como verificado.';
        }

        botao.querySelector('span').textContent = 'Continuar';
        botao.disabled = false;
    });

    preparar();
})();
