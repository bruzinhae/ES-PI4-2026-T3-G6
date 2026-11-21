// Bruna Barbour Fernandes RA: 23007950
/**
 * usuarios/apresentarUsuario.js — JSON do usuário pronto para o frontend.
 *
 * urlAvatar no banco é um caminho da própria API (/uploads/avatares/....jpg) ou um
 * link externo (ex.: foto do Google). O <img> do frontend está em outra origem
 * (Live Server), então um caminho relativo apontaria para o lugar errado. Aqui o
 * caminho interno vira uma URL absoluta, com um ?v= para o navegador não guardar
 * a foto antiga depois de um upload novo.
 */

// Recebe o usuário (documento do Mongoose ou objeto comum) e devolve o JSON que sai na API.
// `req` é usado só para descobrir o protocolo e o host do servidor ao montar a URL da foto.
export function apresentarUsuario(req, usuario) {
    // Documento do Mongoose: usa o toJSON do model (que já esconde senha e tokens).
    // Objeto comum: faz uma cópia rasa para não alterar o original.
    const json = typeof usuario.toJSON === 'function' ? usuario.toJSON() : { ...usuario };

    // Só mexe em caminhos internos; links externos (ex.: Google) saem como estão.
    if (typeof json.urlAvatar === 'string' && json.urlAvatar.startsWith('/uploads/')) {
        // A data da última alteração vira o número da versão (?v=), que muda a cada upload.
        const versao = json.atualizadoEm ? new Date(json.atualizadoEm).getTime() : 0;
        json.urlAvatar = `${req.protocol}://${req.get('host')}${json.urlAvatar}?v=${versao}`;
    }

    return json;
}

// Versão para listas: aplica apresentarUsuario em cada usuário.
export function apresentarUsuarios(req, usuarios) {
    return usuarios.map((usuario) => apresentarUsuario(req, usuario));
}
