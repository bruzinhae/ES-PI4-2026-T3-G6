/**
 * Guarda de páginas internas — carregue no <head> (sem defer) de toda página que exige login.
 *
 * 1. Na hora: sem token guardado, vai para o login antes de a página aparecer.
 * 2. Depois que a página carrega: confere com a API se a sessão ainda vale (AcaiApi.verificarSessao).
 *    Se a sessão tiver expirado, a API responde 401 e o api.js leva ao login.
 *
 * As chaves são as mesmas de JS/users/api.js.
 */

(function () {
    const CHAVE_ID = 'acaistudy-usuario-id';
    const CHAVE_TOKEN = 'acaistudy-token';
    const PAGINA_LOGIN = 'index_login.html';

    let logado = false;

    try {
        logado = Boolean(localStorage.getItem(CHAVE_ID) && localStorage.getItem(CHAVE_TOKEN));
    } catch {
        logado = false;
    }

    if (!logado) {
        window.location.replace(PAGINA_LOGIN);

        return;
    }

    document.addEventListener('DOMContentLoaded', () => {
        window.AcaiApi?.verificarSessao();
    });
})();
