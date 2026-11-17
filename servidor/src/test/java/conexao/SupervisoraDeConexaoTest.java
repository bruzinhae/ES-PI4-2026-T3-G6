package conexao;

import json.*;
import org.junit.jupiter.api.Test;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SupervisoraDeConexaoTest
{
    private static final OffsetDateTime AGORA = OffsetDateTime.parse ("2026-11-12T10:00:00Z");

    @Test
    void pedidoValidoDevolveRankingComCandidato() throws Exception
    {
        // Confirma que um pedido em JSON produz candidatos para o espaço disponível.
        String tarefa = "{\"id\":\"t1\",\"categoria\":\"estudos\",\"tipo\":\"prova\",\"prioridade\":8," +
                        "\"prazo\":\"" + mais (24 * 60) + "\",\"minutosEstimados\":60," +
                        "\"dificuldade\":4,\"peso\":4,\"situacao\":\"pendente\"}";

        ObjetoJson resposta = atenderPedido (pedidoDeRanking (espaco ("e1", 0, 90), tarefa, 3));
        assertEquals ("ranking", resposta.getTexto ("tipo"));

        ArrayList<ObjetoJson> rankings = resposta.getObjetos ("porEspaco");
        assertEquals (1, rankings.size ());
        assertEquals ("e1", rankings.get (0).getTexto ("espacoId"));

        ArrayList<ObjetoJson> candidatos = rankings.get (0).getObjetos ("candidatos");
        assertEquals (1, candidatos.size ());

        ObjetoJson candidato = candidatos.get (0);
        assertEquals ("t1", candidato.getTexto ("tarefaId"));
        assertEquals (60, candidato.getInteiro ("minutosNoEspaco"));
        assertFalse (candidato.getLogico ("parcial"));
        assertTrue ((Double) candidato.get ("nota") > 0.0);
        assertTrue (resposta.getObjetos ("semEspaco").isEmpty ());
    }

    @Test
    void falhaNoCalculoDevolveErroSemEncerrarAConexao()
    throws Exception
    {
        // Verifica que uma falha no cálculo (limite negativo) é devolvida como erro e a conexão segue aberta.
        ObjetoJson resposta = atenderPedido (pedidoDeRanking (espaco ("e1", 0, 60), "", -1));

        assertEquals ("erro", resposta.getTexto ("tipo"));
        assertTrue (resposta.getTexto ("mensagem").contains ("Nao foi possivel calcular o ranking"));
    }

    @Test
    void tarefaConcluidaNaoApareceNoRankingNemNaListaSemEspaco()
    throws Exception
    {
        // Exclui tarefas concluídas tanto dos candidatos quanto das tarefas sem espaço.
        ObjetoJson resposta = atenderPedido (pedidoDeRanking (
            espaco ("e1", 0, 60),
            tarefa ("t1", "concluida", 30, 120) + "," + tarefa ("t2", "pendente", 30, 120),
            3));

        ArrayList<ObjetoJson> candidatos = resposta.getObjetos ("porEspaco").get (0).getObjetos ("candidatos");

        assertEquals (1, candidatos.size ());
        assertEquals ("t2", candidatos.get (0).getTexto ("tarefaId"));
        assertTrue (resposta.getObjetos ("semEspaco").isEmpty ());
    }

    @Test
    void espacoCurtoNaoGeraCandidatoERegistraTarefaSemEspaco()
    throws Exception
    {
        // Registra como sem espaço a tarefa que não cabe no intervalo mínimo aceito.
        ObjetoJson resposta = atenderPedido (pedidoDeRanking (
            espaco ("e1", 0, 14), tarefa ("t1", "pendente", 10, 120), 3));

        ArrayList<ObjetoJson> semEspaco = resposta.getObjetos ("semEspaco");

        assertTrue (resposta.getObjetos ("porEspaco").get (0).getObjetos ("candidatos").isEmpty ());
        assertEquals (1, semEspaco.size ());
        assertEquals ("t1", semEspaco.get (0).getTexto ("tarefaId"));
        assertEquals ("nenhum_espaco_antes_do_prazo", semEspaco.get (0).getTexto ("motivo"));
    }

    @Test
    void prazoAnteriorAoFimDoEspacoImpedeCandidato()
    throws Exception
    {
        // Não recomenda uma tarefa cujo prazo ocorre antes do fim da sessão.
        ObjetoJson resposta = atenderPedido (pedidoDeRanking (
            espaco ("e1", 0, 30), tarefa ("t1", "pendente", 30, 15), 3));

        ArrayList<ObjetoJson> semEspaco = resposta.getObjetos ("semEspaco");

        assertTrue (resposta.getObjetos ("porEspaco").get (0).getObjetos ("candidatos").isEmpty ());
        assertEquals (1, semEspaco.size ());
        assertEquals ("t1", semEspaco.get (0).getTexto ("tarefaId"));
    }

    @Test
    void semEspacosInformaMotivoEspecifico()
    throws Exception
    {
        // Distingue a ausência total de espaços de um espaço incompatível com a tarefa.
        ObjetoJson resposta = atenderPedido (pedidoDeRanking (
            "", tarefa ("t1", "pendente", 30, 120), 3));

        ArrayList<ObjetoJson> semEspaco = resposta.getObjetos ("semEspaco");

        assertTrue (resposta.getObjetos ("porEspaco").isEmpty ());
        assertEquals (1, semEspaco.size ());
        assertEquals ("sem_espacos", semEspaco.get (0).getTexto ("motivo"));
    }

    private static String mais (int minutos)
    {
        return AGORA.plusMinutes (minutos).toString ();
    }

    private static String espaco (String id, int inicioEmMinutos, int fimEmMinutos)
    {
        return "{\"id\":\"" + id + "\",\"inicio\":\"" + mais (inicioEmMinutos) +
               "\",\"fim\":\"" + mais (fimEmMinutos) + "\"}";
    }

    private static String tarefa (String id, String situacao, int minutos, int prazoEmMinutos)
    {
        return "{\"id\":\"" + id + "\",\"categoria\":\"estudos\",\"tipo\":\"exercicio\",\"prioridade\":5," +
               "\"prazo\":\"" + mais (prazoEmMinutos) + "\",\"minutosEstimados\":" + minutos +
               ",\"situacao\":\"" + situacao + "\"}";
    }

    private static String pedidoDeRanking (String espacos, String tarefas, int limite)
    {
        return "{\"tipo\":\"pedidoDeRanking\",\"agora\":\"" + AGORA + "\"," +
               "\"preferencias\":{\"janelaFoco\":\"manha\",\"focoMatinal\":true," +
               "\"duracaoMinutos\":50,\"antifadiga\":true}," +
               "\"limite\":" + limite + ",\"alocar\":false," +
               "\"espacos\":[" + espacos + "],\"tarefas\":[" + tarefas + "]}";
    }

    private static ObjetoJson atenderPedido (String pedido)
    {
        ArrayList<Parceiro> usuarios = new ArrayList<> ();
        AtomicReference<Exception> falhaDoAtendimento = new AtomicReference<> ();

        try (ServerSocket escuta = new ServerSocket (0, 1, InetAddress.getLoopbackAddress ()))
        {
            Thread atendimento = new Thread (() ->
            {
                try
                {
                    new SupervisoraDeConexao (escuta.accept (), usuarios).run ();
                }
                catch (Exception erro)
                {
                    falhaDoAtendimento.set (erro);
                }
            });
            atendimento.setDaemon (true);
            atendimento.start ();

            try (Socket cliente = new Socket (InetAddress.getLoopbackAddress (), escuta.getLocalPort ()))
            {
                cliente.setSoTimeout (2_000);
                try (PrintWriter transmissor = new PrintWriter (
                         new OutputStreamWriter (cliente.getOutputStream (), "UTF-8"), true);
                     BufferedReader receptor = new BufferedReader (
                         new InputStreamReader (cliente.getInputStream (), "UTF-8")))
                {
                    transmissor.println (pedido);
                    ObjetoJson resposta = new LeitorDeJson (receptor.readLine ()).leObjeto ();

                    transmissor.println ("{\"tipo\":\"pedidoParaSair\"}");

                    atendimento.join (2_000);
                    assertFalse (atendimento.isAlive (), "A conexão deve encerrar após pedidoParaSair");
                    assertNull (falhaDoAtendimento.get ());
                    assertTrue (usuarios.isEmpty (), "A conexão encerrada deve remover o parceiro");

                    return resposta;
                }
            }
        }
        catch (Exception erro)
        {
            throw new AssertionError ("Falha ao exercitar o serviço pela conexão TCP em JSON", erro);
        }
    }
}
