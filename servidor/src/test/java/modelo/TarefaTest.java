// Bernardo Alberto Amaro - 25015832
package modelo;

import json.*;
import java.lang.reflect.Field;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TarefaTest
{
    @Test
    void concluidaReconheceEstadoConcluida() throws Exception
    {
        // Reconhece a tarefa cujo estado é concluída.
        assertTrue (tarefaComSituacao ("concluida").concluida ());
    }

    @Test
    void concluidaNaoReconheceTarefaPendente() throws Exception
    {
        // Mantém tarefas pendentes como não concluídas.
        assertFalse (tarefaComSituacao ("pendente").concluida ());
    }

    @Test
    void concluidaNaoReconheceTarefaEmAndamento() throws Exception
    {
        // Mantém tarefas em andamento elegíveis para o ranking.
        assertFalse (tarefaComSituacao ("em_andamento").concluida ());
    }

    @Test
    void concluidaTrataSituacaoAusenteComoNaoConcluida() throws Exception
    {
        // Trata estado ausente como tarefa ainda não concluída.
        assertFalse (tarefaComSituacao (null).concluida ());
    }

    @Test
    void concluidaDistingueMaiusculasNoEstado() throws Exception
    {
        // Reconhece somente o valor de estado definido pelo protocolo.
        assertFalse (tarefaComSituacao ("Concluida").concluida ());
    }

    private static Tarefa tarefaComSituacao (String situacao)
    throws Exception
    {
        String json = "{\"id\":\"t\",\"categoria\":\"estudos\",\"tipo\":\"outro\"," +
                      "\"prioridade\":5,\"situacao\":\"pendente\"}";
        Tarefa tarefa = new Tarefa (new LeitorDeJson (json).leObjeto ());

        Field atributo = Tarefa.class.getDeclaredField ("situacao");
        atributo.setAccessible (true);
        atributo.set (tarefa, situacao);
        return tarefa;
    }
}
