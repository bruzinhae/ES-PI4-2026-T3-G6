import java.io.*;

/**
 * A nota de uma meta e as tres partes que a compoem (cada uma de 0 a 1). Guarda tambem o prazo e o
 * peso da prioridade da meta, que servem de desempate quando as notas sao iguais.
 */
public class NotaDeMeta implements Comparable<NotaDeMeta>, Serializable
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

    public NotaDeMeta (String metaId, double nota, double urgencia, double lacuna, double importancia, boolean atrasada, DataHora prazo, double pesoDaPrioridade)
    {
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

    public double getImportancia ()
    {
        return this.importancia;
    }

    public DataHora getPrazo ()
    {
        return this.prazo;
    }

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

}
