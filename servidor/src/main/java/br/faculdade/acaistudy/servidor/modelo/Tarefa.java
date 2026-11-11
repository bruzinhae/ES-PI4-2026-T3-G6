package br.faculdade.acaistudy.servidor.modelo;

import java.time.Instant;

/**
 * Tarefa pendente candidata a ser encaixada na grade.
 *
 * @param categoria       "estudos" ou "pessoal"; tarefa pessoal não depende da janela de foco
 * @param prioridade       1 a 10, definida pelo usuário
 * @param prazo            entrega; null quando a tarefa não tem prazo
 * @param minutosEstimados esforço estimado; null quando não informado
 * @param dificuldade      da disciplina (1 a 5), ou null
 * @param peso             da disciplina (1 a 5), ou null
 */
public record Tarefa (String id, String titulo, String categoria, String tipo, int prioridade, Instant prazo,
                      Integer minutosEstimados, Integer dificuldade, Integer peso, String situacao)
{
    public static final String CATEGORIA_ESTUDOS = "estudos";
    public static final String CATEGORIA_PESSOAL = "pessoal";

    public boolean pessoal ()
    {
        return CATEGORIA_PESSOAL.equals (this.categoria);
    }

    public boolean concluida ()
    {
        return "concluida".equals (this.situacao);
    }
}
