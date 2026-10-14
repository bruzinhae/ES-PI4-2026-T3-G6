package br.faculdade.acaistudy.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class MetaServiceTest {

    // Simulando uma classe de serviço que existiria no seu projeto
    private final MetaService metaService = new MetaService();

    @Test
    @DisplayName("Deve calcular horas restantes para bater a meta semanal")
    void deveCalcularHorasRestantesCorretamente() {
        // Preparação
        int metaSemanalHoras = 28;
        int horasJaEstudadas = 14;

        // Ação
        int horasRestantes = metaService.calcularHorasRestantes(metaSemanalHoras, horasJaEstudadas);

        // Verificação
        assertEquals(14, horasRestantes, "O cálculo de horas restantes deve ser exato");
    }

    @Test
    @DisplayName("Não deve retornar horas negativas se o aluno estudar mais que a meta")
    void naoDeveRetornarHorasNegativas() {
        // Preparação
        int metaSemanalHoras = 20;
        int horasJaEstudadas = 25;

        // Ação
        int horasRestantes = metaService.calcularHorasRestantes(metaSemanalHoras, horasJaEstudadas);

        // Verificação
        assertEquals(0, horasRestantes, "Se ultrapassar a meta, as horas restantes devem ser 0");
    }
}