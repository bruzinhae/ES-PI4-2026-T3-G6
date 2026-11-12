import java.io.*;

public class DataHora implements Comparable<DataHora>, Serializable
{
    private static final long serialVersionUID = 1L;

    private static final long SEGUNDOS_POR_DIA = 86400;

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
        long difNanos = outra.nanos - this.nanos;

        dif = dif + dividaParaBaixo (difNanos, 1000000000L);

        return dif / 60L;
    }

    public int getDiaLocal () // dias desde 1970-01-01, no fuso desta data
    {
        return (int) dividaParaBaixo (this.segundos + this.deslocamento, SEGUNDOS_POR_DIA);
    }

    public int getSegundoDoDia () // desde a meia-noite, no fuso desta data
    {
        return (int) restoPositivo (this.segundos + this.deslocamento, SEGUNDOS_POR_DIA);
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
}
