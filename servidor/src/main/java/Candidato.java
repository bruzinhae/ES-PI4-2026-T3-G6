import java.io.*;

/**
 * Uma tarefa candidata a um espaco, com a nota final e as tres partes que a compoem. Guarda tambem o
 * prazo e a prioridade da tarefa, que servem de desempate quando as notas sao iguais.
 */
public class Candidato implements Comparable<Candidato>, Serializable
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

    public Candidato (String tarefaId, double nota, int minutosNoEspaco, boolean parcial, double urgencia, double importancia, double encaixe, DataHora prazo, int prioridade)
    {
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

}
