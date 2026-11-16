import java.util.*;

public class Ranking extends Comunicado
{
    private ArrayList<RankingDoEspaco> porEspaco;
    private ArrayList<TarefaSemEspaco> semEspaco;
    private Alocacao                   alocacao; // null se o pedido nao pediu alocacao

    public Ranking (ArrayList<RankingDoEspaco> porEspaco, ArrayList<TarefaSemEspaco> semEspaco,
                    Alocacao alocacao)
    {
        this.porEspaco = porEspaco;
        this.semEspaco = semEspaco;
        this.alocacao  = alocacao;
    }

    @Override
    public String toString ()
    {
        return "{\"tipo\":\"ranking\",\"porEspaco\":" + EscritorDeJson.lista (this.porEspaco) +
               ",\"semEspaco\":" + EscritorDeJson.lista (this.semEspaco) +
               ",\"alocacao\":"  + this.alocacao + "}";
    }
}
