import java.util.ArrayList;

/**
 * Resposta ao PedidoDeMetas: as metas da mais para a menos urgente, a meta foco (a primeira da lista,
 * ou null se não há metas ativas) e as datas propostas (AAAA-MM-DD) para os marcos novos da meta foco.
 */
public class PrioridadeDeMetas extends Comunicado
{
    private static final long serialVersionUID = 1L;

    private ArrayList<NotaDeMeta> ranking;
    private String                foco;
    private ArrayList<String>     datasDosMarcos;

    public PrioridadeDeMetas (ArrayList<NotaDeMeta> ranking, String foco, ArrayList<String> datasDosMarcos) throws Exception
    {
        if (ranking == null)
            throw new Exception ("Ranking de metas ausente");
        if (datasDosMarcos == null)
            throw new Exception ("Datas dos marcos ausentes");

        this.ranking        = ranking;
        this.foco           = foco;
        this.datasDosMarcos = datasDosMarcos;
    }

    public ArrayList<NotaDeMeta> getRanking ()      { return this.ranking; }
    public String getFoco ()                        { return this.foco; }
    public ArrayList<String> getDatasDosMarcos ()   { return this.datasDosMarcos; }

    @Override
    public String toString ()
    {
        return "Prioridade de " + this.ranking.size () + " meta(s), foco: " + this.foco;
    }
}
