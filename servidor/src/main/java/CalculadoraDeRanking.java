import java.util.ArrayList;

/**
 * Calcula, para cada espaço livre da grade, o vetor de tarefas candidatas ordenado por nota.
 *
 * Nota = 0,45 x urgência + 0,35 x importância + 0,20 x encaixe   (cada parte vai de 0 a 1)
 *
 *   urgência    quanto o prazo aperta, medido a partir de AGORA e já descontando o esforço
 *               da tarefa (medir a partir do espaço faria a nota favorecer espaços tardios);
 *   importância prioridade do usuário (1 a 10), com reforço para prova/trabalho e para
 *               disciplinas de maior peso;
 *   encaixe     o quanto a tarefa cabe no espaço e se cai na janela de foco do usuário
 *               (tarefa pessoal não depende da janela de foco: usa o valor neutro).
 *
 * Regras fixas (não são pesos):
 *   - tarefa concluída não é candidata;
 *   - a sessão precisa terminar antes do prazo (tarefa já atrasada pode entrar em qualquer espaço);
 *   - espaços com menos de 15 minutos são ignorados (mínimo de uma tarefa);
 *   - desempate: prazo mais cedo, depois maior prioridade, depois id (ver Candidato.compareTo).
 *
 * É uma classe sem estado: pode ser usada por várias threads ao mesmo tempo.
 */
public class CalculadoraDeRanking
{
    public static final double PESO_URGENCIA    = 0.45;
    public static final double PESO_IMPORTANCIA = 0.35;
    public static final double PESO_ENCAIXE     = 0.20;

    private static final int    MINUTOS_MINIMOS_DO_ESPACO  = 15;
    private static final double HORIZONTE_DE_URGENCIA_DIAS = 14.0;
    private static final double URGENCIA_SEM_PRAZO         = 0.1;

    public static Ranking calcular (PedidoDeRanking pedido) throws Exception
    {
        ArrayList<Tarefa> tarefas = pedido.getTarefas ();

        // Tarefas com o mesmo id valem como uma só para o desempate e para dizer se couberam em algum espaço.
        int[] primeira = CalculadoraDeRanking.indiceDaPrimeiraComOMesmoId (tarefas);
        boolean[] comEspaco = new boolean [tarefas.size ()];

        ArrayList<RankingDoEspaco> porEspaco = new ArrayList<RankingDoEspaco> ();

        for (EspacoLivre espaco : pedido.getEspacos ())
        {
            ArrayList<Candidato> candidatos = new ArrayList<Candidato> ();

            if (espaco.getMinutos () >= MINUTOS_MINIMOS_DO_ESPACO)
                for (int i = 0; i < tarefas.size (); i++)
                {
                    Candidato candidato = avaliar (tarefas.get (i), tarefas.get (primeira[i]), espaco,
                                                   pedido.getAgora (), pedido.getPreferencias ());

                    if (candidato != null)
                    {
                        candidatos.add (candidato);
                        comEspaco[primeira[i]] = true;
                    }
                }

            Ordenador.ordene (candidatos);

            while (candidatos.size () > pedido.getLimite ())
                candidatos.remove (candidatos.size () - 1);

            porEspaco.add (new RankingDoEspaco (espaco.getId (), candidatos));
        }

        ArrayList<TarefaSemEspaco> semEspaco = new ArrayList<TarefaSemEspaco> ();

        for (int i = 0; i < tarefas.size (); i++)
            if (!tarefas.get (i).concluida () && !comEspaco[primeira[i]])
                semEspaco.add (new TarefaSemEspaco (tarefas.get (i).getId (),
                                                    pedido.getEspacos ().size () == 0 ? "sem_espacos" : "nenhum_espaco_antes_do_prazo"));

        // A alocação só é calculada quando o pedido traz "alocar": true; o ranking por espaço é o mesmo.
        return new Ranking (porEspaco, semEspaco, pedido.getAlocar () ? AlocadoraDeSessoes.alocar (pedido) : null);
    }

    // Para cada tarefa, a posição da primeira tarefa da lista que tem o mesmo id (ela mesma, se for a primeira).
    static int[] indiceDaPrimeiraComOMesmoId (ArrayList<Tarefa> tarefas)
    {
        int[] ret = new int [tarefas.size ()];

        for (int i = 0; i < ret.length; i++)
        {
            ret[i] = i;

            for (int j = 0; j < i; j++)
                if (tarefas.get (j).getId ().equals (tarefas.get (i).getId ()))
                {
                    ret[i] = j;
                    break;
                }
        }

        return ret;
    }

    // Minutos que a tarefa pede no total: a estimativa dela ou, sem estimativa, a duração de sessão preferida.
    static int minutosNecessarios (Tarefa tarefa, Preferencias preferencias)
    {
        return tarefa.getMinutosEstimados () != null ? tarefa.getMinutosEstimados () : preferencias.getDuracaoMinutos ();
    }

    // Tamanho da sessão: o que a tarefa pede, limitado ao espaço e ao tamanho máximo de sessão. Se depois
    // desta sessão sobrariam menos de 15 minutos (e eles cabem no espaço), a sessão absorve o resto.
    static int minutosDaSessao (int necessarios, int disponiveis, int limiteDeSessao)
    {
        int sessao = Math.min (Math.min (necessarios, disponiveis), limiteDeSessao);
        int sobra  = necessarios - sessao;

        if (sobra > 0 && sobra < MINUTOS_MINIMOS_DO_ESPACO && necessarios <= disponiveis)
            return necessarios;

        return sessao;
    }

