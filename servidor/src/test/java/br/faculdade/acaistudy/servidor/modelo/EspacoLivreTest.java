package br.faculdade.acaistudy.servidor.modelo;

import org.junit.jupiter.api.Test;

import java.time.OffsetDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;

class EspacoLivreTest
{
    @Test
    void minutosCalculaDuracaoRealEntreFusos()
    {
        EspacoLivre espaco = new EspacoLivre (
            "e1",
            OffsetDateTime.parse ("2026-03-08T01:30:00-05:00"),
            OffsetDateTime.parse ("2026-03-08T03:30:00-04:00"));

        assertEquals (60, espaco.minutos ());
    }

    @Test
    void minutosDescartaSegundosIncompletos()
    {
        EspacoLivre espaco = new EspacoLivre (
            "e2",
            OffsetDateTime.parse ("2026-03-08T12:00:00Z"),
            OffsetDateTime.parse ("2026-03-08T12:00:59Z"));

        assertEquals (0, espaco.minutos ());
    }
}
