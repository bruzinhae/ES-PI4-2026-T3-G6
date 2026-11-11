package br.faculdade.acaistudy.servidor;

import br.faculdade.acaistudy.servidor.json.Campos;
import br.faculdade.acaistudy.servidor.json.Json;
import org.junit.jupiter.api.Test;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SupervisoraDeConexaoTest
{
    @Test
    void pedidoValidoDevolveRankingComCandidato()
    {
        String pedido = """
            {"tipo":"pedidoDeRanking",
             "agora":"2026-11-10T09:00:00Z",
             "preferencias":{"janelaFoco":"manha","focoMatinal":true,"duracaoMinutos":50},
             "limite":3,
             "espacos":[{"id":"e1","inicio":"2026-11-10T09:00:00Z","fim":"2026-11-10T10:30:00Z"}],
             "tarefas":[
               {"id":"t1","titulo":"Prova","tipo":"prova","prioridade":8,
                "prazo":"2026-11-11T12:00:00Z","minutosEstimados":60,
                "situacao":"pendente","disciplina":{"dificuldade":4,"peso":4}},
               {"id":"t2","titulo":"Concluida","tipo":"exercicio","prioridade":5,
                "situacao":"concluida"}
             ]}
            """;

        Map<String, Object> resposta = enviarPedido (pedido);

        assertEquals ("ranking", resposta.get ("tipo"), resposta.toString ());
        List<Object> rankings = lista (resposta, "porEspaco");
        assertEquals (1, rankings.size ());

        Map<String, Object> ranking = objeto (rankings.get (0));
        assertEquals ("e1", ranking.get ("espacoId"));
        List<Object> candidatos = lista (ranking, "candidatos");
        assertEquals (1, candidatos.size ());

        Map<String, Object> candidato = objeto (candidatos.get (0));
        assertEquals ("t1", candidato.get ("tarefaId"));
        assertEquals (60.0, candidato.get ("minutosNoEspaco"));
        assertEquals (Boolean.FALSE, candidato.get ("parcial"));
        assertTrue ((Double) candidato.get ("nota") > 0.0);
        assertTrue (lista (resposta, "semEspaco").isEmpty ());
    }

    @Test
    void preferenciaInvalidaDevolveComunicadoDeErro()
    {
        String pedido = """
            {"tipo":"pedidoDeRanking",
             "agora":"2026-11-10T09:00:00Z",
             "preferencias":{"janelaFoco":"madrugada"},
             "espacos":[],
             "tarefas":[]}
            """;

        Map<String, Object> resposta = enviarPedido (pedido);

        assertEquals ("erro", resposta.get ("tipo"));
        assertTrue (((String) resposta.get ("mensagem")).contains ("janelaFoco"), resposta.toString ());
    }

    private static Map<String, Object> enviarPedido (String pedido)
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

            try (Socket cliente = new Socket (InetAddress.getLoopbackAddress (), escuta.getLocalPort ());
                 BufferedWriter transmissor = new BufferedWriter (new OutputStreamWriter (cliente.getOutputStream (), StandardCharsets.UTF_8));
                 BufferedReader receptor = new BufferedReader (new InputStreamReader (cliente.getInputStream (), StandardCharsets.UTF_8)))
            {
                cliente.setSoTimeout (2_000);
                transmissor.write (String.join ("", pedido.lines ().map (String::strip).toList ()));
                transmissor.newLine ();
                transmissor.flush ();

                String linhaDeResposta = receptor.readLine ();
                assertNotNull (linhaDeResposta, "O servidor deve responder antes de fechar a conexão");

                transmissor.write ("{\"tipo\":\"pedidoParaSair\"}");
                transmissor.newLine ();
                transmissor.flush ();

                atendimento.join (2_000);
                assertFalse (atendimento.isAlive (), "A conexão deve encerrar após pedidoParaSair");
                assertNull (falhaDoAtendimento.get ());

                return Campos.comoObjeto (Json.ler (linhaDeResposta), "resposta");
            }
        }
        catch (Exception erro)
        {
            throw new AssertionError ("Falha ao exercitar o serviço pela conexão TCP", erro);
        }
    }

    private static List<Object> lista (Map<String, Object> mapa, String campo)
    {
        try
        {
            return Campos.lista (mapa, campo, 100);
        }
        catch (Exception erro)
        {
            throw new AssertionError ("Resposta sem a lista " + campo, erro);
        }
    }

    private static Map<String, Object> objeto (Object valor)
    {
        try
        {
            return Campos.comoObjeto (valor, "item");
        }
        catch (Exception erro)
        {
            throw new AssertionError ("A resposta contém um item que não é objeto", erro);
        }
    }
}
