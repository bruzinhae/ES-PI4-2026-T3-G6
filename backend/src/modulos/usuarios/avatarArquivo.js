/**
 * usuarios/avatarArquivo.js — ARQUIVO da foto de perfil no disco.
 *
 * A foto não vai para o MongoDB (lá fica só o caminho, em urlAvatar). O arquivo em si
 * fica em backend/uploads/avatares/, com o nome do id do usuário, e o Express entrega
 * essa pasta em /uploads/avatares (ver app.js).
 *
 * Sem foto, urlAvatar continua null. Quem mostra o boneco padrão é o frontend.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import { ErroApi } from '../../utils/ErroApi.js';

// PNG e JPG, como o texto da tela de perfil ("PNG, JPG até 5MB").
const TIPOS = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
};

const LIMITE_BYTES = 5 * 1024 * 1024;

export const PASTA_AVATARES = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../../uploads/avatares',
);

// O arquivo chega na memória (não direto no disco) para só gravarmos depois de validar
// o tipo. O nome original enviado pelo navegador é ignorado.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: LIMITE_BYTES, files: 1 },
});

/**
 * Middleware da rota de upload. O campo do formulário se chama `foto`.
 * Erros do multer (arquivo grande, campo errado) viram ErroApi 400.
 */
export function receberFoto(req, res, next) {
    upload.single('foto')(req, res, (erro) => {
        if (!erro) {
            next();
            return;
        }

        if (erro instanceof ErroApi) {
            next(erro);
            return;
        }

        if (erro.code === 'LIMIT_FILE_SIZE') {
            next(new ErroApi(400, 'A foto deve ter no máximo 5 MB.'));
            return;
        }

        next(new ErroApi(400, 'Não foi possível ler a foto enviada.'));
    });
}

/**
 * Grava a foto do usuário, substituindo a anterior, e devolve o caminho público
 * (ex.: /uploads/avatares/64ab....jpg). O service salva esse caminho em urlAvatar.
 */
export async function gravarFoto(id, arquivo) {
    const extensao = TIPOS[arquivo?.mimetype];

    if (!extensao || !arquivo.buffer) {
        throw new ErroApi(400, 'Envie uma imagem PNG ou JPG de até 5 MB.');
    }

    await fs.mkdir(PASTA_AVATARES, { recursive: true });
    await apagarFotos(id);

    const nome = `${id}.${extensao}`;
    await fs.writeFile(path.join(PASTA_AVATARES, nome), arquivo.buffer);

    return `/uploads/avatares/${nome}`;
}

/**
 * Apaga os arquivos de foto daquele usuário (jpg e png). Usado ao remover a foto
 * e ao excluir a conta. Se a pasta ainda não existe, não faz nada.
 */
export async function apagarFotos(id) {
    let nomes;

    try {
        nomes = await fs.readdir(PASTA_AVATARES);
    } catch (erro) {
        if (erro.code === 'ENOENT') {
            return;
        }

        throw erro;
    }

    const prefixo = `${id}.`;

    await Promise.all(
        nomes
            .filter((nome) => nome.startsWith(prefixo))
            .map((nome) => fs.unlink(path.join(PASTA_AVATARES, nome))),
    );
}
