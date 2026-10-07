/**
 * Tela de login — toggle de senha e envio do formulário (mock).
 */

(function () {
    const formulario = document.getElementById('formulario-login');
    const campoEmail = document.getElementById('campo-email');
    const campoSenha = document.getElementById('campo-senha');
    const botaoVisibilidade = document.getElementById('botao-visibilidade');
    const botaoGoogle = document.getElementById('botao-google');

    const ICONE_OLHO = 'assets/icons/login/olho.svg';
    const ICONE_OLHO_OCULTO = 'assets/icons/login/olho-oculto.svg';

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

    botaoVisibilidade?.addEventListener('click', () => {
        const visivel = campoSenha.type === 'text';
        const icone = botaoVisibilidade.querySelector('[data-icone-olho]');

        campoSenha.type = visivel ? 'password' : 'text';
        botaoVisibilidade.setAttribute('aria-pressed', String(!visivel));
        botaoVisibilidade.setAttribute('aria-label', visivel ? 'Mostrar senha' : 'Ocultar senha');

        if (icone) {
            icone.src = visivel ? ICONE_OLHO : ICONE_OLHO_OCULTO;
        }
    });

    campoEmail?.addEventListener('input', () => {
        limparErro(campoEmail.closest('.controle-campo'));
    });

    campoSenha?.addEventListener('input', () => {
        limparErro(campoSenha.closest('.controle-campo'));
    });

    formulario?.addEventListener('submit', (evento) => {
        evento.preventDefault();

        const email = campoEmail.value.trim();
        const senha = campoSenha.value;
        const controleEmail = campoEmail.closest('.controle-campo');
        const controleSenha = campoSenha.closest('.controle-campo');
        let valido = true;

        limparErro(controleEmail);
        limparErro(controleSenha);

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

        if (document.getElementById('campo-lembrar')?.checked) {
            localStorage.setItem('acaistudy-lembrar-email', email);
        } else {
            localStorage.removeItem('acaistudy-lembrar-email');
        }

        window.location.href = 'index_calendario.html';
    });

    botaoGoogle?.addEventListener('click', () => {
        window.location.href = 'index_calendario.html';
    });

    const emailSalvo = localStorage.getItem('acaistudy-lembrar-email');

    if (emailSalvo && campoEmail) {
        campoEmail.value = emailSalvo;

        const lembrar = document.getElementById('campo-lembrar');

        if (lembrar) {
            lembrar.checked = true;
        }
    }
})();
