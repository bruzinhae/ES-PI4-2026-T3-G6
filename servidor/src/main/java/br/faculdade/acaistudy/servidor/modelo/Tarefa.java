package br.faculdade.acaistudy.servidor.modelo;

import java.time.Instant;

/**
 * Tarefa pendente candidata a ser encaixada na grade.
 *
 * @param prioridade       1 a 10, definida pelo usuário
 * @param prazo            entrega; null quando a tarefa não tem prazo
 * @param minutosEstimados esforço estimado; null quando não informado
 * @param dificuldade      da disciplina (1 a 5), ou null
 * @param peso             da disciplina (1 a 5), ou null
 */
public record Tarefa (String id, String titulo, String tipo, int prioridade, Instant prazo,
                      Integer minutosEstimados, Integer dificuldade, Integer peso, String situacao)
{
    public boolean concluida ()
    {
        return "concluida".equals (this.situacao);
    }
}
