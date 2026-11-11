import java.util.*;

public class PrioridadeDeMetas extends Comunicado
{
    private static final long serialVersionUID = 1L;

    private ArrayList<NotaDeMeta> ranking;        // da mais para a menos urgente
    private String                foco;           // id da meta de maior nota (null sem metas)
    private ArrayList<String>     datasDosMarcos; // AAAA-MM-DD, so da meta foco

    public PrioridadeDeMetas (ArrayList<NotaDeMeta> ranking, String foco,
                              ArrayList<String> datasDosMarcos)
    {
        this.ranking        = ranking;
        this.foco           = foco;
        this.datasDosMarcos = datasDosMarcos;
    }

    public String toString ()
    {
        return "Prioridade de " + this.ranking.size () + " meta(s), foco: " + this.foco;
    }
}
