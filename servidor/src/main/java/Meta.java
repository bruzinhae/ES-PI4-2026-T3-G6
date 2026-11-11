import java.io.*;

/**
 * Meta ativa do estudante, candidata a receber a atencao da Sofia.
 *
 * tipo       geral, disciplina, habito ou projeto
 * prioridade baixa, media ou alta
 * progresso  0 a 100, ja calculado pelo backend
 * prazo      entrega; null quando a meta nao tem prazo
 */
public class Meta implements Serializable
{
    private static final long serialVersionUID = 1L;

    private String   id;
    private String   tipo;
    private String   prioridade;
    private int      progresso;
    private DataHora prazo;

    public String getId ()
    {
        return this.id;
    }

    public String getTipo ()
    {
        return this.tipo;
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
