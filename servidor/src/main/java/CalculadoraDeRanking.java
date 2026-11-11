import java.util.*;

public class CalculadoraDeRanking
{
    public static final double PESO_URGENCIA    = 0.45;
    public static final double PESO_IMPORTANCIA = 0.35;
    public static final double PESO_ENCAIXE     = 0.20;

    private static final int    MINUTOS_MINIMOS_DO_ESPACO  = 15;
    private static final double HORIZONTE_DE_URGENCIA_DIAS = 14.0;
    private static final double URGENCIA_SEM_PRAZO         = 0.1;
    private static final int    SEM_LIMITE_DE_SESSAO       = 1000000; // minutos

    public static Ranking calcular (PedidoDeRanking pedido)
    {
        ArrayList<Tarefa> tarefas = pedido.getTarefas ();
        DataHora agora = pedido.getAgora ();
        Preferencias preferencias = pedido.getPreferencias ();

        int[] primeira = CalculadoraDeRanking.indiceDaPrimeiraComOMesmoId (tarefas);
        boolean[] comEspaco = new boolean [tarefas.size ()];

        ArrayList<RankingDoEspaco> porEspaco = new ArrayList<RankingDoEspaco> ();

        for (EspacoLivre espaco : pedido.getEspacos ())
        {
            ArrayList<Candidato> candidatos = new ArrayList<Candidato> ();

            if (espaco.getMinutos () >= MINUTOS_MINIMOS_DO_ESPACO)
                for (int i = 0; i < tarefas.size (); i++)
                {
                    Tarefa referencia = tarefas.get (primeira[i]);
                    Candidato candidato =
                    avaliar (tarefas.get (i), referencia, espaco, agora, preferencias);

                    if (candidato != null)
                    {
                        candidatos.add (candidato);
                        comEspaco[primeira[i]] = true;
                    }
                }

            candidatos = new Ordenador<Candidato> ().ordene (candidatos);

            while (candidatos.size () > pedido.getLimite ())
                candidatos.remove (candidatos.size () - 1);

            porEspaco.add (new RankingDoEspaco (espaco.getId (), candidatos));
        }

        String motivo = "nenhum_espaco_antes_do_prazo";
        if (pedido.getEspacos ().size () == 0)
            motivo = "sem_espacos";

        ArrayList<TarefaSemEspaco> semEspaco = new ArrayList<TarefaSemEspaco> ();

        for (int i = 0; i < tarefas.size (); i++)
            if (!tarefas.get (i).concluida () && !comEspaco[primeira[i]])
                semEspaco.add (new TarefaSemEspaco (tarefas.get (i).getId (), motivo));

        Alocacao alocacao = null;
        if (pedido.isAlocar ())
            alocacao = AlocadoraDeSessoes.alocar (pedido); // so se o pedido pedir

        return new Ranking (porEspaco, semEspaco, alocacao);
    }

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

    static int minutosNecessarios (Tarefa tarefa, Preferencias preferencias)
    {
        if (tarefa.getMinutosEstimados () != null)
            return tarefa.getMinutosEstimados ();

        return preferencias.getDuracaoMinutos ();
    }

    static int minutosDaSessao (int necessarios, int disponiveis, int limiteDeSessao)
    {
        int sessao = Math.min (Math.min (necessarios, disponiveis), limiteDeSessao);
        int sobra  = necessarios - sessao;

        if (sobra > 0 && sobra < MINUTOS_MINIMOS_DO_ESPACO && necessarios <= disponiveis)
            return necessarios; // a sessao absorve o resto pequeno

        return sessao;
    }

    private static Candidato avaliar
    (Tarefa tarefa, Tarefa referencia, EspacoLivre espaco,
     DataHora agora, Preferencias preferencias)
    {
        int necessarios = minutosNecessarios (tarefa, preferencias);

        return avaliar (tarefa, referencia, espaco, agora, preferencias,
                        necessarios, SEM_LIMITE_DE_SESSAO);
    }

