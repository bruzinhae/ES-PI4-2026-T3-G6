package br.faculdade.acaistudy.servidor.comunicado;

import br.faculdade.acaistudy.servidor.modelo.RankingDoEspaco;
import br.faculdade.acaistudy.servidor.modelo.TarefaSemEspaco;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Resposta ao PedidoDeRanking: para cada espaço livre, o vetor de candidatos ordenado por nota
 * (maior primeiro), e a lista das tarefas que não couberam em nenhum espaço.
 */
public class Ranking extends Comunicado
{
    private final List<RankingDoEspaco> porEspaco;
    private final List<TarefaSemEspaco> semEspaco;

    public Ranking (List<RankingDoEspaco> porEspaco, List<TarefaSemEspaco> semEspaco) throws Exception
    {
        if (porEspaco == null)
            throw new Exception ("Ranking por espaço ausente");
        if (semEspaco == null)
            throw new Exception ("Lista de tarefas sem espaço ausente");

        this.porEspaco = porEspaco;
        this.semEspaco = semEspaco;
    }

    public String tipo ()
    {
        return "ranking";
    }

    protected Map<String, Object> campos ()
    {
        List<Object> espacos = new ArrayList<Object> ();
        for (RankingDoEspaco ranking : this.porEspaco)
            espacos.add (ranking.paraMapa ());

        List<Object> sem = new ArrayList<Object> ();
        for (TarefaSemEspaco tarefa : this.semEspaco)
            sem.add (tarefa.paraMapa ());

        Map<String, Object> mapa = new LinkedHashMap<String, Object> ();
        mapa.put ("porEspaco", espacos);
        mapa.put ("semEspaco", sem);
        return mapa;
    }
}
