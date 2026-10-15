/** Cliente de autenticação. Toda mensagem da aplicação trafega pelo WebSocket. */
(function () {
    const TOKEN_KEY = 'acaistudy-session-token';
    const url = window.ACAISTUDY_WS_URL ||
        `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://localhost:8080/ws`;
    const pendentes = new Map();
    let socket = null;
    let conectando = null;

    function conectar() {
        if (socket?.readyState === WebSocket.OPEN) return Promise.resolve(socket);
        if (conectando) return conectando;

        conectando = new Promise((resolve, reject) => {
            const conexao = new WebSocket(url);
            socket = conexao;

            conexao.addEventListener('open', () => resolve(conexao), { once: true });
            conexao.addEventListener('message', (evento) => {
                let resposta;
                try {
                    resposta = JSON.parse(evento.data);
                } catch {
                    return;
                }

                const pendente = pendentes.get(resposta.requestId);
                if (!pendente) return;
                clearTimeout(pendente.timeout);
                pendentes.delete(resposta.requestId);

                if (resposta.success) pendente.resolve(resposta.data || {});
                else {
                    const erro = new Error(resposta.message || 'Não foi possível concluir a operação.');
                    erro.code = resposta.error;
                    pendente.reject(erro);
                }
            });
            conexao.addEventListener('error', () => {
                reject(new Error('Não foi possível conectar ao servidor. Verifique se o backend está iniciado.'));
            });
            conexao.addEventListener('close', () => {
                if (socket === conexao) socket = null;
                for (const [requestId, pendente] of pendentes) {
                    clearTimeout(pendente.timeout);
                    pendente.reject(new Error('A conexão com o servidor foi encerrada. Tente novamente.'));
                    pendentes.delete(requestId);
                }
            });
        }).finally(() => {
            conectando = null;
        });

        return conectando;
    }

    async function enviar(type, payload = {}) {
        const conexao = await conectar();
        const requestId = crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

        return new Promise((resolve, reject) => {
            const timeout = window.setTimeout(() => {
                pendentes.delete(requestId);
                reject(new Error('O servidor demorou para responder. Tente novamente.'));
            }, 10000);
            pendentes.set(requestId, { resolve, reject, timeout });
            try {
                conexao.send(JSON.stringify({ type, requestId, payload }));
            } catch (erro) {
                clearTimeout(timeout);
                pendentes.delete(requestId);
                reject(erro);
            }
        });
    }

    window.AuthWebSocket = {
        enviar,
        salvarToken(token) {
            sessionStorage.setItem(TOKEN_KEY, token);
        },
        obterToken() {
            return sessionStorage.getItem(TOKEN_KEY);
        },
        removerToken() {
            sessionStorage.removeItem(TOKEN_KEY);
        },
    };
})();
