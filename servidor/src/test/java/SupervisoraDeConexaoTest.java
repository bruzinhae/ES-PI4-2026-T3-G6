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
