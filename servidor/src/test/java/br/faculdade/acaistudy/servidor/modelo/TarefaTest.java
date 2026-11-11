package br.faculdade.acaistudy.servidor.modelo;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TarefaTest
{
    @Test
    void concluidaReconheceEstadoConcluida()
    {
        assertTrue (tarefaComSituacao ("concluida").concluida ());
    }

    @Test
    void concluidaNaoReconheceTarefaPendente()
    {
        assertFalse (tarefaComSituacao ("pendente").concluida ());
    }

    @Test
    void concluidaTrataSituacaoAusenteComoNaoConcluida()
    {
        assertFalse (tarefaComSituacao (null).concluida ());
    }

    private static Tarefa tarefaComSituacao (String situacao)
    {
        return new Tarefa ("t1", "Estudar", "exercicio", 5, null, null, null, null, situacao);
    }
}
