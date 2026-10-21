/**
 * Criar nova senha — força, requisitos e validação mock.
 */

(function () {
    const formulario = document.getElementById('formulario-nova-senha');
    const campoSenha = document.getElementById('campo-senha');
    const campoConfirma = document.getElementById('campo-confirma');
    const textoForca = document.getElementById('texto-forca');
    const barras = document.querySelectorAll('.barras-forca span');
    const forcaBox = document.getElementById('forca-senha');

    const ICONE_OLHO = 'assets/icons/login/olho.svg';
    const ICONE_OLHO_OCULTO = 'assets/icons/login/olho-oculto.svg';
    const ICONE_CHECK = 'assets/icons/login/check.svg';
    const ICONE_VAZIO = 'assets/icons/login/check-vazio.svg';

    function temTamanho(senha) {
        return senha.length >= 8;
    }

    function temComplexidade(senha) {
        return /[a-z]/.test(senha) && /[A-Z]/.test(senha) && /\d/.test(senha);
    }

    function senhasCoincidem(senha, confirma) {
        return senha.length > 0 && senha === confirma;
    }

    function nivelForca(senha) {
        if (!senha) {
            return { nivel: 0, rotulo: '—', classe: '' };
        }

        let pontos = 0;

        if (senha.length >= 8) pontos += 1;
        if (senha.length >= 12) pontos += 1;
        if (/[a-z]/.test(senha) && /[A-Z]/.test(senha)) pontos += 1;
        if (/\d/.test(senha)) pontos += 1;
        if (/[^A-Za-z0-9]/.test(senha)) pontos += 1;

        if (pontos <= 2) {
            return { nivel: 1, rotulo: 'Fraca', classe: 'fraca' };
        }

        if (pontos <= 3) {
            return { nivel: 2, rotulo: 'Média', classe: 'media' };
        }

        return { nivel: 3, rotulo: 'Forte', classe: 'forte' };
    }

    function atualizarForca(senha) {
        const { nivel, rotulo, classe } = nivelForca(senha);

        if (textoForca) {
            textoForca.textContent = rotulo;
        }

        forcaBox?.classList.remove('fraca', 'media', 'forte');

        if (classe) {
            forcaBox?.classList.add(classe);
        }

        barras.forEach((barra, index) => {
            barra.classList.toggle('ativa', index < nivel);
        });
    }

    function atualizarRegra(nome, ok) {
        const item = document.querySelector(`[data-regra="${nome}"]`);

        if (!item) {
            return;
        }

        item.classList.toggle('ok', ok);

        const icone = item.querySelector('[data-icone-check]');

        if (icone) {
            icone.src = ok ? ICONE_CHECK : ICONE_VAZIO;
        }
    }

    function atualizarRequisitos() {
        const senha = campoSenha.value;
        const confirma = campoConfirma.value;

        atualizarRegra('tamanho', temTamanho(senha));
        atualizarRegra('complexidade', temComplexidade(senha));
        atualizarRegra('coincide', senhasCoincidem(senha, confirma));
        atualizarForca(senha);
    }

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

    document.querySelectorAll('[data-toggle-senha]').forEach((botao) => {
        botao.addEventListener('click', () => {
            const id = botao.getAttribute('data-toggle-senha');
            const campo = document.getElementById(id);

            if (!campo) {
                return;
            }

            const visivel = campo.type === 'text';
            const icone = botao.querySelector('[data-icone-olho]');

            campo.type = visivel ? 'password' : 'text';
            botao.setAttribute('aria-pressed', String(!visivel));
            botao.setAttribute(
                'aria-label',
                visivel ? 'Mostrar senha' : 'Ocultar senha'
            );

            if (icone) {
                icone.src = visivel ? ICONE_OLHO : ICONE_OLHO_OCULTO;
            }
        });
    });

    campoSenha?.addEventListener('input', () => {
        limparErro(campoSenha.closest('.controle-campo'));
        atualizarRequisitos();
    });

    campoConfirma?.addEventListener('input', () => {
        limparErro(campoConfirma.closest('.controle-campo'));
        atualizarRequisitos();
    });

    formulario?.addEventListener('submit', (evento) => {
        evento.preventDefault();

        const senha = campoSenha.value;
        const confirma = campoConfirma.value;
        const controleSenha = campoSenha.closest('.controle-campo');
        const controleConfirma = campoConfirma.closest('.controle-campo');
        let valido = true;

        limparErro(controleSenha);
        limparErro(controleConfirma);

        if (!temTamanho(senha) || !temComplexidade(senha)) {
            marcarErro(controleSenha, 'A senha não atende aos requisitos.');
            valido = false;
        }

        if (!senhasCoincidem(senha, confirma)) {
            marcarErro(controleConfirma, 'As senhas não coincidem.');
            valido = false;
        }

        if (!valido) {
            return;
        }

        window.location.href = 'index_login.html';
    });

    atualizarRequisitos();
})();
