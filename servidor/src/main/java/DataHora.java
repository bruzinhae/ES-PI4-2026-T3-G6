import java.io.*;

/**
 * Um instante com o seu deslocamento de fuso (ex.: 2026-11-12T15:00:00-03:00), sem usar java.time.
 *
 * Guarda os segundos e os nanossegundos desde 1970-01-01T00:00:00Z e o deslocamento do fuso em
 * segundos. Dois valores com o mesmo instante e fusos diferentes são o mesmo momento
 * (compareTo() ignora o fuso), mas cada um escreve a hora no seu próprio fuso.
 *
 * Escreve o ISO-8601 com fuso (toString). Quem lê o texto é o cliente em Node, que manda para
 * o servidor só os três números.
 *
 * É uma classe imutável: pode ser usada por várias threads ao mesmo tempo.
 */
public class DataHora implements Comparable<DataHora>, Serializable
{
    private static final long serialVersionUID = 1L;

    private static final int SEGUNDOS_POR_DIA = 86400;

    private long segundos;     // desde 1970-01-01T00:00:00Z
    private int  nanos;        // 0 a 999999999
    private int  deslocamento; // fuso, em segundos (-03:00 = -10800)

    public DataHora (long segundos, int nanos, int deslocamento)
    {
        this.segundos     = segundos;
        this.nanos        = nanos;
        this.deslocamento = deslocamento;
    }

    // Mesmo instante, escrito no fuso de outra data.
    public DataHora noFusoDe (DataHora outra)
    {
        return new DataHora (this.segundos, this.nanos, outra.deslocamento);
    }

    public DataHora maisMinutos (long minutos)
    {
        return new DataHora (this.segundos + minutos * 60L, this.nanos, this.deslocamento);
    }

    // Negativo se esta data é antes da outra, zero se é o mesmo instante, positivo se é depois (o fuso não conta).
    public int compareTo (DataHora outra)
    {
        if (this.segundos != outra.segundos)
            return this.segundos < outra.segundos ? -1 : 1;

        return Integer.compare (this.nanos, outra.nanos);
    }

    public boolean depoisDe (DataHora outra)      { return this.compareTo (outra) > 0; }
    public boolean mesmoInstante (DataHora outra) { return this.compareTo (outra) == 0; }

    // Minutos inteiros desta data até a outra (negativo se a outra é antes), truncados em direção a zero.
    public long minutosAte (DataHora outra)
    {
        long segundosDeDiferenca = outra.segundos - this.segundos + dividaParaBaixo ((long) outra.nanos - this.nanos, 1000000000L);

        return segundosDeDiferenca / 60L;
    }

    // Dia desta data no fuso dela, contado em dias desde 1970-01-01.
    public long getDiaLocal ()
    {
        return dividaParaBaixo (this.segundos + this.deslocamento, (long) SEGUNDOS_POR_DIA);
    }

    // Segundos desde a meia-noite, no fuso desta data.
    public int getSegundoDoDia ()
    {
        return (int) restoPositivo (this.segundos + this.deslocamento, (long) SEGUNDOS_POR_DIA);
    }

    public int getHora ()    { return this.getSegundoDoDia () / 3600; }
    public int getMinuto ()  { return this.getSegundoDoDia () / 60 % 60; }
    public int getSegundo () { return this.getSegundoDoDia () % 60; }

    // AAAA-MM-DD do dia (contado desde 1970-01-01).
    public static String textoDoDia (long diaDaEpoca)
    {
        long z   = diaDaEpoca + 719468L;
        long era = dividaParaBaixo (z, 146097L);
        long doe = z - era * 146097L;
        long yoe = (doe - doe / 1460L + doe / 36524L - doe / 146096L) / 365L;
        long doy = doe - (365L * yoe + yoe / 4L - yoe / 100L);
        long mp  = (5L * doy + 2L) / 153L;
        long dia = doy - (153L * mp + 2L) / 5L + 1L;
        long mes = mp < 10 ? mp + 3 : mp - 9;
        long ano = yoe + era * 400L + (mes <= 2 ? 1 : 0);

        return preencher (ano, 4) + "-" + preencher (mes, 2) + "-" + preencher (dia, 2);
    }

    // O mesmo texto ISO-8601 com fuso que a leitura aceita, ex.: 2026-11-12T15:00:00-03:00 (ou ...Z).
    public String toString ()
    {
        StringBuffer texto = new StringBuffer (textoDoDia (this.getDiaLocal ()));

        texto.append ('T').append (preencher (this.getHora (), 2)).append (':').append (preencher (this.getMinuto (), 2))
             .append (':').append (preencher (this.getSegundo (), 2));

        if (this.nanos != 0)
        {
            String fracao = preencher (this.nanos, 9);
            int fim = fracao.length ();

            while (fracao.charAt (fim - 1) == '0')
                fim--;

            texto.append ('.').append (fracao, 0, fim);
        }

        if (this.deslocamento == 0)
            return texto.append ('Z').toString ();

        int absoluto = Math.abs (this.deslocamento);

        texto.append (this.deslocamento < 0 ? '-' : '+').append (preencher (absoluto / 3600, 2))
             .append (':').append (preencher (absoluto / 60 % 60, 2));

        if (absoluto % 60 != 0)
            texto.append (':').append (preencher (absoluto % 60, 2));

        return texto.toString ();
    }

    // Divisao que arredonda para baixo (a de Java arredonda em direcao a zero).
    private static long dividaParaBaixo (long dividendo, long divisor)
    {
        long ret = dividendo / divisor;

        if (dividendo % divisor != 0 && (dividendo < 0) != (divisor < 0))
            ret--;

        return ret;
    }

    // Resto da divisao que arredonda para baixo (nunca negativo quando o divisor e positivo).
    private static long restoPositivo (long dividendo, long divisor)
    {
        return dividendo - dividaParaBaixo (dividendo, divisor) * divisor;
    }

    private static String preencher (long valor, int tamanho)
    {
        String texto = Long.toString (valor);

        while (texto.length () < tamanho)
            texto = "0" + texto;

        return texto;
    }
}
