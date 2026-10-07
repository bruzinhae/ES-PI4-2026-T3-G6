/**
 * Criar conta — validação mock e redirecionamento.
 */

(function () {
    const formulario = document.getElementById('formulario-criar-conta');
    const campoNome = document.getElementById('campo-nome');
    const campoEmail = document.getElementById('campo-email');
    const campoSenha = document.getElementById('campo-senha');
    const campoTermos = document.getElementById('campo-termos');
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

    [campoNome, campoEmail, campoSenha].forEach((campo) => {
        campo?.addEventListener('input', () => {
            limparErro(campo.closest('.controle-campo'));
        });
    });

    formulario?.addEventListener('submit', (evento) => {
        evento.preventDefault();

        const nome = campoNome.value.trim();
        const email = campoEmail.value.trim();
        const senha = campoSenha.value;

        const cNome = campoNome.closest('.controle-campo');
        const cEmail = campoEmail.closest('.controle-campo');
        const cSenha = campoSenha.closest('.controle-campo');

        [cNome, cEmail, cSenha].forEach(limparErro);

        let valido = true;

        if (nome.length < 3) {
            marcarErro(cNome, 'Informe seu nome completo.');
            valido = false;
        }

        if (!email) {
            marcarErro(cEmail, 'Informe seu e-mail.');
            valido = false;
        } else if (!emailValido(email)) {
            marcarErro(cEmail, 'Digite um e-mail válido.');
            valido = false;
        }

        if (senha.length < 8) {
            marcarErro(cSenha, 'A senha deve ter ao menos 8 caracteres.');
            valido = false;
        }

        if (!campoTermos.checked) {
            valido = false;
            campoTermos.focus();
            alert('É necessário aceitar os Termos de Serviço e a Política de Privacidade.');
        }

        if (!valido) {
            return;
        }

        localStorage.setItem(
            'acaistudy-usuario',
            JSON.stringify({ nome, email })
        );

        window.location.href = 'index_calendario.html';
    });

    botaoGoogle?.addEventListener('click', () => {
        window.location.href = 'index_calendario.html';
    });
})();
