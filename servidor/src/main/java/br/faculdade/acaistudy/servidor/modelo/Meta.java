package br.faculdade.acaistudy.servidor.modelo;

import java.time.Instant;

/**
 * Meta ativa do estudante, candidata a receber a atenção da Sofia.
 *
 * @param tipo       geral, disciplina, habito ou projeto
 * @param prioridade baixa, media ou alta
 * @param progresso  0 a 100, já calculado pelo backend (marcos atingidos ou horas da semana)
 * @param prazo      entrega; null quando a meta não tem prazo
 */
public record Meta (String id, String titulo, String tipo, String prioridade, int progresso, Instant prazo)
{
    public boolean habito ()
    {
        return "habito".equals (this.tipo);
    }
}
