/**
 * Confirmações e avisos no visual da plataforma.
 * AcaiAvisos.confirmar({ titulo, texto, confirmar, cancelar, perigo })
 * AcaiAvisos.mostrar(texto, 'erro' | 'ok' | 'aviso')
 */
const AcaiAvisos = (function () {
    let dialogo;
    let titulo;
    let texto;
    let botaoCancelar;
    let botaoConfirmar;
    let icone;
    let resolver;
    let focoAnterior;
    let pilha;

    function garantirDialogo() {
        if (dialogo) return;

        dialogo = document.createElement('div');
        dialogo.className = 'aviso-dialogo';
        dialogo.hidden = true;
        dialogo.innerHTML = `
            <section class="aviso-dialogo-cartao" role="alertdialog" aria-modal="true" aria-labelledby="aviso-dialogo-titulo">
                <div class="aviso-dialogo-icone" aria-hidden="true">!</div>
                <h2 id="aviso-dialogo-titulo"></h2>
                <p></p>
                <footer class="aviso-dialogo-acoes">
                    <button type="button" class="aviso-dialogo-cancelar">Cancelar</button>
                    <button type="button" class="aviso-dialogo-confirmar">Confirmar</button>
                </footer>
            </section>
        `;
        titulo = dialogo.querySelector('h2');
        texto = dialogo.querySelector('p');
        icone = dialogo.querySelector('.aviso-dialogo-icone');
        botaoCancelar = dialogo.querySelector('.aviso-dialogo-cancelar');
        botaoConfirmar = dialogo.querySelector('.aviso-dialogo-confirmar');

        botaoCancelar.addEventListener('click', () => fechar(false));
        botaoConfirmar.addEventListener('click', () => fechar(true));
        dialogo.addEventListener('click', (evento) => {
            if (evento.target === dialogo) fechar(false);
        });
        document.addEventListener('keydown', (evento) => {
            if (dialogo.hidden || evento.key !== 'Escape') return;
            evento.preventDefault();
            fechar(false);
        });
        document.body.appendChild(dialogo);
    }

    function fechar(confirmado) {
        if (!dialogo || dialogo.hidden) return;
        dialogo.hidden = true;
        document.body.classList.remove('aviso-dialogo-aberto');
        focoAnterior?.focus?.();
        const concluir = resolver;
        resolver = null;
        concluir?.(confirmado);
    }

    function confirmar({
        titulo: tituloTexto,
        texto: textoAviso,
        confirmar: rotuloConfirmar = 'Confirmar',
        cancelar: rotuloCancelar = 'Cancelar',
        perigo = true,
    }) {
        garantirDialogo();
        if (resolver) fechar(false);

        titulo.textContent = tituloTexto;
        texto.textContent = textoAviso;
        botaoConfirmar.textContent = rotuloConfirmar;
        botaoCancelar.textContent = rotuloCancelar;
        botaoConfirmar.classList.toggle('neutro', !perigo);
        icone.textContent = perigo ? '!' : 'i';

        focoAnterior = document.activeElement;
        dialogo.hidden = false;
        document.body.classList.add('aviso-dialogo-aberto');
        botaoConfirmar.focus();

        return new Promise((resolve) => {
            resolver = resolve;
        });
    }

    function garantirPilha() {
        if (pilha) return;
        pilha = document.createElement('div');
        pilha.className = 'aviso-pilha';
        pilha.setAttribute('aria-live', 'polite');
        document.body.appendChild(pilha);
    }

    function mostrar(mensagem, tipo = 'erro') {
        const textoAviso = String(mensagem || '').trim();
        if (!textoAviso) return;
        garantirPilha();

        const item = document.createElement('p');
        item.className = `aviso aviso-${tipo === 'ok' ? 'ok' : tipo === 'aviso' ? 'info' : 'erro'}`;
        item.textContent = textoAviso;
        pilha.appendChild(item);

        window.setTimeout(() => {
            item.remove();
        }, tipo === 'erro' ? 6400 : 4200);
    }

    return { confirmar, mostrar };
})();
