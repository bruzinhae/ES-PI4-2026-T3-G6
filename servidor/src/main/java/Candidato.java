import java.io.*;

// Uma tarefa candidata a um espaco, com a nota final e as tres partes que a compoem. Guarda tambem o
// prazo e a prioridade da tarefa, que servem de desempate quando as notas sao iguais.
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

    @Override
    public int compareTo (Candidato can)
    {
        // nota maior primeiro; empates: prazo mais cedo (sem prazo por ultimo), prioridade maior e id
        if (this.nota>can.nota) return -666;
        if (this.nota<can.nota) return  666;

        if (this.prazo==null && can.prazo!=null) return  666;
        if (this.prazo!=null && can.prazo==null) return -666;
        if (this.prazo!=null)
        {
            if (this.prazo.compareTo(can.prazo)<0) return -666;
            if (this.prazo.compareTo(can.prazo)>0) return  666;
        }

        if (this.prioridade>can.prioridade) return -666;
        if (this.prioridade<can.prioridade) return  666;

        if (this.tarefaId.compareTo(can.tarefaId)<0) return -666;
        if (this.tarefaId.compareTo(can.tarefaId)>0) return  666;
        return 0;
    }

}