    static Candidato avaliar
    (Tarefa tarefa, Tarefa referencia, EspacoLivre espaco, DataHora agora,
     Preferencias preferencias, int necessarios, int limiteDeSessao)
    {
        if (tarefa.concluida ())
            return null;

        int disponiveis = espaco.getMinutos ();
        int noEspaco    = minutosDaSessao (necessarios, disponiveis, limiteDeSessao);
        boolean parcial = necessarios > disponiveis;

        boolean atrasada = tarefa.getPrazo () != null && !tarefa.getPrazo ().depoisDe (agora);
        DataHora fimDaSessao = espaco.getInicio ().maisMinutos (noEspaco);

        if (tarefa.getPrazo () != null && !atrasada && fimDaSessao.depoisDe (tarefa.getPrazo ()))
            return null; // a sessao tem de terminar antes do prazo

        double urgencia    = urgencia (tarefa, atrasada, necessarios, agora);
        double importancia = importancia (tarefa);
        double encaixe     =
        encaixe (tarefa, espaco, preferencias, necessarios, disponiveis, parcial);

        double nota =
        PESO_URGENCIA * urgencia + PESO_IMPORTANCIA * importancia + PESO_ENCAIXE * encaixe;

        return new Candidato (tarefa.getId (), arredondar (nota), noEspaco, parcial,
                              arredondar (urgencia), arredondar (importancia),
                              arredondar (encaixe), referencia.getPrazo (),
                              referencia.getPrioridade ());
    }

    private static double urgencia
    (Tarefa tarefa, boolean atrasada, int minutosNecessarios, DataHora agora)
    {
        if (tarefa.getPrazo () == null)
            return URGENCIA_SEM_PRAZO;
        if (atrasada)
            return 1.0;

        double folgaMinutos = agora.minutosAte (tarefa.getPrazo ()) - minutosNecessarios;

        if (folgaMinutos <= 0)
            return 1.0;

        return 1.0 - limitar (folgaMinutos / 1440.0 / HORIZONTE_DE_URGENCIA_DIAS); // 0 com 14 dias
    }

    private static double importancia (Tarefa tarefa)
    {
        double valor = tarefa.getPrioridade () / 10.0;

        if ("prova".equals (tarefa.getTipo ()))
            valor += 0.10;
        else if ("trabalho".equals (tarefa.getTipo ()))
            valor += 0.05;

        int peso = 3;
        if (tarefa.getPeso () != null)
            peso = tarefa.getPeso ();

        valor += 0.02 * (peso - 3);

        return limitar (valor);
    }

    private static double encaixe
    (Tarefa tarefa, EspacoLivre espaco, Preferencias preferencias,
     int necessarios, int disponiveis, boolean parcial)
    {
        double tamanho = 0.4;
        if (!parcial)
            tamanho = 1.0 - 0.5 * (disponiveis - necessarios) / (double) disponiveis;

        boolean dificil = "prova".equals (tarefa.getTipo ());
        if ("trabalho".equals (tarefa.getTipo ()))
            dificil = true;
        if (tarefa.getDificuldade () != null && tarefa.getDificuldade () >= 4)
            dificil = true;
        if (tarefa.pessoal ())
            dificil = false; // tarefa pessoal nao depende da janela de foco

        double foco = 0.7; // neutro
        if (preferencias.isFocoMatinal () && dificil)
        {
            int hora = espaco.getInicio ().getSegundoDoDia ();

            foco = 0.4;
            if (dentroDaJanela (hora, preferencias.getJanelaFoco ()))
                foco = 1.0;
        }

        return 0.6 * tamanho + 0.4 * foco;
    }

    private static boolean dentroDaJanela (int segundoDoDia, String janela)
    {
        int inicio = 8 * 3600 + 30 * 60; // manha
        int fim    = 12 * 3600;

        if (janela.equals ("tarde"))
        {
            inicio = 14 * 3600;
            fim    = 18 * 3600;
        }
        else if (janela.equals ("noite"))
        {
            inicio = 19 * 3600;
            fim    = 22 * 3600 + 30 * 60;
        }

        return segundoDoDia >= inicio && segundoDoDia < fim;
    }

    static double limitar (double valor)
    {
        return Math.max (0.0, Math.min (1.0, valor));
    }

    private static double arredondar (double valor)
    {
        return (long) (valor * 1000.0 + 0.5) / 1000.0; // tres casas
    }
}
