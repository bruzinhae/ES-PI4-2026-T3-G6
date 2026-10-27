/**
 * services/usuarioService.js — REGRAS DE NEGÓCIO do CRUD de usuários.
 *
 * É aqui que fica a lógica "de verdade": o que pode ou não pode ao criar, ler, atualizar e
 * excluir um usuário (senha mínima, aceite dos termos, e-mail único, hash da senha...).
 *
 * O service não conhece o Express (não usa req/res): recebe dados comuns e devolve dados
 * comuns. Quando algo está errado, lança um ErroApi com o status HTTP adequado e o
 * middleware tratarErros.js transforma isso na resposta. Quem chama estas funções é o
 * controllers/usuarioController.js.
 */

import bcrypt from 'bcryptjs';
import { Usuario } from './Usuario.js';
import { apagarFotos, gravarFoto } from './avatarArquivo.js';
import { ErroApi } from '../../utils/ErroApi.js';
import { normalizarEmail, selecionarCampos, validarSenha } from '../../utils/validacoes.js';

// "Custo" do bcrypt: quantas rodadas (2^10 = 1024) de processamento para gerar o hash.
// Quanto maior, mais lento para um atacante testar senhas por força bruta — e também mais
// lento para nós. 10 é o valor padrão recomendado (alguns milissegundos por hash).
const BCRYPT_CUSTO = 10;

// Campos de perfil que podem ser enviados no cadastro e na atualização.
// Funciona como "lista branca" (ver selecionarCampos): qualquer outro campo do corpo da
// requisição é ignorado. A foto de perfil também fica de fora: ela só muda pela rota
// de upload (/avatar), não por um link colado no JSON. Campos sensíveis como hashSenha,
// emailVerificado e provedorAutenticacao ficam de fora de propósito — só o próprio
// servidor altera esses.
const CAMPOS_PERFIL = [
    'nome',
    'email',
    'instituicao',
    'curso',
    'semestre',
    'turno',
    'metaSemanalHoras',
    'onboardingConcluido',
];

/**
 * Lança erro 409 (Conflict) se já existir OUTRA conta com este e-mail.
 * A comparação é feita pelo emailNormalizado, então maiúsculas/espaços não enganam a regra.
 *
 * @param idIgnorado Na atualização, passamos o id do próprio usuário para que o e-mail
 *                   dele mesmo não conte como "em uso" ($ne = "not equal", diferente de).
 *
 * Checar antes de salvar permite devolver uma mensagem clara; o índice único do model
 * continua como segunda barreira (ver código 11000 em tratarErros.js).
 */
async function garantirEmailLivre(email, idIgnorado = null) {
    const emUso = await Usuario.exists({
        emailNormalizado: normalizarEmail(email),
        ...(idIgnorado && { _id: { $ne: idIgnorado } }),
    });

    if (emUso) {
        throw new ErroApi(409, 'Já existe uma conta com este e-mail.');
    }
}

// Strings vazias viram null (campos opcionais do perfil).
// Motivo: um input de formulário deixado em branco chega como "". Sem esta conversão,
// "" seria salvo como valor real e quebraria validações (ex.: turno "" não está na lista
// de turnos). null significa "não preenchido" de forma consistente no banco.
function limparVazios(dados) {
    return Object.fromEntries(
        Object.entries(dados).map(([campo, valor]) => [campo, valor === '' ? null : valor])
    );
}

/**
 * CREATE — cria uma conta nova (usado pela tela "Criar Nova Conta").
 *
 * Passos:
 *   1. Valida a senha (precisa ser feito aqui porque depois só existe o hash);
 *   2. Exige o aceite dos termos (o checkbox do formulário manda `aceitouTermos: true`);
 *   3. Confere se o e-mail ainda não está cadastrado;
 *   4. Salva só os campos permitidos + o hash da senha + a data do aceite dos termos.
 * As validações dos demais campos (nome, e-mail, semestre...) são feitas pelo schema
 * no `Usuario.create`.
 */
export async function criar(dados = {}) {
    validarSenha(dados.senha);

    // `!== true` (e não só `!dados.aceitouTermos`) para aceitar apenas o booleano true,
    // e não valores como "sim" ou 1.
    if (dados.aceitouTermos !== true) {
        throw new ErroApi(400, 'É necessário aceitar os Termos de Serviço e a Política de Privacidade.');
    }

    await garantirEmailLivre(dados.email);

    return Usuario.create({
        ...limparVazios(selecionarCampos(dados, CAMPOS_PERFIL)),
        hashSenha: await bcrypt.hash(dados.senha, BCRYPT_CUSTO),
        termosAceitosEm: new Date(),
    });
}

