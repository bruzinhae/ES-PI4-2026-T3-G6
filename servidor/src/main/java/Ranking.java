import java.util.ArrayList;

/**
 * Resposta ao PedidoDeRanking: para cada espaço livre, o vetor de candidatos ordenado por nota
 * (maior primeiro), e a lista das tarefas que não couberam em nenhum espaço.
 */
public class Ranking extends Comunicado
{
    private ArrayList<RankingDoEspaco> porEspaco;
    private ArrayList<TarefaSemEspaco> semEspaco;
    private Alocacao                   alocacao; // null quando o pedido não pediu alocação

    public Ranking (ArrayList<RankingDoEspaco> porEspaco, ArrayList<TarefaSemEspaco> semEspaco) throws Exception
    {
        this (porEspaco, semEspaco, null);
    }

    public Ranking (ArrayList<RankingDoEspaco> porEspaco, ArrayList<TarefaSemEspaco> semEspaco, Alocacao alocacao) throws Exception
    {
        if (porEspaco == null)
            throw new Exception ("Ranking por espaço ausente");
        if (semEspaco == null)
            throw new Exception ("Lista de tarefas sem espaço ausente");

        this.porEspaco = porEspaco;
        this.semEspaco = semEspaco;
        this.alocacao  = alocacao;
    }

    @Override
    public String tipo ()
    {
        return "ranking";
    }

    @Override
    protected Objeto campos ()
    {
        ArrayList<Object> espacos = new ArrayList<Object> ();
        for (RankingDoEspaco ranking : this.porEspaco)
            espacos.add (ranking.paraObjeto ());

        ArrayList<Object> sem = new ArrayList<Object> ();
        for (TarefaSemEspaco tarefa : this.semEspaco)
            sem.add (tarefa.paraObjeto ());

        Objeto ret = new Objeto ();
        ret.guarde ("porEspaco", espacos);
        ret.guarde ("semEspaco", sem);

        if (this.alocacao != null)
        {
            Objeto campos = this.alocacao.paraObjeto ();

            for (int i = 0; i < campos.getQuantidade (); i++)
                ret.guarde (campos.getNome (i), campos.getValor (i));
        }

        return ret;
    }

    @Override
    public String toString ()
    {
        return "Ranking de " + this.porEspaco.size () + " espaco(s), " + this.semEspaco.size () + " tarefa(s) sem espaco";
    }
}
