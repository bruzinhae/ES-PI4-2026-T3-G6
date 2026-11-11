import java.io.*;

/**
 * Uma tarefa candidata a um espaco, com a nota final e as tres partes que a compoem. Guarda tambem o
 * prazo e a prioridade da tarefa, que servem de desempate quando as notas sao iguais.
 */
public class Candidato implements Comparable<Candidato>, Cloneable, Serializable
{
    private static final long serialVersionUID = 1L;

    private String   tarefaId;
    private double   nota;
    private int      minutosNoEspaco;
    private boolean  parcial;
    private double   urgencia;
    private double   importancia;
    private double   encaixe;
    private DataHora prazo;
    private int      prioridade;

    public Candidato (String tarefaId, double nota, int minutosNoEspaco, boolean parcial, double urgencia, double importancia, double encaixe, DataHora prazo, int prioridade) throws Exception
    {
        if (tarefaId == null)
            throw new Exception ("TarefaId ausente");

        this.tarefaId        = tarefaId;
        this.nota            = nota;
        this.minutosNoEspaco = minutosNoEspaco;
        this.parcial         = parcial;
        this.urgencia        = urgencia;
        this.importancia     = importancia;
        this.encaixe         = encaixe;
        this.prazo           = prazo;
        this.prioridade      = prioridade;
    }

    public String getTarefaId ()
    {
        return this.tarefaId;
    }

    public double getNota ()
    {
        return this.nota;
    }

    public int getMinutosNoEspaco ()
    {
        return this.minutosNoEspaco;
    }

    public boolean getParcial ()
    {
        return this.parcial;
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

    public DataHora getPrazo ()
    {
        return this.prazo;
    }

    public int getPrioridade ()
    {
        return this.prioridade;
    }


    @Override
    public String toString ()
    {
        return "tarefaId.......: " + this.tarefaId + "\n" +
               "nota...........: " + this.nota + "\n" +
               "minutosNoEspaco: " + this.minutosNoEspaco + "\n" +
               "parcial........: " + this.parcial + "\n" +
               "urgencia.......: " + this.urgencia + "\n" +
               "importancia....: " + this.importancia + "\n" +
               "encaixe........: " + this.encaixe + "\n" +
               "prazo..........: " + this.prazo + "\n" +
               "prioridade.....: " + this.prioridade;
    }

    @Override
    public boolean equals (Object obj)
    {
        if (obj == this) return true;
        if (obj == null) return false;

        if (obj.getClass () != this.getClass ()) return false;
        Candidato outro = (Candidato) obj;

        if (!this.tarefaId.equals (outro.tarefaId)) return false;
        if (Double.compare (this.nota, outro.nota) != 0) return false;
        if (this.minutosNoEspaco != outro.minutosNoEspaco) return false;
        if (this.parcial != outro.parcial) return false;
        if (Double.compare (this.urgencia, outro.urgencia) != 0) return false;
        if (Double.compare (this.importancia, outro.importancia) != 0) return false;
        if (Double.compare (this.encaixe, outro.encaixe) != 0) return false;
        if (this.prazo == null ? outro.prazo != null : !this.prazo.equals (outro.prazo)) return false;
        if (this.prioridade != outro.prioridade) return false;

        return true;
    }

    @Override
    public int hashCode ()
    {
        int ret = 666;

        ret = ret * 7 + this.tarefaId.hashCode ();
        ret = ret * 7 + ((Double) this.nota).hashCode ();
        ret = ret * 7 + ((Integer) this.minutosNoEspaco).hashCode ();
        ret = ret * 7 + ((Boolean) this.parcial).hashCode ();
        ret = ret * 7 + ((Double) this.urgencia).hashCode ();
        ret = ret * 7 + ((Double) this.importancia).hashCode ();
        ret = ret * 7 + ((Double) this.encaixe).hashCode ();
        ret = ret * 7 + (this.prazo == null ? 0 : this.prazo.hashCode ());
        ret = ret * 7 + ((Integer) this.prioridade).hashCode ();

        if (ret < 0) ret = -ret;
        return ret;
    }

    @Override
    public int compareTo (Candidato outro)
    {
        // nota maior primeiro; empates: prazo mais cedo (sem prazo por ultimo), prioridade maior e id
        int ret = Double.compare (outro.nota, this.nota);
        if (ret != 0) return ret;

        if (this.prazo == null && outro.prazo != null) return 1;
        if (this.prazo != null && outro.prazo == null) return -1;
        if (this.prazo != null)
        {
            ret = this.prazo.compareTo (outro.prazo);
            if (ret != 0) return ret;
        }

        ret = Integer.compare (outro.prioridade, this.prioridade);
        if (ret != 0) return ret;

        return this.tarefaId.compareTo (outro.tarefaId);
    }

    // construtor de copia
    public Candidato (Candidato modelo) throws Exception
    {
        if (modelo == null)
            throw new Exception ("Modelo ausente");

        this.tarefaId        = modelo.tarefaId;
        this.nota            = modelo.nota;
        this.minutosNoEspaco = modelo.minutosNoEspaco;
        this.parcial         = modelo.parcial;
        this.urgencia        = modelo.urgencia;
        this.importancia     = modelo.importancia;
        this.encaixe         = modelo.encaixe;
        this.prazo           = modelo.prazo;
        this.prioridade      = modelo.prioridade;
    }

    @Override
    public Object clone ()
    {
        Candidato ret = null;

        try
        {
            ret = new Candidato (this);
        }
        catch (Exception erro)
        {} // sei que nao vai dar erro

        return ret;
    }
}
