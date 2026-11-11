import java.io.BufferedReader;
import java.io.FileReader;
import java.net.Socket;
import java.util.ArrayList;

/**
 * Cliente de console para testar o servidor (equivalente ao Cliente do Fazedor de Continhas).
 *
 * Uso: java Cliente [HOST [PORTA]]
 * Mostra um menu: envia um pedido de ranking ou de metas lido de um arquivo JSON, ou os comandos de
 * texto simples (OLA, DATA, HORA) dos exemplos das aulas. O backend Node usa o mesmo protocolo (ver README).
 */
public class Cliente
{
    public static final String HOST_PADRAO  = "localhost";
    public static final int    PORTA_PADRAO = 3000;

    public static final String ARQUIVO_DE_RANKING_PADRAO = "exemplos/pedido-semana-alocacao.json";
    public static final String ARQUIVO_DE_METAS_PADRAO   = "exemplos/pedido-metas.json";

    public static void main (String[] args)
    {
        if (args.length > 2)
        {
            System.err.println ("Uso esperado: java Cliente [HOST [PORTA]]\n");
            return;
        }

        Socket conexao = null;
        try
        {
            String host  = Cliente.HOST_PADRAO;
            int    porta = Cliente.PORTA_PADRAO;

            if (args.length > 0)
                host = args[0];

            if (args.length == 2)
                porta = Integer.parseInt (args[1]);

            conexao = new Socket (host, porta);
        }
        catch (Exception erro)
        {
            System.err.println ("Indique o servidor e a porta corretos!\n");
            return;
        }

        Parceiro servidor = null;
        try
        {
            servidor = new Parceiro (conexao);
        }
        catch (Exception erro)
        {
            System.err.println ("Indique o servidor e a porta corretos!\n");
            return;
        }

        TratadoraDeComunicadoDeDesligamento tratadoraDeComunicadoDeDesligamento = null;
        try
        {
            tratadoraDeComunicadoDeDesligamento = new TratadoraDeComunicadoDeDesligamento (servidor);
        }
        catch (Exception erro)
        {} // sei que servidor foi instanciado

        tratadoraDeComunicadoDeDesligamento.start ();

        char opcao = ' ';
        do
        {
            System.out.print ("Sua opcao ([R]anking, [M]etas, [O]la, [D]ata, [H]ora, [T]erminar)? ");

            try
            {
                opcao = Character.toUpperCase (Teclado.getUmChar ());
            }
            catch (Exception erro)
            {
                System.err.println ("Opcao invalida!\n");
                continue;
            }

            if ("RMODHT".indexOf (opcao) == -1)
            {
                System.err.println ("Opcao invalida!\n");
                continue;
            }

            try
            {
                if (opcao == 'R' || opcao == 'M')
                {
                    String padrao = opcao == 'R' ? ARQUIVO_DE_RANKING_PADRAO : ARQUIVO_DE_METAS_PADRAO;

                    System.out.print ("Arquivo do pedido (Enter para " + padrao + ")? ");
                    String arquivo = Teclado.getUmString ();
                    if (arquivo == null || arquivo.trim ().length () == 0)
                        arquivo = padrao;
                    System.out.println ();

                    Objeto pedido = null;
                    try
                    {
                        pedido = Campos.comoObjeto (Json.ler (Cliente.lerArquivo (arquivo.trim ())), "pedido");
                    }
                    catch (Exception erro)
                    {
                        System.err.println ("Nao foi possivel ler o arquivo: " + erro.getMessage () + "\n");
                        continue;
                    }

                    servidor.recebaTexto (Json.escrever (pedido));
                    String resposta = esperarResposta (servidor);
                    mostrar (Campos.comoObjeto (Json.ler (resposta), "resposta"), pedido);
                }
                else if (opcao != 'T')
                {
                    servidor.recebaTexto (opcao == 'O' ? "OLA" : opcao == 'D' ? "DATA" : "HORA");
                    System.out.println (esperarResposta (servidor) + "\n");
                }
            }
            catch (Exception erro)
            {
                System.err.println ("Erro de comunicacao com o servidor;");
                System.err.println ("Tente novamente!");
                System.err.println ("Caso o erro persista, termine o programa");
                System.err.println ("e volte a tentar mais tarde!\n");
            }
        }
        while (opcao != 'T');

        try
        {
            servidor.receba (new PedidoParaSair ());
        }
        catch (Exception erro)
        {}

        System.out.println ("Obrigado por usar este programa!");
        System.exit (0);
    }

