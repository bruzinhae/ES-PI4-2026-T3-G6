// Bernardo Alberto Amaro - 25015832
package modelo;

import org.junit.jupiter.api.Test;

import java.time.OffsetDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;

class EspacoLivreTest
{
    @Test
    void minutosCalculaDuracaoRealEntreFusos()
    {
        // Calcula o tempo decorrido entre horários locais com offsets diferentes.
        EspacoLivre espaco = new EspacoLivre (
            "e1",
            dataHora ("2026-03-08T01:30:00-05:00"),
            dataHora ("2026-03-08T03:30:00-04:00"));

        assertEquals (60, espaco.getMinutos ());
    }

    @Test
    void minutosDescartaSegundosIncompletos()
    {
        // Trunca durações inferiores a um minuto.
        EspacoLivre espaco = new EspacoLivre (
            "e2",
            dataHora ("2026-03-08T12:00:00Z"),
            dataHora ("2026-03-08T12:00:59Z"));

        assertEquals (0, espaco.getMinutos ());
    }

    @Test
    void minutosTruncaDuracaoPositivaParaMinutosInteiros()
    {
        // Mantém somente os minutos completos do intervalo.
        EspacoLivre espaco = new EspacoLivre (
            "e3",
            dataHora ("2026-03-08T12:00:00Z"),
            dataHora ("2026-03-08T12:01:59Z"));

        assertEquals (1, espaco.getMinutos ());
    }

    @Test
    void minutosTruncaDuracaoNegativaEmDirecaoAZero()
    {
        // Preserva o truncamento para zero em intervalos negativos menores que um minuto.
        EspacoLivre espaco = new EspacoLivre (
            "e4",
            dataHora ("2026-03-08T12:00:59Z"),
            dataHora ("2026-03-08T12:00:00Z"));

        assertEquals (0, espaco.getMinutos ());
    }

    private static OffsetDateTime dataHora (String texto)
    {
        return OffsetDateTime.parse (texto);
    }
}
