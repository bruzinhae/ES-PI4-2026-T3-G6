// Bruna Barbour Fernandes RA: 23007950
/**
 * Criar nova senha — o token vem do link do e-mail (?token=...) e só vale uma vez.
 *
 * Segundo passo do "esqueci minha senha" (o primeiro é script_recuperar_senha.js).
 * Mostra em tempo real os requisitos e a força da senha, confere o token na API antes
 * de liberar o botão e, ao salvar, leva para o login com o aviso de senha redefinida.
 */

// IIFE: isola as variáveis deste script.
(function () {
    // Elementos do formulário e do medidor de força.
    const formulario = document.getElementById('formulario-nova-senha');
    const campoSenha = document.getElementById('campo-senha');
    const campoConfirma = document.getElementById('campo-confirma');
    const textoForca = document.getElementById('texto-forca');
    const barras = document.querySelectorAll('.barras-forca span');
    const forcaBox = document.getElementById('forca-senha');

    // Ícones: olho (mostrar/ocultar senha) e check (requisito cumprido ou não).
    const ICONE_OLHO = 'assets/icons/login/olho.svg';
    const ICONE_OLHO_OCULTO = 'assets/icons/login/olho-oculto.svg';
    const ICONE_CHECK = 'assets/icons/login/check.svg';
    const ICONE_VAZIO = 'assets/icons/login/check-vazio.svg';

    // ---- Regras da senha (as mesmas da lista de requisitos na tela) ----

    // Pelo menos 8 caracteres.
    function temTamanho(senha) {
        return senha.length >= 8;
    }

    // Tem letra minúscula, letra maiúscula e número.
    function temComplexidade(senha) {
        return /[a-z]/.test(senha) && /[A-Z]/.test(senha) && /\d/.test(senha);
    }

    // Os dois campos estão preenchidos e iguais.
    function senhasCoincidem(senha, confirma) {
        return senha.length > 0 && senha === confirma;
    }

    // Dá um ponto por critério cumprido e converte em Fraca/Média/Forte.
    // `nivel` é quantas barras acendem; `classe` define a cor no CSS.
    function nivelForca(senha) {
        if (!senha) {
            return { nivel: 0, rotulo: '—', classe: '' };
        }

        let pontos = 0;

        if (senha.length >= 8) pontos += 1;
        if (senha.length >= 12) pontos += 1;
        if (/[a-z]/.test(senha) && /[A-Z]/.test(senha)) pontos += 1;
        if (/\d/.test(senha)) pontos += 1;
        if (/[^A-Za-z0-9]/.test(senha)) pontos += 1; // símbolo (nem letra nem número)

        if (pontos <= 2) {
            return { nivel: 1, rotulo: 'Fraca', classe: 'fraca' };
        }

        if (pontos <= 3) {
            return { nivel: 2, rotulo: 'Média', classe: 'media' };
        }

        return { nivel: 3, rotulo: 'Forte', classe: 'forte' };
    }

    // Atualiza o texto, a cor e as barras do medidor de força.
    function atualizarForca(senha) {
        const { nivel, rotulo, classe } = nivelForca(senha);

        if (textoForca) {
            textoForca.textContent = rotulo;
        }

        forcaBox?.classList.remove('fraca', 'media', 'forte');

        if (classe) {
            forcaBox?.classList.add(classe);
        }

        // Acende as primeiras `nivel` barras e apaga as demais.
        barras.forEach((barra, index) => {
            barra.classList.toggle('ativa', index < nivel);
        });
    }

    // Marca um requisito da lista (data-regra="...") como cumprido ou não.
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

    // Recalcula toda a lista de requisitos e o medidor a cada tecla digitada.
    function atualizarRequisitos() {
        const senha = campoSenha.value;
        const confirma = campoConfirma.value;

        atualizarRegra('tamanho', temTamanho(senha));
        atualizarRegra('complexidade', temComplexidade(senha));
        atualizarRegra('coincide', senhasCoincidem(senha, confirma));
        atualizarForca(senha);
    }

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

    // Botões de mostrar/ocultar: cada um diz em data-toggle-senha o id do campo que controla.
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

    // A cada tecla: some o erro do campo e os requisitos são atualizados.
    campoSenha?.addEventListener('input', () => {
        limparErro(campoSenha.closest('.controle-campo'));
        atualizarRequisitos();
    });

    campoConfirma?.addEventListener('input', () => {
        limparErro(campoConfirma.closest('.controle-campo'));
        atualizarRequisitos();
    });

    // O token vem no link enviado por e-mail: index_nova_senha.html?token=...
    const token = new URLSearchParams(window.location.search).get('token');
    const botaoSalvar = document.getElementById('botao-salvar');
    const avisoLink = document.getElementById('aviso-link');
    const textoAvisoLink = document.getElementById('texto-aviso-link');

    // Link inválido ou vencido: mostra o aviso e trava todo o formulário.
    function mostrarLinkInvalido(texto) {
        if (textoAvisoLink) {
            textoAvisoLink.textContent = texto;
        }

        if (avisoLink) {
            avisoLink.hidden = false;
        }

        formulario?.querySelectorAll('input, button').forEach((campo) => {
            campo.disabled = true;
        });
    }

    // O botão começa travado até a API dizer que o token vale.
    if (botaoSalvar) {
        botaoSalvar.disabled = true;
    }

    // Confere o token ao abrir a página (sem gastá-lo).
    async function prepararLink() {
        if (!token) {
            mostrarLinkInvalido('Este link de recuperação é inválido. Peça um novo.');
            return;
        }

        try {
            await AcaiApi.conferirLinkRedefinicao(token);

            if (botaoSalvar) {
                botaoSalvar.disabled = false;
            }
        } catch (erro) {
            mostrarLinkInvalido(erro.message);
        }
    }

    prepararLink();

    // Envio da nova senha.
    formulario?.addEventListener('submit', async (evento) => {
        evento.preventDefault(); // envio pela API, sem recarregar a página

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

        if (!token) {
            marcarErro(controleSenha, 'Link inválido. Peça um novo link de recuperação.');
            return;
        }

        if (botaoSalvar) {
            botaoSalvar.disabled = true; // evita envio duplo
        }

        try {
            // Gasta o token e grava a senha nova (a API encerra as sessões antigas).
            await AcaiApi.redefinirSenha(token, senha);
        } catch (erro) {
            marcarErro(controleSenha, erro.message);
            return;
        } finally {
            if (botaoSalvar) {
                botaoSalvar.disabled = false;
            }
        }

        // O login lê ?senha=redefinida e mostra o aviso de sucesso.
        window.location.href = 'index_login.html?senha=redefinida';
    });

    // Estado inicial do medidor e da lista (tudo vazio).
    atualizarRequisitos();
})();
