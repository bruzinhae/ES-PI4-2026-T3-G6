package br.faculdade.acaistudy.service;

/** Regras simples de cálculo relacionadas às metas semanais de estudo. */
public class MetaService {

    /**
     * Retorna quantas horas ainda faltam para atingir a meta semanal.
     * O resultado é zero quando a meta já foi alcançada ou ultrapassada.
     */
    public int calcularHorasRestantes(int metaSemanalHoras, int horasJaEstudadas) {
        return Math.max(0, metaSemanalHoras - horasJaEstudadas);
    }
}
