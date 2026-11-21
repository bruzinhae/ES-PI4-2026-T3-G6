// Bruna Barbour Fernandes RA: 23007950
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
// Chave = tipo MIME informado no upload; valor = extensão usada no nome do arquivo salvo.
const TIPOS = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
};

// Tamanho máximo da foto: 5 MB (5 × 1024 × 1024 bytes).
const LIMITE_BYTES = 5 * 1024 * 1024;

// Caminho absoluto de backend/uploads/avatares. Parte da pasta deste arquivo
// (import.meta.url) e sobe três níveis, então funciona de qualquer diretório de execução.
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
        // Sem erro: o arquivo fica em req.file e a requisição segue para o controller.
        if (!erro) {
            next();
            return;
        }

        // Erro que já é nosso: repassa sem mudar a mensagem.
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
    // Tipo fora da lista (ou nenhum arquivo enviado) → extensao fica undefined.
    const extensao = TIPOS[arquivo?.mimetype];

    if (!extensao || !arquivo.buffer) {
        throw new ErroApi(400, 'Envie uma imagem PNG ou JPG de até 5 MB.');
    }

    // Cria a pasta se ainda não existir e apaga a foto antiga (pode ter outra extensão).
    await fs.mkdir(PASTA_AVATARES, { recursive: true });
    await apagarFotos(id);

    // O nome do arquivo é o id do usuário, então cada conta tem no máximo uma foto.
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
        // ENOENT = a pasta não existe, ou seja, ainda não há nenhuma foto salva.
        if (erro.code === 'ENOENT') {
            return;
        }

        throw erro;
    }

    // O ponto no fim evita apagar a foto de outro id que só comece igual.
    const prefixo = `${id}.`;

    // Apaga todos os arquivos daquele usuário ao mesmo tempo.
    await Promise.all(
        nomes
            .filter((nome) => nome.startsWith(prefixo))
            .map((nome) => fs.unlink(path.join(PASTA_AVATARES, nome))),
    );
}
