import java.util.*;

// Resposta ao PedidoDeMetas: as metas da mais para a menos urgente, a meta foco (a primeira da lista,
// ou null se não há metas ativas) e as datas propostas (AAAA-MM-DD) para os marcos novos da meta foco.
public class PrioridadeDeMetas extends Comunicado
{
    private static final long serialVersionUID = 1L;

    private ArrayList<NotaDeMeta> ranking;
    private String                foco;
    private ArrayList<String>     datasDosMarcos;

    public PrioridadeDeMetas (ArrayList<NotaDeMeta> ranking, String foco, ArrayList<String> datasDosMarcos)
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