/**
 * Define uma senha nova para o usuário (usado pela recuperação de senha, que não passa pelo
 * PATCH do perfil). Valida o tamanho e salva só o hash.
 */
export async function trocarSenha(id, senhaNova) {
    validarSenha(senhaNova);

    const usuario = await buscarPorId(id);
    usuario.hashSenha = await bcrypt.hash(senhaNova, BCRYPT_CUSTO);
    await usuario.save();
}

/**
 * READ (todos) — lista os usuários, do mais recente para o mais antigo (-1 = decrescente).
 * Atenção: a rota exige login, mas devolve os dados de todos os usuários para qualquer
 * usuário logado. Restrinja antes de usar com dados reais.
 */
export function listar() {
    return Usuario.find().sort({ criadoEm: -1 });
}

/**
 * READ (um) — busca pelo id; lança 404 se não existir.
 * Também é reaproveitada pelo `atualizar`, que precisa do usuário carregado antes de alterar.
 * Um id em formato inválido gera CastError, que vira 400 em tratarErros.js.
 */
export async function buscarPorId(id) {
    const usuario = await Usuario.findById(id);

    if (!usuario) {
        throw new ErroApi(404, 'Usuário não encontrado.');
    }

    return usuario;
}

/**
 * UPDATE — altera só os campos enviados (por isso a rota é PATCH, e não PUT).
 *
 * Carregamos o documento, alteramos e chamamos `save()` (em vez de usar `updateOne` direto)
 * porque assim as validações do schema e o hook que atualiza o emailNormalizado rodam
 * normalmente.
 */
export async function atualizar(id, dados = {}) {
    const usuario = await buscarPorId(id);
    const alteracoes = limparVazios(selecionarCampos(dados, CAMPOS_PERFIL));

    // Se não veio nenhum campo conhecido nem senha, não há o que fazer: avisamos o cliente
    // em vez de responder "sucesso" sem ter mudado nada.
    if (Object.keys(alteracoes).length === 0 && dados.senha === undefined) {
        throw new ErroApi(400, 'Nenhum campo válido para atualizar.');
    }

    // Trocou de e-mail de verdade (não só mudou maiúsculas)? Então:
    //   - o novo e-mail não pode pertencer a outra conta;
    //   - o novo endereço ainda não foi confirmado, logo emailVerificado volta a false.
    if ('email' in alteracoes && normalizarEmail(alteracoes.email) !== usuario.emailNormalizado) {
        await garantirEmailLivre(alteracoes.email, usuario._id);
        usuario.emailVerificado = false;
    }

    // Troca de senha: valida o tamanho e guarda apenas o novo hash.
    if (dados.senha !== undefined) {
        validarSenha(dados.senha);
        usuario.hashSenha = await bcrypt.hash(dados.senha, BCRYPT_CUSTO);
    }

    usuario.set(alteracoes);
    await usuario.save();

    return usuario;
}

/**
 * Define a foto de perfil a partir do arquivo enviado na rota de upload.
 * Grava o arquivo no disco e guarda em urlAvatar só o caminho público.
 */
export async function definirAvatar(id, arquivo) {
    const usuario = await buscarPorId(id);
    usuario.urlAvatar = await gravarFoto(id, arquivo);
    await usuario.save();

    return usuario;
}

/**
 * Tira a foto de perfil: apaga o arquivo local (se houver) e volta urlAvatar para null.
 * Um link externo (ex.: Google) só é esquecido — não existe arquivo nosso para apagar.
 */
export async function removerAvatar(id) {
    const usuario = await buscarPorId(id);

    if (typeof usuario.urlAvatar === 'string' && usuario.urlAvatar.startsWith('/uploads/avatares/')) {
        await apagarFotos(id);
    }

    usuario.urlAvatar = null;
    await usuario.save();

    return usuario;
}

/**
 * DELETE — exclui o usuário pelo id.
 * `deleteOne` informa quantos documentos apagou; se foi 0, o id não existia → 404.
 */
export async function excluir(id) {
    const { deletedCount } = await Usuario.deleteOne({ _id: id });

    if (deletedCount === 0) {
        throw new ErroApi(404, 'Usuário não encontrado.');
    }

    await apagarFotos(id);
}
