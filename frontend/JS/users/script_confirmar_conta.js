// Bruna Barbour Fernandes RA: 23007950
/**
 * Confirmação de conta — o token vem do e-mail (?token=...) e só vale uma vez.
 *
 * Ao abrir a página, o token é conferido na API (sem gastá-lo) e o botão só é liberado
 * se ele for válido. O clique no botão confirma de fato o e-mail; um segundo clique
 * leva o usuário adiante (app, se já estiver logado, ou login).
 */

// IIFE: isola as variáveis deste script.
(function () {
    // Token lido da URL do link enviado por e-mail.
    const token = new URLSearchParams(window.location.search).get('token');
    const botao = document.getElementById('botao-confirmar');
    const aviso = document.getElementById('aviso-link');
    const textoAviso = document.getElementById('texto-aviso-link');
    const texto = document.getElementById('texto-confirmar');

    // Mostra o aviso de link inválido/expirado e esconde o botão de confirmar.
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

    // Confere o token assim que a página abre.
    async function preparar() {
        if (!token) {
            mostrarAviso('Este link de confirmação é inválido. Peça outro no perfil.');
            return;
        }

        try {
            // Só verifica se o token existe e não venceu; ainda não confirma o e-mail.
            await AcaiApi.conferirConfirmacaoEmail(token);

            if (botao) {
                botao.disabled = false;
            }
        } catch (erro) {
            mostrarAviso(erro.message);
        }
    }

    // Guarda se a confirmação já foi feita: o mesmo botão vira "Continuar" depois.
    let confirmado = false;

    botao?.addEventListener('click', async () => {
        // Segundo clique: já confirmado, então só navega.
        if (confirmado) {
            window.location.href = AcaiApi.temUsuarioAtual()
                ? await AcaiApi.paginaInicial()
                : 'index_login.html';
            return;
        }

        botao.disabled = true; // evita enviar o token duas vezes

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
