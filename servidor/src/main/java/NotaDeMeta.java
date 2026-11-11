import java.io.*;

/**
 * A nota de uma meta e as tres partes que a compoem (cada uma de 0 a 1). Guarda tambem o prazo e o
 * peso da prioridade da meta, que servem de desempate quando as notas sao iguais.
 */
public class NotaDeMeta implements Comparable<NotaDeMeta>, Cloneable, Serializable
{
    private static final long serialVersionUID = 1L;

    private String   metaId;
    private double   nota;
    private double   urgencia;
    private double   lacuna;
    private double   importancia;
    private boolean  atrasada;
    private DataHora prazo;
    private double   pesoDaPrioridade;

    public NotaDeMeta (String metaId, double nota, double urgencia, double lacuna, double importancia, boolean atrasada, DataHora prazo, double pesoDaPrioridade) throws Exception
    {
        if (metaId == null)
            throw new Exception ("MetaId ausente");

        this.metaId           = metaId;
        this.nota             = nota;
        this.urgencia         = urgencia;
        this.lacuna           = lacuna;
        this.importancia      = importancia;
        this.atrasada         = atrasada;
        this.prazo            = prazo;
        this.pesoDaPrioridade = pesoDaPrioridade;
    }

    public String getMetaId ()
    {
        return this.metaId;
    }

    public double getNota ()
    {
        return this.nota;
    }

    public double getUrgencia ()
    {
        return this.urgencia;
    }

    public double getLacuna ()
    {
        return this.lacuna;
    }

    public double getImportancia ()
    {
        return this.importancia;
    }

    public boolean getAtrasada ()
    {
        return this.atrasada;
    }

    public DataHora getPrazo ()
    {
        return this.prazo;
    }

    public double getPesoDaPrioridade ()
    {
        return this.pesoDaPrioridade;
    }


    @Override
    public String toString ()
    {
        return "metaId..........: " + this.metaId + "\n" +
               "nota............: " + this.nota + "\n" +
               "urgencia........: " + this.urgencia + "\n" +
               "lacuna..........: " + this.lacuna + "\n" +
               "importancia.....: " + this.importancia + "\n" +
               "atrasada........: " + this.atrasada + "\n" +
               "prazo...........: " + this.prazo + "\n" +
               "pesoDaPrioridade: " + this.pesoDaPrioridade;
    }

    @Override
    public boolean equals (Object obj)
    {
        if (obj == this) return true;
        if (obj == null) return false;

        if (obj.getClass () != this.getClass ()) return false;
        NotaDeMeta outro = (NotaDeMeta) obj;

        if (!this.metaId.equals (outro.metaId)) return false;
        if (Double.compare (this.nota, outro.nota) != 0) return false;
        if (Double.compare (this.urgencia, outro.urgencia) != 0) return false;
        if (Double.compare (this.lacuna, outro.lacuna) != 0) return false;
        if (Double.compare (this.importancia, outro.importancia) != 0) return false;
        if (this.atrasada != outro.atrasada) return false;
        if (this.prazo == null ? outro.prazo != null : !this.prazo.equals (outro.prazo)) return false;
        if (Double.compare (this.pesoDaPrioridade, outro.pesoDaPrioridade) != 0) return false;

        return true;
    }

    @Override
    public int hashCode ()
    {
        int ret = 666;

        ret = ret * 7 + this.metaId.hashCode ();
        ret = ret * 7 + ((Double) this.nota).hashCode ();
        ret = ret * 7 + ((Double) this.urgencia).hashCode ();
        ret = ret * 7 + ((Double) this.lacuna).hashCode ();
        ret = ret * 7 + ((Double) this.importancia).hashCode ();
        ret = ret * 7 + ((Boolean) this.atrasada).hashCode ();
        ret = ret * 7 + (this.prazo == null ? 0 : this.prazo.hashCode ());
        ret = ret * 7 + ((Double) this.pesoDaPrioridade).hashCode ();

        if (ret < 0) ret = -ret;
        return ret;
    }

    @Override
    public int compareTo (NotaDeMeta outro)
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

        ret = Double.compare (outro.pesoDaPrioridade, this.pesoDaPrioridade);
        if (ret != 0) return ret;

        return this.metaId.compareTo (outro.metaId);
    }

    // construtor de copia
    public NotaDeMeta (NotaDeMeta modelo) throws Exception
    {
        if (modelo == null)
            throw new Exception ("Modelo ausente");

        this.metaId           = modelo.metaId;
        this.nota             = modelo.nota;
        this.urgencia         = modelo.urgencia;
        this.lacuna           = modelo.lacuna;
        this.importancia      = modelo.importancia;
        this.atrasada         = modelo.atrasada;
        this.prazo            = modelo.prazo;
        this.pesoDaPrioridade = modelo.pesoDaPrioridade;
    }

    @Override
    public Object clone ()
    {
        NotaDeMeta ret = null;

        try
        {
            ret = new NotaDeMeta (this);
        }
        catch (Exception erro)
        {} // sei que nao vai dar erro

        return ret;
    }
}
