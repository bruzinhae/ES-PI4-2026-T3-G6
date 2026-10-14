const { calcularPorcentagemProgresso } = require('./script_metas');

describe('Cálculos de Progresso de Metas', () => {
    
    test('deve calcular 50% quando o aluno estuda metade da meta', () => {
        // Executa a função e espera que o resultado seja 50
        expect(calcularPorcentagemProgresso(14, 28)).toBe(50);
    });

    test('deve retornar 100% caso o aluno ultrapasse a meta estipulada', () => {
        expect(calcularPorcentagemProgresso(30, 28)).toBe(100);
    });

    test('deve lidar com meta total igual a zero evitando divisão por zero', () => {
        expect(calcularPorcentagemProgresso(5, 0)).toBe(0);
    });
});