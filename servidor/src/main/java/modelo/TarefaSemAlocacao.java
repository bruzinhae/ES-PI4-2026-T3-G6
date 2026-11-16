package modelo;

import json.*;

public class TarefaSemAlocacao
{
    private String tarefaId;
    private String motivo;
    private int    minutosRestantes;

    public TarefaSemAlocacao (String tarefaId, String motivo, int minutosRestantes)
    {
        this.tarefaId         = tarefaId;
        this.motivo           = motivo;
        this.minutosRestantes = minutosRestantes;
    }

    @Override
    public String toString ()
    {
        return "{\"tarefaId\":"        + EscritorDeJson.texto (this.tarefaId) +
               ",\"motivo\":"          + EscritorDeJson.texto (this.motivo) +
               ",\"minutosRestantes\":" + this.minutosRestantes + "}";
    }
}
