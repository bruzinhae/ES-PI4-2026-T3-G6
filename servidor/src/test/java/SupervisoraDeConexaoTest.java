import org.junit.jupiter.api.Test;

import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.lang.reflect.Field;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SupervisoraDeConexaoTest
{
    @Test
    void pedidoValidoDevolveRankingComCandidato() throws Exception
    {
        // Confirma que um pedido serializado produz candidatos para o espaço disponível.
        DataHora agora = new DataHora (1_000_000L, 0, 0);
        Preferencias preferencias = new Preferencias ();
        definir (preferencias, "janelaFoco", "manha");
        definir (preferencias, "duracaoMinutos", 50);

        Tarefa tarefa = new Tarefa ();
        definir (tarefa, "id", "t1");
        definir (tarefa, "tipo", "prova");
        definir (tarefa, "prioridade", 8);
        definir (tarefa, "prazo", agora.maisMinutos (24 * 60));
        definir (tarefa, "minutosEstimados", 60);
        definir (tarefa, "dificuldade", 4);
        definir (tarefa, "peso", 4);
        definir (tarefa, "situacao", "pendente");

        PedidoDeRanking pedido = new PedidoDeRanking ();
        definir (pedido, "agora", agora);
        definir (pedido, "preferencias", preferencias);
        definir (pedido, "limite", 3);
        definir (pedido, "espacos", new ArrayList<> (
            List.of (new EspacoLivre ("e1", agora, agora.maisMinutos (90)))));
        definir (pedido, "tarefas", new ArrayList<> (List.of (tarefa)));

        Ranking resposta = (Ranking) atenderPedido (pedido);
        List<?> rankings = (List<?>) campo (resposta, "porEspaco");
        assertEquals (1, rankings.size ());

        Object ranking = rankings.get (0);
        assertEquals ("e1", campo (ranking, "espacoId"));
        List<?> candidatos = (List<?>) campo (ranking, "candidatos");
        assertEquals (1, candidatos.size ());

        Candidato candidato = (Candidato) candidatos.get (0);
        assertEquals ("t1", candidato.getTarefaId ());
        assertEquals (60, candidato.getMinutosNoEspaco ());
        assertFalse ((Boolean) campo (candidato, "parcial"));
        assertTrue (candidato.getNota () > 0.0);
        assertTrue (((List<?>) campo (resposta, "semEspaco")).isEmpty ());
    }

    @Test
    void pedidoComDadosAusentesDevolveErro()
    throws Exception
    {
        // Verifica que uma falha no cálculo é devolvida sem encerrar a conexão.
        PedidoDeRanking pedido = new PedidoDeRanking ();
        definir (pedido, "tarefas", new ArrayList<Tarefa> ());

        Erro resposta = (Erro) atenderPedido (pedido);
        assertTrue (((String) campo (resposta, "mensagem")).contains ("Nao foi possivel calcular o ranking"));
    }

    @Test
    void tarefaConcluidaNaoApareceNoRankingNemNaListaSemEspaco()
    throws Exception
    {
        // Exclui tarefas concluídas tanto dos candidatos quanto das tarefas sem espaço.
        DataHora agora = new DataHora (1_000_000L, 0, 0);
        PedidoDeRanking pedido = pedidoDeRanking (
            agora,
            List.of (new EspacoLivre ("e1", agora, agora.maisMinutos (60))),
            List.of (
                tarefa ("t1", "concluida", 30, agora.maisMinutos (120)),
                tarefa ("t2", "pendente", 30, agora.maisMinutos (120))),
            3);

        Ranking resposta = (Ranking) atenderPedido (pedido);
        List<?> rankings = (List<?>) campo (resposta, "porEspaco");
        List<?> candidatos = (List<?>) campo (rankings.get (0), "candidatos");

        assertEquals (1, candidatos.size ());
        assertEquals ("t2", ((Candidato) candidatos.get (0)).getTarefaId ());
        assertTrue (((List<?>) campo (resposta, "semEspaco")).isEmpty ());
    }

    @Test
    void espacoCurtoNaoGeraCandidatoERegistraTarefaSemEspaco()
    throws Exception
    {
        // Registra como sem espaço a tarefa que não cabe no intervalo mínimo aceito.
        DataHora agora = new DataHora (1_000_000L, 0, 0);
        PedidoDeRanking pedido = pedidoDeRanking (
            agora,
            List.of (new EspacoLivre ("e1", agora, agora.maisMinutos (14))),
            List.of (tarefa ("t1", "pendente", 10, agora.maisMinutos (120))),
            3);

        Ranking resposta = (Ranking) atenderPedido (pedido);
        List<?> rankings = (List<?>) campo (resposta, "porEspaco");
        List<?> semEspaco = (List<?>) campo (resposta, "semEspaco");

        assertTrue (((List<?>) campo (rankings.get (0), "candidatos")).isEmpty ());
        assertEquals (1, semEspaco.size ());
        assertEquals ("t1", campo (semEspaco.get (0), "tarefaId"));
        assertEquals ("nenhum_espaco_antes_do_prazo", campo (semEspaco.get (0), "motivo"));
    }

    @Test
    void prazoAnteriorAoFimDoEspacoImpedeCandidato()
    throws Exception
    {
        // Não recomenda uma tarefa cujo prazo ocorre antes do fim da sessão.
        DataHora agora = new DataHora (1_000_000L, 0, 0);
        PedidoDeRanking pedido = pedidoDeRanking (
            agora,
            List.of (new EspacoLivre ("e1", agora, agora.maisMinutos (30))),
            List.of (tarefa ("t1", "pendente", 30, agora.maisMinutos (15))),
            3);

        Ranking resposta = (Ranking) atenderPedido (pedido);
        List<?> semEspaco = (List<?>) campo (resposta, "semEspaco");

        assertTrue (((List<?>) campo (((List<?>) campo (resposta, "porEspaco")).get (0), "candidatos")).isEmpty ());
        assertEquals (1, semEspaco.size ());
        assertEquals ("t1", campo (semEspaco.get (0), "tarefaId"));
    }

    @Test
    void semEspacosInformaMotivoEspecifico()
    throws Exception
    {
        // Distingue a ausência total de espaços de um espaço incompatível com a tarefa.
        DataHora agora = new DataHora (1_000_000L, 0, 0);
        PedidoDeRanking pedido = pedidoDeRanking (
            agora,
            List.of (),
            List.of (tarefa ("t1", "pendente", 30, agora.maisMinutos (120))),
            3);

        Ranking resposta = (Ranking) atenderPedido (pedido);
        List<?> semEspaco = (List<?>) campo (resposta, "semEspaco");

        assertTrue (((List<?>) campo (resposta, "porEspaco")).isEmpty ());
        assertEquals (1, semEspaco.size ());
        assertEquals ("sem_espacos", campo (semEspaco.get (0), "motivo"));
    }

    private static PedidoDeRanking pedidoDeRanking (
        DataHora agora, List<EspacoLivre> espacos, List<Tarefa> tarefas, int limite)
    throws ReflectiveOperationException
    {
        Preferencias preferencias = new Preferencias ();
        definir (preferencias, "janelaFoco", "manha");
        definir (preferencias, "duracaoMinutos", 50);

        PedidoDeRanking pedido = new PedidoDeRanking ();
        definir (pedido, "agora", agora);
        definir (pedido, "preferencias", preferencias);
        definir (pedido, "limite", limite);
        definir (pedido, "espacos", new ArrayList<> (espacos));
        definir (pedido, "tarefas", new ArrayList<> (tarefas));
        return pedido;
    }

    private static Tarefa tarefa (String id, String situacao, int minutos, DataHora prazo)
    throws ReflectiveOperationException
    {
        Tarefa tarefa = new Tarefa ();
        definir (tarefa, "id", id);
        definir (tarefa, "tipo", "exercicio");
        definir (tarefa, "prioridade", 5);
        definir (tarefa, "prazo", prazo);
        definir (tarefa, "minutosEstimados", minutos);
        definir (tarefa, "situacao", situacao);
        return tarefa;
    }

    private static Comunicado atenderPedido (Comunicado pedido)
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
                try (ObjectOutputStream transmissor = new ObjectOutputStream (cliente.getOutputStream ());
                     ObjectInputStream receptor = new ObjectInputStream (cliente.getInputStream ()))
                {
                    transmissor.writeObject (pedido);
                    transmissor.flush ();
                    Comunicado resposta = (Comunicado) receptor.readObject ();

                    transmissor.writeObject (new PedidoParaSair ());
                    transmissor.flush ();

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
            throw new AssertionError ("Falha ao exercitar o serviço pela conexão TCP serializada", erro);
        }
    }

    private static void definir (Object objeto, String nome, Object valor)
    throws ReflectiveOperationException
    {
        Field atributo = objeto.getClass ().getDeclaredField (nome);
        atributo.setAccessible (true);
        atributo.set (objeto, valor);
    }

    private static Object campo (Object objeto, String nome)
    throws ReflectiveOperationException
    {
        Field atributo = objeto.getClass ().getDeclaredField (nome);
        atributo.setAccessible (true);
        return atributo.get (objeto);
    }
}
