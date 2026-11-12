import java.io.*;

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

    public DataHora noFusoDe (DataHora outra) // mesmo instante, escrito no fuso da outra
    {
        return new DataHora (this.segundos, this.nanos, outra.deslocamento);
    }

    public DataHora maisMinutos (long minutos)
    {
        return new DataHora (this.segundos + minutos * 60L, this.nanos, this.deslocamento);
    }

    @Override
    public int compareTo (DataHora dat) // o fuso nao conta
    {
        if (this.segundos<dat.segundos) return -666;
        if (this.segundos>dat.segundos) return  666;
        if (this.nanos<dat.nanos) return -666;
        if (this.nanos>dat.nanos) return  666;
        return 0;
    }

    public boolean depoisDe (DataHora outra)
    {
        return this.compareTo (outra) > 0;
    }

    public boolean mesmoInstante (DataHora outra)
    {
        return this.compareTo (outra) == 0;
    }

    public long minutosAte (DataHora outra) // minutos inteiros, truncados em direcao a zero
    {
        long dif      = outra.segundos - this.segundos;
        long difNanos = (long) outra.nanos - this.nanos;

        dif = dif + dividaParaBaixo (difNanos, 1000000000L);

        return dif / 60L;
    }

    public long getDiaLocal () // dias desde 1970-01-01, no fuso desta data
    {
        return dividaParaBaixo (this.segundos + this.deslocamento, (long) SEGUNDOS_POR_DIA);
    }

    public int getSegundoDoDia () // desde a meia-noite, no fuso desta data
    {
        return (int) restoPositivo (this.segundos + this.deslocamento, (long) SEGUNDOS_POR_DIA);
    }

    public static String textoDoDia (long diaDaEpoca) // AAAA-MM-DD, dias desde 1970-01-01
    {
        long z   = diaDaEpoca + 719468L; // dias de 0000-03-01 ate 1970-01-01
        long era = dividaParaBaixo (z, 146097L); // blocos de 400 anos (146097 dias)
        long doe = z - era * 146097L;
        long yoe = (doe - doe / 1460L + doe / 36524L - doe / 146096L) / 365L;
        long doy = doe - (365L * yoe + yoe / 4L - yoe / 100L);
        long mp  = (5L * doy + 2L) / 153L;
        long dia = doy - (153L * mp + 2L) / 5L + 1L;
        long mes = mp < 10 ? mp + 3 : mp - 9;
        long ano = yoe + era * 400L + (mes <= 2 ? 1 : 0);

        return preencher (ano, 4) + "-" + preencher (mes, 2) + "-" + preencher (dia, 2);
    }

    private static long dividaParaBaixo (long dividendo, long divisor) // arredonda para baixo
    {
        long ret = dividendo / divisor;

        if (dividendo % divisor != 0 && (dividendo < 0) != (divisor < 0))
            ret--;

        return ret;
    }

    private static long restoPositivo (long dividendo, long divisor) // nunca negativo
    {
        return dividendo - dividaParaBaixo (dividendo, divisor) * divisor;
    }

    private static String preencher (long valor, int tamanho) // completa com zeros a esquerda
    {
        String texto = "" + valor;

        while (texto.length () < tamanho)
            texto = "0" + texto;

        return texto;
    }
}
