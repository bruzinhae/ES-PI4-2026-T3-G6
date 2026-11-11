package br.faculdade.acaistudy.servidor.modelo;

import java.util.LinkedHashMap;
import java.util.Map;

/** A nota de uma meta e as três partes que a compõem (cada uma de 0 a 1). */
public record NotaDeMeta (String metaId, double nota, double urgencia, double lacuna, double importancia, boolean atrasada)
{
    public Map<String, Object> paraMapa ()
    {
        Map<String, Object> mapa = new LinkedHashMap<String, Object> ();
        mapa.put ("metaId", this.metaId);
        mapa.put ("nota", this.nota);
        mapa.put ("atrasada", this.atrasada);

        Map<String, Object> composicao = new LinkedHashMap<String, Object> ();
        composicao.put ("urgencia", this.urgencia);
        composicao.put ("lacuna", this.lacuna);
        composicao.put ("importancia", this.importancia);
        mapa.put ("composicao", composicao);

        return mapa;
    }
}
