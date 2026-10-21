/**
 * models/Usuario.js — MODELO da coleção "usuarios" no MongoDB.
 *
 * O MongoDB por si só aceita documentos em qualquer formato. O schema do Mongoose define
 * QUAIS campos um usuário tem, de que tipo são, quais são obrigatórios, os valores padrão
 * e as validações. Se algum dado não obedecer ao schema, o Mongoose recusa salvar
 * (ValidationError, tratado em middlewares/tratarErros.js).
 *
 * Os campos seguem o dicionário de dados do projeto:
 * Arquivos/Dicionário de dados/usuarios.json — se mudar um, atualize o outro.
 */

import mongoose from 'mongoose';
import { emailValido, normalizarEmail } from '../utils/validacoes.js';

// Valores aceitos em campos de "lista fechada". Exportados para poderem ser reaproveitados
// em outros arquivos (ex.: validações ou opções de formulário) sem repetir os textos.
export const PROVEDORES_AUTENTICACAO = ['local', 'google'];
export const TURNOS = ['matutino', 'vespertino', 'noturno', 'integral'];

// Nas regras abaixo, o formato [valor, 'mensagem'] define a mensagem de erro mostrada ao
// usuário quando a regra falha (ex.: minlength: [3, 'Informe seu nome completo.']).
const usuarioSchema = new mongoose.Schema(
    {
        // Nome exibido no app. `trim` remove espaços nas pontas antes de salvar.
        nome: {
            type: String,
            required: [true, 'Informe seu nome completo.'],
            trim: true,
            minlength: [3, 'Informe seu nome completo.'],
            maxlength: [120, 'O nome deve ter no máximo 120 caracteres.'],
        },

        // E-mail do jeito que o usuário digitou (preserva maiúsculas para exibição).
        email: {
            type: String,
            required: [true, 'Informe seu e-mail.'],
            trim: true,
            validate: {
                validator: emailValido,
                message: 'Digite um e-mail válido.',
            },
        },

        // Versão padronizada do e-mail (minúscula, sem espaços), preenchida automaticamente
        // pelo hook `pre('validate')` no fim deste arquivo. É ela que garante "um e-mail por
        // conta": `unique: true` cria um índice único no MongoDB, então o próprio banco
        // recusa duplicatas. Nunca é devolvida pela API (ver toJSON abaixo).
        emailNormalizado: {
            type: String,
            required: true,
            unique: true,
        },

        // Hash bcrypt da senha — a senha original NUNCA é salva. O hash é gerado no
        // services/usuarioService.js. Pode ser null para contas que entram só pelo Google.
        hashSenha: {
            type: String,
            default: null,
        },

        // Como a conta foi criada/entra: senha própria ('local') ou login com Google.
        provedorAutenticacao: {
            type: String,
            enum: PROVEDORES_AUTENTICACAO,
            default: 'local',
        },

        // Se o usuário já confirmou que o e-mail é dele. Começa false e volta a false
        // quando o e-mail é trocado (regra no service).
        emailVerificado: {
            type: Boolean,
            default: false,
        },

        // Data/hora em que aceitou os Termos de Serviço e a Política de Privacidade.
        // Guardar a data (e não só true/false) serve como registro do consentimento (LGPD).
        termosAceitosEm: {
            type: Date,
            default: null,
        },

        // ---- Campos de perfil (opcionais; null = não preenchido) ----

        // Link da foto de perfil.
        urlAvatar: {
            type: String,
            trim: true,
            default: null,
        },

        instituicao: {
            type: String,
            trim: true,
            maxlength: [160, 'A instituição deve ter no máximo 160 caracteres.'],
            default: null,
        },

        curso: {
            type: String,
            trim: true,
            maxlength: [120, 'O curso deve ter no máximo 120 caracteres.'],
            default: null,
        },

        // Semestre atual do curso: inteiro de 1 a 12. O validator extra existe porque
        // `type: Number` aceitaria 2.5; o `valor === null` deixa o campo continuar opcional.
        semestre: {
            type: Number,
            min: [1, 'O semestre deve ser entre 1 e 12.'],
            max: [12, 'O semestre deve ser entre 1 e 12.'],
            validate: {
                validator: (valor) => valor === null || Number.isInteger(valor),
                message: 'O semestre deve ser um número inteiro.',
            },
            default: null,
        },

        // Período em que estuda. `null` entra na lista para permitir limpar o campo.
        turno: {
            type: String,
            enum: {
                values: [...TURNOS, null],
                message: `O turno deve ser: ${TURNOS.join(', ')}.`,
            },
            default: null,
        },

        // Meta de horas de estudo por semana (máximo 168 = 24h × 7 dias).
        metaSemanalHoras: {
            type: Number,
            min: [0, 'A meta semanal deve ser entre 0 e 168 horas.'],
            max: [168, 'A meta semanal deve ser entre 0 e 168 horas.'],
            default: 10,
        },

        // Se o usuário já passou pelas telas de boas-vindas (onboarding). O frontend usa
        // isso para decidir se mostra o onboarding ou vai direto para o app.
        onboardingConcluido: {
            type: Boolean,
            default: false,
        },
    },
    {
        // Nome exato da coleção no MongoDB. Sem isso o Mongoose inventaria "usuarios" a partir
        // de "Usuario" pelas regras do inglês — deixamos explícito para não ter surpresa.
        collection: 'usuarios',

        // Desliga o campo interno `__v` que o Mongoose cria por padrão (não usamos).
        versionKey: false,

        // Cria e mantém sozinho as datas de criação e da última alteração,
        // com nomes em português para combinar com o dicionário de dados.
        timestamps: { createdAt: 'criadoEm', updatedAt: 'atualizadoEm' },

        // `toJSON` define como o documento vira JSON — é o que acontece quando o controller
        // faz `res.json({ usuario })`. Ou seja, controla tudo o que sai da API.
        toJSON: {
            // Nunca expõe o hash da senha nem campos internos na API.
            transform(_documento, retorno) {
                // Troca `_id` (ObjectId do Mongo) por `id` em texto, mais simples no frontend.
                retorno.id = String(retorno._id);
                delete retorno._id;
                delete retorno.hashSenha;
                delete retorno.emailNormalizado;
                return retorno;
            },
        },
    }
);

// Hook (gancho) que roda automaticamente antes de cada validação/salvamento.
// Sempre que o e-mail for definido ou alterado, recalcula o emailNormalizado. Fazer isso
// aqui garante que os dois campos nunca fiquem diferentes, seja qual for o código que
// alterou o e-mail. É `function` (e não arrow function) porque precisamos do `this`,
// que aponta para o documento sendo salvo.
usuarioSchema.pre('validate', function () {
    if (this.isModified('email')) {
        this.emailNormalizado = normalizarEmail(this.email);
    }
});

// Cria o model "Usuario" a partir do schema. É ele que o service usa para consultar
// e gravar no banco (Usuario.create, Usuario.find, Usuario.findById...).
export const Usuario = mongoose.model('Usuario', usuarioSchema);
