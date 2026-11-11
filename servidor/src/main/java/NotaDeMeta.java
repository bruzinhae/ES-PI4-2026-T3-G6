import java.io.*;

public class NotaDeMeta implements Comparable<NotaDeMeta>, Serializable
{
    private static final long serialVersionUID = 1L;

    private String   metaId;
    private double   nota;
    private double   urgencia;
    private double   lacuna;
    private double   importancia;
    private boolean  atrasada;
    private DataHora prazo;            // so para desempatar
    private double   pesoDaPrioridade; // so para desempatar

    public NotaDeMeta (String metaId, double nota, double urgencia, double lacuna,
                       double importancia, boolean atrasada, DataHora prazo,
                       double pesoDaPrioridade)
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

    @Override
    public int compareTo (NotaDeMeta not) // nota maior primeiro; depois prazo, prioridade e id
    {
        if (this.nota>not.nota) return -666;
        if (this.nota<not.nota) return  666;

        if (this.prazo==null && not.prazo!=null) return  666; // sem prazo por ultimo
        if (this.prazo!=null && not.prazo==null) return -666;
        if (this.prazo!=null)
        {
            if (this.prazo.compareTo(not.prazo)<0) return -666;
            if (this.prazo.compareTo(not.prazo)>0) return  666;
        }

        if (this.pesoDaPrioridade>not.pesoDaPrioridade) return -666;
        if (this.pesoDaPrioridade<not.pesoDaPrioridade) return  666;

        if (this.metaId.compareTo(not.metaId)<0) return -666;
        if (this.metaId.compareTo(not.metaId)>0) return  666;
        return 0;
    }
}