    // Le o arquivo inteiro como um texto so.
    private static String lerArquivo (String nome) throws Exception
    {
        BufferedReader arquivo = new BufferedReader (new FileReader (nome));
        String ret = "";
        String linha = null;

        while ((linha = arquivo.readLine ()) != null)
            ret = ret + linha + "\n";

        arquivo.close ();
        return ret;
    }

    // Espera a resposta do servidor: a tratadora tambem le a mesma conexao, entao primeiro se espia e depois se retira a linha.
    private static String esperarResposta (Parceiro servidor) throws Exception
    {
        String resposta = null;
        do
        {
            resposta = servidor.espie ();
        }
        while (resposta == null);

        return servidor.envie ();
    }

    // Verdadeiro se a linha e o comunicado de desligamento que o servidor manda ao ser desativado.
    public static boolean ehComunicadoDeDesligamento (String linha)
    {
        try
        {
            return "comunicadoDeDesligamento".equals (Campos.comoObjeto (Json.ler (linha), "comunicado").get ("tipo"));
        }
        catch (Exception erro)
        {
            return false; // nao e JSON (ex.: resposta de texto a OLA)
        }
    }

    // O texto do item da lista cujo "id" e o indicado (ou o proprio id, se nao houver titulo).
    private static String tituloDoItem (ArrayList<Object> itens, Object id) throws Exception
    {
        for (Object item : itens)
        {
            Objeto objeto = Campos.comoObjeto (item, "item");

            if (String.valueOf (objeto.get ("id")).equals (String.valueOf (id)))
                return String.valueOf (objeto.get ("titulo"));
        }

        return String.valueOf (id);
    }

    // Os dois horarios do espaco com o id indicado, ex.: "2026-10-27T14:00:00-03:00 ate 2026-10-27T16:00:00-03:00".
    private static String horarioDoEspaco (ArrayList<Object> espacos, Object id) throws Exception
    {
        for (Object item : espacos)
        {
            Objeto espaco = Campos.comoObjeto (item, "espaco");

            if (String.valueOf (espaco.get ("id")).equals (String.valueOf (id)))
                return espaco.get ("inicio") + " ate " + espaco.get ("fim");
        }

        return "null";
    }

    // Alocação decidida pelo servidor (quando o pedido traz "alocar": true).
    private static void mostrarAlocacao (Objeto resposta, ArrayList<Object> tarefas) throws Exception
    {
        System.out.println ("Alocacao sugerida:");

        ArrayList<Object> sessoes = (ArrayList<Object>) resposta.get ("alocacao");

        if (sessoes.size () == 0)
            System.out.println ("   (nenhuma sessao)");

        for (Object s : sessoes)
        {
            Objeto sessao = Campos.comoObjeto (s, "sessao");
            System.out.printf ("   %s ate %s  %-36s %d min  (faltam %d min)%n",
                               sessao.get ("inicio"), sessao.get ("fim"),
                               tituloDoItem (tarefas, sessao.get ("tarefaId")),
                               ((Double) sessao.get ("minutos")).intValue (),
                               ((Double) sessao.get ("minutosRestantes")).intValue ());
        }

        ArrayList<Object> pendentes = (ArrayList<Object>) resposta.get ("semAlocacao");

        for (Object p : pendentes)
        {
            Objeto pendente = Campos.comoObjeto (p, "pendente");
            System.out.println ("   ! " + tituloDoItem (tarefas, pendente.get ("tarefaId")) + ": " + pendente.get ("motivo")
                                + " (faltam " + ((Double) pendente.get ("minutosRestantes")).intValue () + " min)");
        }

        if (Boolean.TRUE.equals (resposta.get ("alocacaoTruncada")))
            System.out.println ("   (alocacao truncada no limite de sessoes)");

        System.out.println ();
    }

