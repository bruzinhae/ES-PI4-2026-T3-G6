// Guilherme Domingues de Sousa - 22013871
package modelo;

import json.*;

// Tarefa que ficou sem horario (ou so com parte) na alocacao, com o motivo e os
// minutos que faltam
public class TarefaSemAlocacao
{
    // tarefa que ficou sem horario
    private String tarefaId;
    // alocacao_parcial, sem_espacos, espacos_insuficientes ou nenhum_espaco_antes_do_prazo
    private String motivo;
    // minutos que ainda faltam
    private int    minutosRestantes;

    // Guarda os valores ja calculados
    public TarefaSemAlocacao (String tarefaId, String motivo, int minutosRestantes)
    {
        this.tarefaId         = tarefaId;
        this.motivo           = motivo;
        this.minutosRestantes = minutosRestantes;
    }

    // Escreve o objeto em JSON; o Parceiro envia esse texto ao cliente
    @Override
    public String toString ()
    {
        return "{\"tarefaId\":"        + EscritorDeJson.texto (this.tarefaId) +
               ",\"motivo\":"          + EscritorDeJson.texto (this.motivo) +
               ",\"minutosRestantes\":" + this.minutosRestantes + "}";
    }
}
