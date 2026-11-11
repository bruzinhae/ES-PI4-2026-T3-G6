package br.faculdade.acaistudy.servidor.comunicado;

import br.faculdade.acaistudy.servidor.modelo.NotaDeMeta;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Resposta ao PedidoDeMetas: as metas da mais para a menos urgente, a meta foco (a primeira da lista,
 * ou null se não há metas ativas) e as datas propostas (AAAA-MM-DD) para os marcos novos da meta foco.
 */
public class PrioridadeDeMetas extends Comunicado
{
    private final List<NotaDeMeta> ranking;
    private final String           foco;
    private final List<String>     datasDosMarcos;

    public PrioridadeDeMetas (List<NotaDeMeta> ranking, String foco, List<String> datasDosMarcos) throws Exception
    {
        if (ranking == null)
            throw new Exception ("Ranking de metas ausente");
        if (datasDosMarcos == null)
            throw new Exception ("Datas dos marcos ausentes");

        this.ranking        = ranking;
        this.foco           = foco;
        this.datasDosMarcos = datasDosMarcos;
    }

    public String tipo ()
    {
        return "prioridadeDeMetas";
    }

    protected Map<String, Object> campos ()
    {
        List<Object> itens = new ArrayList<Object> ();
        for (NotaDeMeta nota : this.ranking)
            itens.add (nota.paraMapa ());

        Map<String, Object> mapa = new LinkedHashMap<String, Object> ();
        mapa.put ("ranking", itens);
        mapa.put ("foco", this.foco);
        mapa.put ("datasDosMarcos", this.datasDosMarcos);
        return mapa;
    }
}
