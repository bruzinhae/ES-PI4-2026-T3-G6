// Bruna Barbour Fernandes RA: 23007950
/**
 * Criar conta — validação e criação do usuário via API (JS/users/api.js).
 *
 * É o CREATE do CRUD de usuários no frontend: valida nome, e-mail, senha e o aceite dos
 * termos, chama POST /api/usuarios (que já devolve a sessão aberta) e segue para o
 * onboarding. As mesmas regras são conferidas de novo no backend.
 */

// IIFE: mantém as variáveis deste script isoladas das outras da página.
(function () {
    // Elementos do formulário.
    const formulario = document.getElementById('formulario-criar-conta');
    const campoNome = document.getElementById('campo-nome');
    const campoEmail = document.getElementById('campo-email');
    const campoSenha = document.getElementById('campo-senha');
    const campoTermos = document.getElementById('campo-termos');
    const botaoVisibilidade = document.getElementById('botao-visibilidade');

    // Ícones do botão de mostrar/ocultar a senha.
    const ICONE_OLHO = 'assets/icons/login/olho.svg';
    const ICONE_OLHO_OCULTO = 'assets/icons/login/olho-oculto.svg';

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

    // Mostrar/ocultar senha: troca o tipo do input e atualiza ícone e atributos de acessibilidade.
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

    // Ao digitar num campo, o erro dele some.
    [campoNome, campoEmail, campoSenha].forEach((campo) => {
        campo?.addEventListener('input', () => {
            limparErro(campo.closest('.controle-campo'));
        });
    });

    // Envio do formulário de cadastro.
    formulario?.addEventListener('submit', async (evento) => {
        evento.preventDefault(); // o envio é feito pela API, sem recarregar a página

        const nome = campoNome.value.trim();
        const email = campoEmail.value.trim();
        const senha = campoSenha.value;

        // "Controles" = caixas em volta de cada input, onde o erro é desenhado.
        const cNome = campoNome.closest('.controle-campo');
        const cEmail = campoEmail.closest('.controle-campo');
        const cSenha = campoSenha.closest('.controle-campo');

        [cNome, cEmail, cSenha].forEach(limparErro);

        let valido = true;

        // Mesmas regras do backend (Usuario.js e validarSenha): nome com 3+ letras,
        // e-mail válido, senha com 8+ caracteres e termos aceitos.
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

        // O checkbox não tem lugar para mensagem embaixo, então o aviso sai num toast.
        if (!campoTermos.checked) {
            valido = false;
            campoTermos.focus();
            AcaiAvisos.mostrar('É necessário aceitar os Termos de Serviço e a Política de Privacidade.');
        }

        if (!valido) {
            return;
        }

        const botaoCriar = formulario.querySelector('[type="submit"]');

        // Evita cadastro duplicado por clique duplo.
        botaoCriar.disabled = true;

        try {
            const resposta = await AcaiApi.criarUsuario({ nome, email, senha, aceitouTermos: true });
            // Guarda o aviso para a próxima página mostrar (sessionStorage some ao fechar a aba).
            sessionStorage.setItem(
                'acaistudy-aviso-confirmacao',
                resposta.confirmacaoEnviada
                    ? 'Enviamos um e-mail para confirmar sua conta. Abra o link para validar o endereço.'
                    : 'Sua conta foi criada, mas o e-mail de confirmação não saiu. Peça o reenvio no perfil.',
            );
        } catch (erro) {
            // 409 = e-mail já cadastrado; demais erros aparecem no campo de senha.
            marcarErro(erro.status === 409 ? cEmail : cSenha, erro.message);
            return;
        } finally {
            botaoCriar.disabled = false;
        }

        // Conta criada e sessão aberta: começa o onboarding pelo primeiro passo.
        window.location.href = 'index_onboarding_semestre.html';
    });
})();