    // Devolve null quando a tarefa não pode ser candidata a este espaço.
    private static Candidato avaliar (Tarefa tarefa, Tarefa referencia, EspacoLivre espaco, DataHora agora, Preferencias preferencias) throws Exception
    {
        return avaliar (tarefa, referencia, espaco, agora, preferencias, minutosNecessarios (tarefa, preferencias), Integer.MAX_VALUE);
    }

    // `necessarios` são os minutos que AINDA faltam da tarefa; `limiteDeSessao` é o tamanho máximo de uma sessão
    // (Integer.MAX_VALUE no ranking, que não divide a tarefa em sessões).
    // `referencia` é a tarefa de que o candidato herda o prazo e a prioridade para o desempate.
    static Candidato avaliar (Tarefa tarefa, Tarefa referencia, EspacoLivre espaco, DataHora agora, Preferencias preferencias,
                              int necessarios, int limiteDeSessao) throws Exception
    {
        if (tarefa.concluida ())
            return null;

        int disponiveis = espaco.getMinutos ();
        int noEspaco    = minutosDaSessao (necessarios, disponiveis, limiteDeSessao);
        boolean parcial = necessarios > disponiveis;

        boolean atrasada = tarefa.getPrazo () != null && !tarefa.getPrazo ().depoisDe (agora);
        DataHora fimDaSessao = espaco.getInicio ().maisMinutos (noEspaco);

        if (tarefa.getPrazo () != null && !atrasada && fimDaSessao.depoisDe (tarefa.getPrazo ()))
            return null;

        double urgencia    = urgencia (tarefa, atrasada, necessarios, agora);
        double importancia = importancia (tarefa);
        double encaixe     = encaixe (tarefa, espaco, preferencias, necessarios, disponiveis, parcial);

        double nota = PESO_URGENCIA * urgencia + PESO_IMPORTANCIA * importancia + PESO_ENCAIXE * encaixe;

        return new Candidato (tarefa.getId (), arredondar (nota), noEspaco, parcial,
                              arredondar (urgencia), arredondar (importancia), arredondar (encaixe),
                              referencia.getPrazo (), referencia.getPrioridade ());
    }

    // 1 = apertado ou atrasado; cai linearmente até 0 quando sobram 14 dias ou mais de folga.
    private static double urgencia (Tarefa tarefa, boolean atrasada, int minutosNecessarios, DataHora agora)
    {
        if (tarefa.getPrazo () == null)
            return URGENCIA_SEM_PRAZO;
        if (atrasada)
            return 1.0;

        double folgaMinutos = agora.minutosAte (tarefa.getPrazo ()) - minutosNecessarios;

        if (folgaMinutos <= 0)
            return 1.0;

        return 1.0 - limitar (folgaMinutos / 1440.0 / HORIZONTE_DE_URGENCIA_DIAS);
    }

    private static double importancia (Tarefa tarefa)
    {
        double valor = tarefa.getPrioridade () / 10.0;

        if ("prova".equals (tarefa.getTipo ()))
            valor += 0.10;
        else if ("trabalho".equals (tarefa.getTipo ()))
            valor += 0.05;

        int peso = tarefa.getPeso () != null ? tarefa.getPeso () : 3;
        valor += 0.02 * (peso - 3);

        return limitar (valor);
    }

    // 60% o tamanho (cabe inteira, com pouca sobra, é melhor) e 40% a janela de foco.
    private static double encaixe (Tarefa tarefa, EspacoLivre espaco, Preferencias preferencias,
                                   int necessarios, int disponiveis, boolean parcial)
    {
        double tamanho = parcial ? 0.4 : 1.0 - 0.5 * (disponiveis - necessarios) / (double) disponiveis;

        boolean dificil = !tarefa.pessoal () && ("prova".equals (tarefa.getTipo ()) || "trabalho".equals (tarefa.getTipo ())
                          || (tarefa.getDificuldade () != null && tarefa.getDificuldade () >= 4));

        double foco = 0.7;
        if (preferencias.getFocoMatinal () && dificil)
            foco = dentroDaJanela (espaco.getInicio ().getSegundoDoDia (), preferencias.getJanelaFoco ()) ? 1.0 : 0.4;

        return 0.6 * tamanho + 0.4 * foco;
    }

    // Janelas iguais às da tela de Configurações. A hora vem em segundos desde a meia-noite.
    private static boolean dentroDaJanela (int segundoDoDia, String janela)
    {
        int inicio;
        int fim;

        switch (janela)
        {
            case "tarde": inicio = 14 * 3600;          fim = 18 * 3600;          break;
            case "noite": inicio = 19 * 3600;          fim = 22 * 3600 + 30 * 60; break;
            default:      inicio = 8 * 3600 + 30 * 60; fim = 12 * 3600;
        }

        return segundoDoDia >= inicio && segundoDoDia < fim;
    }

    static double limitar (double valor)
    {
        return Math.max (0.0, Math.min (1.0, valor));
    }

    private static double arredondar (double valor)
    {
        return Math.round (valor * 1000.0) / 1000.0;
    }
}
