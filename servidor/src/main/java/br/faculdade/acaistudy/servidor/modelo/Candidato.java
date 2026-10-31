package br.faculdade.acaistudy.servidor.modelo;

import java.util.LinkedHashMap;
import java.util.Map;

/** Uma tarefa candidata a um espaço, com a nota final e as três partes que a compõem. */
public record Candidato (String tarefaId, double nota, int minutosNoEspaco, boolean parcial,
                         double urgencia, double importancia, double encaixe)
{
    public Map<String, Object> paraMapa ()
    {
        Map<String, Object> composicao = new LinkedHashMap<String, Object> ();
        composicao.put ("urgencia", this.urgencia);
        composicao.put ("importancia", this.importancia);
        composicao.put ("encaixe", this.encaixe);

        Map<String, Object> mapa = new LinkedHashMap<String, Object> ();
        mapa.put ("tarefaId", this.tarefaId);
        mapa.put ("nota", this.nota);
        mapa.put ("minutosNoEspaco", this.minutosNoEspaco);
        mapa.put ("parcial", this.parcial);
        mapa.put ("composicao", composicao);
        return mapa;
    }
}
