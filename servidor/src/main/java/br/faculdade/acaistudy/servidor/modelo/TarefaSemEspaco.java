package br.faculdade.acaistudy.servidor.modelo;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Tarefa que não coube em nenhum dos espaços enviados.
 * motivo: "sem_espacos" ou "nenhum_espaco_antes_do_prazo".
 */
public record TarefaSemEspaco (String tarefaId, String motivo)
{
    public Map<String, Object> paraMapa ()
    {
        Map<String, Object> mapa = new LinkedHashMap<String, Object> ();
        mapa.put ("tarefaId", this.tarefaId);
        mapa.put ("motivo", this.motivo);
        return mapa;
    }
}
