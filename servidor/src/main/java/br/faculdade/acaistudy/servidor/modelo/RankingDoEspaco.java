package br.faculdade.acaistudy.servidor.modelo;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Os candidatos de um espaço livre, do mais para o menos recomendado. */
public record RankingDoEspaco (String espacoId, List<Candidato> candidatos)
{
    public Map<String, Object> paraMapa ()
    {
        List<Object> itens = new ArrayList<Object> ();
        for (Candidato candidato : this.candidatos)
            itens.add (candidato.paraMapa ());

        Map<String, Object> mapa = new LinkedHashMap<String, Object> ();
        mapa.put ("espacoId", this.espacoId);
        mapa.put ("candidatos", itens);
        return mapa;
    }
}
