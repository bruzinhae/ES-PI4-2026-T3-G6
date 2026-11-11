import java.io.*;

public class Meta implements Serializable
{
    private static final long serialVersionUID = 1L;

    private String   id;
    private String   tipo;       // geral, disciplina, habito ou projeto
    private String   prioridade; // baixa, media ou alta
    private int      progresso;  // de 0 a 100
    private DataHora prazo;      // null se a meta nao tem prazo

    public String getId ()
    {
        return this.id;
    }

    public String getPrioridade ()
    {
        return this.prioridade;
    }

    public int getProgresso ()
    {
        return this.progresso;
    }

    public DataHora getPrazo ()
    {
        return this.prazo;
    }

    public boolean habito ()
    {
        return "habito".equals (this.tipo);
    }
}
