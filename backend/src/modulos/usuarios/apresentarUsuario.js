/**
 * usuarios/apresentarUsuario.js — JSON do usuário pronto para o frontend.
 *
 * urlAvatar no banco é um caminho da própria API (/uploads/avatares/....jpg) ou um
 * link externo (ex.: foto do Google). O <img> do frontend está em outra origem
 * (Live Server), então um caminho relativo apontaria para o lugar errado. Aqui o
 * caminho interno vira uma URL absoluta, com um ?v= para o navegador não guardar
 * a foto antiga depois de um upload novo.
 */

export function apresentarUsuario(req, usuario) {
    const json = typeof usuario.toJSON === 'function' ? usuario.toJSON() : { ...usuario };

    if (typeof json.urlAvatar === 'string' && json.urlAvatar.startsWith('/uploads/')) {
        const versao = json.atualizadoEm ? new Date(json.atualizadoEm).getTime() : 0;
        json.urlAvatar = `${req.protocol}://${req.get('host')}${json.urlAvatar}?v=${versao}`;
    }

    return json;
}

export function apresentarUsuarios(req, usuarios) {
    return usuarios.map((usuario) => apresentarUsuario(req, usuario));
}
