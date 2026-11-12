import java.util.*;

public class PrioridadeDeMetas extends Comunicado
{
    private static final long serialVersionUID = 1L;

    private ArrayList<NotaDeMeta> ranking;       // da mais para a menos urgente
    private String                foco;          // id da meta de maior nota (null sem metas)
    private ArrayList<Integer>    diasDosMarcos; // dias desde 1970-01-01, so da meta foco

    public PrioridadeDeMetas (ArrayList<NotaDeMeta> ranking, String foco,
                              ArrayList<Integer> diasDosMarcos)
    {
        this.ranking       = ranking;
        this.foco          = foco;
        this.diasDosMarcos = diasDosMarcos;
    }

    public String toString ()
    {
        return "Prioridade de " + this.ranking.size () + " meta(s), foco: " + this.foco;
    }
}