    // Prioridade das metas: da mais para a menos urgente, a meta foco e as datas sugeridas para os marcos.
    private static void mostrarMetas (Objeto resposta, Objeto pedido) throws Exception
    {
        ArrayList<Object> metas = Campos.lista (pedido, "metas", Integer.MAX_VALUE);

        System.out.println ("Metas, da mais para a menos urgente:");

        int posicao = 1;
        for (Object r : Campos.lista (resposta, "ranking", Integer.MAX_VALUE))
        {
            Objeto item = Campos.comoObjeto (r, "meta");
            Objeto comp = Campos.comoObjeto (item.get ("composicao"), "composicao");
            System.out.printf ("   %d. %-36s nota %.3f  (urg %.2f, lac %.2f, imp %.2f)%s%n",
                               posicao++, tituloDoItem (metas, item.get ("metaId")),
                               (Double) item.get ("nota"), (Double) comp.get ("urgencia"),
                               (Double) comp.get ("lacuna"), (Double) comp.get ("importancia"),
                               Boolean.TRUE.equals (item.get ("atrasada")) ? "  [atrasada]" : "");
        }

        if (resposta.get ("foco") == null)
        {
            System.out.println ("   (nenhuma meta ativa)\n");
            return;
        }

        System.out.println ("Meta foco: " + tituloDoItem (metas, resposta.get ("foco")));

        ArrayList<Object> datas = (ArrayList<Object>) resposta.get ("datasDosMarcos");

        if (datas.size () == 0)
            System.out.println ("   (sem datas sugeridas: habito ou meta sem prazo)");

        for (Object d : datas)
            System.out.println ("   marco ate " + d);

        System.out.println ();
    }

    private static void mostrar (Objeto resposta, Objeto pedido) throws Exception
    {
        if ("erro".equals (resposta.get ("tipo")))
        {
            System.out.println ("ERRO do servidor: " + resposta.get ("mensagem") + "\n");
            return;
        }

        if ("prioridadeDeMetas".equals (resposta.get ("tipo")))
        {
            mostrarMetas (resposta, pedido);
            return;
        }

        ArrayList<Object> tarefas  = Campos.lista (pedido, "tarefas", Integer.MAX_VALUE);
        ArrayList<Object> espacos  = Campos.lista (pedido, "espacos", Integer.MAX_VALUE);

        for (Object r : Campos.lista (resposta, "porEspaco", Integer.MAX_VALUE))
        {
            Objeto ranking = Campos.comoObjeto (r, "ranking");
            System.out.println ("Espaco " + ranking.get ("espacoId") + "  [" + horarioDoEspaco (espacos, ranking.get ("espacoId")) + "]");

            ArrayList<Object> candidatos = (ArrayList<Object>) ranking.get ("candidatos");

            if (candidatos.size () == 0)
                System.out.println ("   (nenhum candidato)");

            int posicao = 1;
            for (Object c : candidatos)
            {
                Objeto candidato = Campos.comoObjeto (c, "candidato");
                Objeto comp = Campos.comoObjeto (candidato.get ("composicao"), "composicao");
                System.out.printf ("   %d. %-36s nota %.3f  (urg %.2f, imp %.2f, enc %.2f)  %d min%s%n",
                                   posicao++, tituloDoItem (tarefas, candidato.get ("tarefaId")),
                                   (Double) candidato.get ("nota"), (Double) comp.get ("urgencia"),
                                   (Double) comp.get ("importancia"), (Double) comp.get ("encaixe"),
                                   ((Double) candidato.get ("minutosNoEspaco")).intValue (),
                                   Boolean.TRUE.equals (candidato.get ("parcial")) ? "  [parcial]" : "");
            }

            System.out.println ();
        }

        if (resposta.get ("alocacao") instanceof ArrayList)
            mostrarAlocacao (resposta, tarefas);

        ArrayList<Object> sem = (ArrayList<Object>) resposta.get ("semEspaco");

        if (sem.size () != 0)
        {
            System.out.println ("Sem espaco:");
            for (Object s : sem)
            {
                Objeto item = Campos.comoObjeto (s, "tarefa");
                System.out.println ("   - " + tituloDoItem (tarefas, item.get ("tarefaId")) + " (" + item.get ("motivo") + ")");
            }
        }
    }
}
