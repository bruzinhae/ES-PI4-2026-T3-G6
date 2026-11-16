import java.time.*;

public class Candidato implements Comparable<Candidato>
{
    private String         tarefaId;
    private double         nota;
    private int            minutosNoEspaco;
    private boolean        parcial; // a tarefa nao cabe inteira no espaco
    private double         urgencia;
    private double         importancia;
    private double         encaixe;
    private OffsetDateTime prazo;      // so para desempatar
    private int            prioridade; // so para desempatar

    public Candidato (String tarefaId, double nota, int minutosNoEspaco, boolean parcial,
                      double urgencia, double importancia, double encaixe,
                      OffsetDateTime prazo, int prioridade)
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

    @Override
    public int compareTo (Candidato can) // nota maior primeiro; depois prazo, prioridade e id
    {
        if (this.nota!=can.nota)
            return Double.compare (can.nota, this.nota);

        if (this.prazo==null && can.prazo!=null) return  1; // sem prazo por ultimo
        if (this.prazo!=null && can.prazo==null) return -1;
        if (this.prazo!=null && !this.prazo.isEqual (can.prazo))
            return this.prazo.isBefore (can.prazo) ? -1 : 1;

        if (this.prioridade!=can.prioridade)
            return can.prioridade - this.prioridade;

        return this.tarefaId.compareTo (can.tarefaId);
    }

    @Override
    public String toString ()
    {
        return "{\"tarefaId\":"      + EscritorDeJson.texto (this.tarefaId) +
               ",\"nota\":"          + this.nota +
               ",\"minutosNoEspaco\":" + this.minutosNoEspaco +
               ",\"parcial\":"       + this.parcial +
               ",\"urgencia\":"      + this.urgencia +
               ",\"importancia\":"   + this.importancia +
               ",\"encaixe\":"       + this.encaixe + "}";
    }
}
