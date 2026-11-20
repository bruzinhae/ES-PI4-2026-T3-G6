// Guilherme Domingues de Sousa - 22013871
package calculo;

import comunicado.*;
import modelo.*;
import java.time.*;
import java.util.*;

// Calcula, para cada espaco livre, a lista de tarefas candidatas ordenada por nota.
// Nota = 0,45 x urgencia + 0,35 x importancia + 0,20 x encaixe (cada parte de 0 a 1).
// urgencia: quanto o prazo aperta; importancia: prioridade, tipo e peso da disciplina;
// encaixe: quanto a tarefa cabe no espaco e na janela de foco. Nao guarda estado.
public class CalculadoraDeRanking
{
    // pesos da nota (somam 1)
    public static final double PESO_URGENCIA    = 0.45;
    public static final double PESO_IMPORTANCIA = 0.35;
    public static final double PESO_ENCAIXE     = 0.20;

    // espaco menor que isso nao gera candidatos
    private static final int    MINUTOS_MINIMOS_DO_ESPACO  = 15;
    // com prazo a 14 dias ou mais a urgencia e zero
    private static final double HORIZONTE_DE_URGENCIA_DIAS = 14.0;
    private static final double URGENCIA_SEM_PRAZO         = 0.1;
    private static final int    SEM_LIMITE_DE_SESSAO       = 1000000; // minutos

    // Monta o ranking de cada espaco, a lista de tarefas sem espaco e, se o pedido
    // mandar, a alocacao de sessoes.
    public static Ranking calcular (PedidoDeRanking pedido)
    {
        ArrayList<Tarefa> tarefas = pedido.getTarefas ();
        OffsetDateTime agora = pedido.getAgora ();
        Preferencias preferencias = pedido.getPreferencias ();

        // primeira[i]: posicao da primeira tarefa com o mesmo id de i
        int[] primeira = CalculadoraDeRanking.indiceDaPrimeiraComOMesmoId (tarefas);
        // comEspaco[i]: true quando a tarefa foi candidata em algum espaco
        boolean[] comEspaco = new boolean [tarefas.size ()];

        ArrayList<RankingDoEspaco> porEspaco = new ArrayList<RankingDoEspaco> ();

        // para cada espaco, avalia todas as tarefas e guarda as que servem
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

            // ordena pelo compareTo do Candidato: maior nota primeiro
            Collections.sort (candidatos);

            // mantem so os melhores, ate o limite pedido
            while (candidatos.size () > pedido.getLimite ())
                candidatos.remove (candidatos.size () - 1);

            porEspaco.add (new RankingDoEspaco (espaco.getId (), candidatos));
        }

        // tarefas que nao foram candidatas em nenhum espaco
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

    // Para cada tarefa, a posicao da primeira com o mesmo id (id repetido vale o primeiro)
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

    // Minutos da tarefa: o estimado, ou a duracao preferida do usuario se nao houver
    static int minutosNecessarios (Tarefa tarefa, Preferencias preferencias)
    {
        if (tarefa.getMinutosEstimados () != null)
            return tarefa.getMinutosEstimados ();

        return preferencias.getDuracaoMinutos ();
    }

    // Quanto da tarefa cabe na sessao: o menor entre necessario, disponivel e limite.
    // Se sobraria um pedaco pequeno, a sessao absorve o resto.
    static int minutosDaSessao (int necessarios, int disponiveis, int limiteDeSessao)
    {
        int sessao = Math.min (Math.min (necessarios, disponiveis), limiteDeSessao);
        int sobra  = necessarios - sessao;

        if (sobra > 0 && sobra < MINUTOS_MINIMOS_DO_ESPACO && necessarios <= disponiveis)
            return necessarios; // a sessao absorve o resto pequeno

        return sessao;
    }

    // Avalia a tarefa para o espaco sem limite de sessao (usado no ranking)
    private static Candidato avaliar
    (Tarefa tarefa, Tarefa referencia, EspacoLivre espaco,
     OffsetDateTime agora, Preferencias preferencias)
    {
        int necessarios = minutosNecessarios (tarefa, preferencias);

        return avaliar (tarefa, referencia, espaco, agora, preferencias,
                        necessarios, SEM_LIMITE_DE_SESSAO);
    }

    // Devolve o candidato com as notas, ou null se a tarefa esta concluida ou a sessao
    // nao terminaria antes do prazo. Tarefa ja atrasada pode entrar em qualquer espaco.
    static Candidato avaliar
    (Tarefa tarefa, Tarefa referencia, EspacoLivre espaco, OffsetDateTime agora,
     Preferencias preferencias, int necessarios, int limiteDeSessao)
    {
        if (tarefa.concluida ())
            return null;

        int disponiveis = espaco.getMinutos ();
        int noEspaco    = minutosDaSessao (necessarios, disponiveis, limiteDeSessao);
        boolean parcial = necessarios > disponiveis;

        boolean atrasada = tarefa.getPrazo () != null && !tarefa.getPrazo ().isAfter (agora);
        OffsetDateTime fimDaSessao = espaco.getInicio ().plusMinutes (noEspaco);

        if (tarefa.getPrazo () != null && !atrasada && fimDaSessao.isAfter (tarefa.getPrazo ()))
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

    // 1 se atrasada ou sem folga; 0,1 se sem prazo; senao cai ate 0 em 14 dias
    private static double urgencia
    (Tarefa tarefa, boolean atrasada, int minutosNecessarios, OffsetDateTime agora)
    {
        if (tarefa.getPrazo () == null)
            return URGENCIA_SEM_PRAZO;
        if (atrasada)
            return 1.0;

        double folgaMinutos = Duration.between (agora, tarefa.getPrazo ()).toMinutes () - minutosNecessarios;

        if (folgaMinutos <= 0)
            return 1.0;

        return 1.0 - limitar (folgaMinutos / 1440.0 / HORIZONTE_DE_URGENCIA_DIAS); // 0 com 14 dias
    }

    // Prioridade/10, mais reforco para prova (0,10) e trabalho (0,05) e para o peso
    // da disciplina; limitada a 1
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

    // 60% tamanho (quao bem a tarefa preenche o espaco) + 40% foco (tarefa dificil
    // vale mais dentro da janela de foco; pessoal nao depende da janela)
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
            int hora = espaco.getInicio ().toLocalTime ().toSecondOfDay ();

            foco = 0.4;
            if (dentroDaJanela (hora, preferencias.getJanelaFoco ()))
                foco = 1.0;
        }

        return 0.6 * tamanho + 0.4 * foco;
    }

    // A janela e manha (8h30-12h), tarde (14h-18h) ou noite (19h-22h30)
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

    // Mantem o valor entre 0 e 1
    static double limitar (double valor)
    {
        return Math.max (0.0, Math.min (1.0, valor));
    }

    // Arredonda para tres casas decimais
    private static double arredondar (double valor)
    {
        return (int) (valor * 1000.0 + 0.5) / 1000.0; // tres casas
    }
}
