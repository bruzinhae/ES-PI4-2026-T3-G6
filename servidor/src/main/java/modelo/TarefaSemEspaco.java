package modelo;

import json.*;

public class TarefaSemEspaco
{
    private String tarefaId;
    private String motivo; // sem_espacos ou nenhum_espaco_antes_do_prazo

    public TarefaSemEspaco (String tarefaId, String motivo)
    {
        this.tarefaId = tarefaId;
        this.motivo   = motivo;
    }

    @Override
    public String toString ()
    {
        return "{\"tarefaId\":" + EscritorDeJson.texto (this.tarefaId) +
               ",\"motivo\":"   + EscritorDeJson.texto (this.motivo) + "}";
    }
}
