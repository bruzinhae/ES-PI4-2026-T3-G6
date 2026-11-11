import java.util.*;

public class Ranking extends Comunicado
{
    private static final long serialVersionUID = 1L;

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

    public String toString ()
    {
        return "Ranking de " + this.porEspaco.size () + " espaco(s), " +
               this.semEspaco.size () + " tarefa(s) sem espaco";
    }
}
