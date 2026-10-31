package br.faculdade.acaistudy.servidor.modelo;

import java.time.Duration;
import java.time.OffsetDateTime;

/**
 * Um intervalo livre da grade, calculado pelo backend Node (grade da semana menos blocos
 * fixos e sessões já marcadas). O servidor só recebe e ranqueia candidatos para ele.
 */
public record EspacoLivre (String id, OffsetDateTime inicio, OffsetDateTime fim)
{
    public int minutos ()
    {
        return (int) Duration.between (this.inicio, this.fim).toMinutes ();
    }
}
