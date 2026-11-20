// Guilherme Domingues de Sousa - 22013871
package modelo;

import json.*;

// Tarefa que nao entrou como candidata em nenhum espaco, com o motivo
public class TarefaSemEspaco
{
    // tarefa que nao coube em nenhum espaco
    private String tarefaId;
    private String motivo; // sem_espacos ou nenhum_espaco_antes_do_prazo

    // Guarda os valores ja calculados
    public TarefaSemEspaco (String tarefaId, String motivo)
    {
        this.tarefaId = tarefaId;
        this.motivo   = motivo;
    }

    // Escreve o objeto em JSON; o Parceiro envia esse texto ao cliente
    @Override
    public String toString ()
    {
        return "{\"tarefaId\":" + EscritorDeJson.texto (this.tarefaId) +
               ",\"motivo\":"   + EscritorDeJson.texto (this.motivo) + "}";
    }
}
