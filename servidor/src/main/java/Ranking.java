import java.util.*;

// Resposta ao PedidoDeRanking: para cada espaço livre, o vetor de candidatos ordenado por nota
// (maior primeiro), e a lista das tarefas que não couberam em nenhum espaço. Quando o pedido pede a
// alocação, vem também a Alocacao (senão ela é null).
public class Ranking extends Comunicado
{
    private static final long serialVersionUID = 1L;

    private ArrayList<RankingDoEspaco> porEspaco;
    private ArrayList<TarefaSemEspaco> semEspaco;
    private Alocacao                   alocacao;

    public Ranking (ArrayList<RankingDoEspaco> porEspaco, ArrayList<TarefaSemEspaco> semEspaco, Alocacao alocacao)
    {
        this.porEspaco = porEspaco;
        this.semEspaco = semEspaco;
        this.alocacao  = alocacao;
    }

    public String toString ()
    {
        return "Ranking de " + this.porEspaco.size () + " espaco(s), " + this.semEspaco.size () + " tarefa(s) sem espaco";
    }
}
