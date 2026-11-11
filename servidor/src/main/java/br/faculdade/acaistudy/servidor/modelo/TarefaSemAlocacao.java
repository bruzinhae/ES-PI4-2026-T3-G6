package br.faculdade.acaistudy.servidor.modelo;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Tarefa que ficou (total ou parcialmente) sem espaço na alocação.
 * motivo: "sem_espacos", "nenhum_espaco_antes_do_prazo", "espacos_insuficientes" ou "alocacao_parcial".
 */
public record TarefaSemAlocacao (String tarefaId, String motivo, int minutosRestantes)
{
    public Map<String, Object> paraMapa ()
    {
        Map<String, Object> mapa = new LinkedHashMap<String, Object> ();
        mapa.put ("tarefaId", this.tarefaId);
        mapa.put ("motivo", this.motivo);
        mapa.put ("minutosRestantes", this.minutosRestantes);
        return mapa;
    }
}
