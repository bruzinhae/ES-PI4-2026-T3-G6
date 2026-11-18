import assert from 'node:assert/strict';
import test from 'node:test';
import { minutosDeEstudo, resumoRotina } from './rotinaSemanal.js';

test('a rotina de estudo não soma sono, trabalho nem translado', () => {
    const blocos = [
        { categoria: 'sono', duracaoMinutos: 480, diasSemana: [0, 1, 2, 3, 4, 5, 6], recorrencia: 'semanal' },
        { categoria: 'trabalho', duracaoMinutos: 240, diasSemana: [0, 1, 2, 3, 4], recorrencia: 'semanal' },
        { categoria: 'translado', duracaoMinutos: 60, diasSemana: [0], recorrencia: 'semanal' },
        { categoria: 'aulas', duracaoMinutos: 120, diasSemana: [0], recorrencia: 'semanal' },
    ];

    assert.equal(minutosDeEstudo(blocos), 120);
    assert.equal(resumoRotina(minutosDeEstudo(blocos), 10).percentual, 20);
});
