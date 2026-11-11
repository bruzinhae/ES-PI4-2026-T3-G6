import java.io.*;

/**
 * Uma sessao de estudo decidida pela alocacao: qual tarefa, onde (espaco livre) e quando.
 *
 * minutosRestantes o que ainda falta da tarefa depois desta sessao (0 = a tarefa ficou completa)
 */
public class SessaoAlocada implements Cloneable, Serializable
{
    private static final long serialVersionUID = 1L;

    private String   espacoId;
    private String   tarefaId;
    private DataHora inicio;
    private DataHora fim;
    private int      minutos;
    private int      minutosRestantes;
    private double   nota;
    private double   urgencia;
    private double   importancia;
    private double   encaixe;

    public SessaoAlocada (String espacoId, String tarefaId, DataHora inicio, DataHora fim, int minutos, int minutosRestantes, double nota, double urgencia, double importancia, double encaixe) throws Exception
    {
        if (espacoId == null)
            throw new Exception ("EspacoId ausente");
        if (tarefaId == null)
            throw new Exception ("TarefaId ausente");
        if (inicio == null)
            throw new Exception ("Inicio ausente");
        if (fim == null)
            throw new Exception ("Fim ausente");

        this.espacoId         = espacoId;
        this.tarefaId         = tarefaId;
        this.inicio           = inicio;
        this.fim              = fim;
        this.minutos          = minutos;
        this.minutosRestantes = minutosRestantes;
        this.nota             = nota;
        this.urgencia         = urgencia;
        this.importancia      = importancia;
        this.encaixe          = encaixe;
    }

    public String getEspacoId ()
    {
        return this.espacoId;
    }

    public String getTarefaId ()
    {
        return this.tarefaId;
    }

    public DataHora getInicio ()
    {
        return this.inicio;
    }

    public DataHora getFim ()
    {
        return this.fim;
    }

    public int getMinutos ()
    {
        return this.minutos;
    }

    public int getMinutosRestantes ()
    {
        return this.minutosRestantes;
    }

    public double getNota ()
    {
        return this.nota;
    }

    public double getUrgencia ()
    {
        return this.urgencia;
    }

    public double getImportancia ()
    {
        return this.importancia;
    }

    public double getEncaixe ()
    {
        return this.encaixe;
    }

    // Mesma sessao com mais minutos no fim (usada para juntar sessoes seguidas da mesma tarefa).
    public SessaoAlocada estendida (int minutosExtras, int novosMinutosRestantes) throws Exception
    {
        return new SessaoAlocada (this.espacoId, this.tarefaId, this.inicio, this.fim.maisMinutos (minutosExtras),
                                  this.minutos + minutosExtras, novosMinutosRestantes, this.nota,
                                  this.urgencia, this.importancia, this.encaixe);
    }

    @Override
    public String toString ()
    {
        return "espacoId........: " + this.espacoId + "\n" +
               "tarefaId........: " + this.tarefaId + "\n" +
               "inicio..........: " + this.inicio + "\n" +
               "fim.............: " + this.fim + "\n" +
               "minutos.........: " + this.minutos + "\n" +
               "minutosRestantes: " + this.minutosRestantes + "\n" +
               "nota............: " + this.nota + "\n" +
               "urgencia........: " + this.urgencia + "\n" +
               "importancia.....: " + this.importancia + "\n" +
               "encaixe.........: " + this.encaixe;
    }

    @Override
    public boolean equals (Object obj)
    {
        if (obj == this) return true;
        if (obj == null) return false;

        if (obj.getClass () != this.getClass ()) return false;
        SessaoAlocada outro = (SessaoAlocada) obj;

        if (!this.espacoId.equals (outro.espacoId)) return false;
        if (!this.tarefaId.equals (outro.tarefaId)) return false;
        if (!this.inicio.equals (outro.inicio)) return false;
        if (!this.fim.equals (outro.fim)) return false;
        if (this.minutos != outro.minutos) return false;
        if (this.minutosRestantes != outro.minutosRestantes) return false;
        if (Double.compare (this.nota, outro.nota) != 0) return false;
        if (Double.compare (this.urgencia, outro.urgencia) != 0) return false;
        if (Double.compare (this.importancia, outro.importancia) != 0) return false;
        if (Double.compare (this.encaixe, outro.encaixe) != 0) return false;

        return true;
    }

    @Override
    public int hashCode ()
    {
        int ret = 666;

        ret = ret * 7 + this.espacoId.hashCode ();
        ret = ret * 7 + this.tarefaId.hashCode ();
        ret = ret * 7 + this.inicio.hashCode ();
        ret = ret * 7 + this.fim.hashCode ();
        ret = ret * 7 + ((Integer) this.minutos).hashCode ();
        ret = ret * 7 + ((Integer) this.minutosRestantes).hashCode ();
        ret = ret * 7 + ((Double) this.nota).hashCode ();
        ret = ret * 7 + ((Double) this.urgencia).hashCode ();
        ret = ret * 7 + ((Double) this.importancia).hashCode ();
        ret = ret * 7 + ((Double) this.encaixe).hashCode ();

        if (ret < 0) ret = -ret;
        return ret;
    }

    // construtor de copia
    public SessaoAlocada (SessaoAlocada modelo) throws Exception
    {
        if (modelo == null)
            throw new Exception ("Modelo ausente");

        this.espacoId         = modelo.espacoId;
        this.tarefaId         = modelo.tarefaId;
        this.inicio           = modelo.inicio;
        this.fim              = modelo.fim;
        this.minutos          = modelo.minutos;
        this.minutosRestantes = modelo.minutosRestantes;
        this.nota             = modelo.nota;
        this.urgencia         = modelo.urgencia;
        this.importancia      = modelo.importancia;
        this.encaixe          = modelo.encaixe;
    }

    @Override
    public Object clone ()
    {
        SessaoAlocada ret = null;

        try
        {
            ret = new SessaoAlocada (this);
        }
        catch (Exception erro)
        {} // sei que nao vai dar erro

        return ret;
    }
}
