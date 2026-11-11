import java.net.*;
import java.util.*;

/**
 * Cliente de console para testar o servidor (equivalente ao Cliente do Fazedor de Continhas).
 *
 * Uso: java Cliente [HOST [PORTA]]
 * Mostra um menu: envia um pedido de ranking (com alocacao) ou um pedido de metas montados com dados
 * de exemplo e mostra a resposta. O backend Node usa o mesmo protocolo (ver README).
 */
public class Cliente
{
    public static final String HOST_PADRAO  = "localhost";
    public static final int    PORTA_PADRAO = 3000;

    public static void main (String[] args)
    {
        if (args.length>2)
        {
            System.err.println ("Uso esperado: java Cliente [HOST [PORTA]]\n");
            return;
        }

        Socket conexao=null;
        try
        {
            String host = Cliente.HOST_PADRAO;
            int    porta= Cliente.PORTA_PADRAO;

            if (args.length>0)
                host = args[0];

            if (args.length==2)
                porta = Integer.parseInt(args[1]);

            conexao = new Socket (host, porta);
        }
        catch (Exception erro)
        {
            System.err.println ("Indique o servidor e a porta corretos!\n");
            return;
        }

        java.io.ObjectOutputStream transmissor=null;
        try
        {
            transmissor =
            new java.io.ObjectOutputStream(
            conexao.getOutputStream());
        }
        catch (Exception erro)
        {
            System.err.println ("Indique o servidor e a porta corretos!\n");
            return;
        }

        java.io.ObjectInputStream receptor=null;
        try
        {
            receptor =
            new java.io.ObjectInputStream(
            conexao.getInputStream());
        }
        catch (Exception erro)
        {
            System.err.println ("Indique o servidor e a porta corretos!\n");
            return;
        }

        Parceiro servidor=null;
        try
        {
            servidor =
            new Parceiro (conexao, receptor, transmissor);
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

        tratadoraDeComunicadoDeDesligamento.start();

        char opcao=' ';
        do
        {
            System.out.print ("Sua opcao ([R]anking, [M]etas, [T]erminar)? ");

            try
            {
                opcao = Character.toUpperCase(Teclado.getUmChar());
            }
            catch (Exception erro)
            {
                System.err.println ("Opcao invalida!\n");
                continue;
            }

            if ("RMT".indexOf(opcao)==-1)
            {
                System.err.println ("Opcao invalida!\n");
                continue;
            }

            try
            {
                if (opcao=='R')
                {
                    PedidoDeRanking pedido = Cliente.pedidoDeRankingDeExemplo ();

                    servidor.receba (pedido);
                    Comunicado comunicado = null;
                    do
                    {
                        comunicado = (Comunicado)servidor.espie ();
                    }
                    while (!(comunicado instanceof Ranking) && !(comunicado instanceof Erro));
                    comunicado = (Comunicado)servidor.envie ();

                    if (comunicado instanceof Erro)
                        System.out.println ("ERRO do servidor: "+comunicado+"\n");
                    else
                        Cliente.mostre ((Ranking)comunicado, pedido);
                }
                else if (opcao=='M')
                {
                    PedidoDeMetas pedido = Cliente.pedidoDeMetasDeExemplo ();

                    servidor.receba (pedido);
                    Comunicado comunicado = null;
                    do
                    {
                        comunicado = (Comunicado)servidor.espie ();
                    }
                    while (!(comunicado instanceof PrioridadeDeMetas) && !(comunicado instanceof Erro));
                    comunicado = (Comunicado)servidor.envie ();

                    if (comunicado instanceof Erro)
                        System.out.println ("ERRO do servidor: "+comunicado+"\n");
                    else
                        Cliente.mostre ((PrioridadeDeMetas)comunicado, pedido);
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
        System.exit(0);
    }

    // Tres espacos livres nos proximos dias e tres tarefas, pedindo tambem a alocacao.
    private static PedidoDeRanking pedidoDeRankingDeExemplo () throws Exception
    {
        DataHora agora = DataHora.agora (-3*3600);

        ArrayList<EspacoLivre> espacos = new ArrayList<EspacoLivre> ();
        espacos.add (new EspacoLivre ("e1", agora.maisMinutos(60),      agora.maisMinutos(180)));
        espacos.add (new EspacoLivre ("e2", agora.maisMinutos(24*60),   agora.maisMinutos(24*60+90)));
        espacos.add (new EspacoLivre ("e3", agora.maisMinutos(2*24*60), agora.maisMinutos(2*24*60+60)));

        ArrayList<Tarefa> tarefas = new ArrayList<Tarefa> ();
        tarefas.add (new Tarefa ("t1", "Lista de Grafos",  "estudos", "exercicio", 8,  agora.maisMinutos(3*24*60),  90,  3, 4, "pendente"));
        tarefas.add (new Tarefa ("t2", "Prova de Calculo", "estudos", "prova",     10, agora.maisMinutos(5*24*60),  120, 5, 5, "pendente"));
        tarefas.add (new Tarefa ("t3", "Consulta medica",  "pessoal", "outro",     5,  agora.maisMinutos(2*24*60),  30,  null, null, "pendente"));

        return new PedidoDeRanking (agora, Preferencias.padrao(), espacos, tarefas, 5, true);
    }

    private static PedidoDeMetas pedidoDeMetasDeExemplo () throws Exception
    {
        DataHora agora = DataHora.agora (-3*3600);

        ArrayList<Meta> metas = new ArrayList<Meta> ();
        metas.add (new Meta ("m1", "Entregar o projeto final",  "projeto",    "alta",  20, agora.maisMinutos(34*24*60)));
        metas.add (new Meta ("m2", "Revisar calculo",           "geral",      "baixa", 0,  agora.maisMinutos(100*24*60)));
        metas.add (new Meta ("m3", "Estudar 10 horas por semana","habito",    "media", 50, null));
        metas.add (new Meta ("m4", "Apresentar o seminario",    "disciplina", "media", 10, agora.maisMinutos(3*24*60)));

        return new PedidoDeMetas (agora, metas, 3);
    }

    private static String tituloDaTarefa (PedidoDeRanking pedido, String id)
    {
        for (Tarefa tarefa:pedido.getTarefas())
            if (tarefa.getId().equals(id))
                return tarefa.getTitulo();

        return id;
    }

    private static void mostre (Ranking ranking, PedidoDeRanking pedido)
    {
        for (RankingDoEspaco rankingDoEspaco:ranking.getPorEspaco())
        {
            for (EspacoLivre espaco:pedido.getEspacos())
                if (espaco.getId().equals(rankingDoEspaco.getEspacoId()))
                    System.out.println ("Espaco "+espaco.getId()+"  ["+espaco.getInicio()+" ate "+espaco.getFim()+"]");

            if (rankingDoEspaco.getCandidatos().size()==0)
                System.out.println ("   (nenhum candidato)");

            int posicao=1;
            for (Candidato candidato:rankingDoEspaco.getCandidatos())
                System.out.printf ("   %d. %-20s nota %.3f  (urg %.2f, imp %.2f, enc %.2f)  %d min%s%n",
                                   posicao++, tituloDaTarefa(pedido,candidato.getTarefaId()), candidato.getNota(),
                                   candidato.getUrgencia(), candidato.getImportancia(), candidato.getEncaixe(),
                                   candidato.getMinutosNoEspaco(), candidato.getParcial() ? "  [parcial]" : "");

            System.out.println ();
        }

        if (ranking.getAlocacao()!=null)
        {
            System.out.println ("Alocacao sugerida:");

            for (SessaoAlocada sessao:ranking.getAlocacao().getSessoes())
                System.out.printf ("   %s ate %s  %-20s %d min  (faltam %d min)%n",
                                   sessao.getInicio(), sessao.getFim(), tituloDaTarefa(pedido,sessao.getTarefaId()),
                                   sessao.getMinutos(), sessao.getMinutosRestantes());

            for (TarefaSemAlocacao pendente:ranking.getAlocacao().getSemAlocacao())
                System.out.println ("   ! "+tituloDaTarefa(pedido,pendente.getTarefaId())+": "+pendente.getMotivo()+" (faltam "+pendente.getMinutosRestantes()+" min)");

            System.out.println ();
        }

        for (TarefaSemEspaco sem:ranking.getSemEspaco())
            System.out.println ("Sem espaco: "+tituloDaTarefa(pedido,sem.getTarefaId())+" ("+sem.getMotivo()+")");
    }

    private static void mostre (PrioridadeDeMetas prioridade, PedidoDeMetas pedido)
    {
        System.out.println ("Metas, da mais para a menos urgente:");

        int posicao=1;
        for (NotaDeMeta nota:prioridade.getRanking())
        {
            String titulo=nota.getMetaId();
            for (Meta meta:pedido.getMetas())
                if (meta.getId().equals(nota.getMetaId()))
                    titulo = meta.getTitulo();

            System.out.printf ("   %d. %-28s nota %.3f  (urg %.2f, lac %.2f, imp %.2f)%s%n",
                               posicao++, titulo, nota.getNota(), nota.getUrgencia(), nota.getLacuna(),
                               nota.getImportancia(), nota.getAtrasada() ? "  [atrasada]" : "");
        }

        System.out.println ("Meta foco: "+prioridade.getFoco());

        if (prioridade.getDatasDosMarcos().size()==0)
            System.out.println ("   (sem datas sugeridas: habito ou meta sem prazo)");

        for (String data:prioridade.getDatasDosMarcos())
            System.out.println ("   marco ate "+data);

        System.out.println ();
    }
}
