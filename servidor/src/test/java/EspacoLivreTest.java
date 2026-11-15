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

    private static DataHora dataHora (String texto)
    {
        OffsetDateTime data = OffsetDateTime.parse (texto);
        return new DataHora (
            data.toEpochSecond (),
            data.getNano (),
            data.getOffset ().getTotalSeconds ());
    }
}
