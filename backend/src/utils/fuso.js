import { env } from '../config/env.js';

// Datas do calendário no fuso fixo da API (env.fuso). Os instantes são sempre milissegundos UTC;
// "local" é o mesmo instante deslocado pelo fuso, para ler dia e hora com os getters UTC.

export const MINUTO = 60_000;
export const DIA = 24 * 60 * MINUTO;

const paraLocal = (ms) => ms + env.fuso.minutos * MINUTO;
const deLocal = (ms) => ms - env.fuso.minutos * MINUTO;
const dois = (n) => String(n).padStart(2, '0');

export function inicioDoDia(ms) {
    return deLocal(Math.floor(paraLocal(ms) / DIA) * DIA);
}

// 0 = segunda ... 6 = domingo (o mesmo índice de `diasSemana` dos blocos fixos).
export function diaDaSemana(ms) {
    return (new Date(paraLocal(ms)).getUTCDay() + 6) % 7;
}

export function inicioDaSemana(ms) {
    return inicioDoDia(ms) - diaDaSemana(ms) * DIA;
}

// 'AAAA-MM-DD' do dia local que contém o instante.
export function chaveDoDia(ms) {
    return new Date(paraLocal(ms)).toISOString().slice(0, 10);
}

// Instante de 'AAAA-MM-DD' + 'HH:MM' no fuso local.
export function instanteLocal(chave, horario = '00:00') {
    const [horas, minutos] = horario.split(':').map(Number);
    return deLocal(Date.parse(`${chave}T00:00:00Z`) + (horas * 60 + minutos) * MINUTO);
}

// ISO-8601 com o fuso da API, ex.: 2026-11-09T14:00:00-03:00.
export function formatarISO(ms) {
    const local = new Date(paraLocal(ms));
    return `${local.getUTCFullYear()}-${dois(local.getUTCMonth() + 1)}-${dois(local.getUTCDate())}`
        + `T${dois(local.getUTCHours())}:${dois(local.getUTCMinutes())}:${dois(local.getUTCSeconds())}${env.fuso.offset}`;
}

export function dataValida(chave) {
    if (typeof chave !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(chave)) return false;
    const data = new Date(`${chave}T00:00:00Z`);
    return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === chave;
}
