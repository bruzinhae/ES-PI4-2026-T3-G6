package br.faculdade.acaistudy.servidor.ranking;

import br.faculdade.acaistudy.servidor.comunicado.PedidoDeRanking;
import br.faculdade.acaistudy.servidor.comunicado.Ranking;
import br.faculdade.acaistudy.servidor.modelo.Candidato;
import br.faculdade.acaistudy.servidor.modelo.EspacoLivre;
import br.faculdade.acaistudy.servidor.modelo.Preferencias;
import br.faculdade.acaistudy.servidor.modelo.RankingDoEspaco;
import br.faculdade.acaistudy.servidor.modelo.Tarefa;
import br.faculdade.acaistudy.servidor.modelo.TarefaSemEspaco;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

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
 *   - desempate: prazo mais cedo, depois maior prioridade, depois id.
 *
 * É uma classe sem estado: pode ser usada por várias threads ao mesmo tempo.
 */
public final class CalculadoraDeRanking
{
    public static final double PESO_URGENCIA    = 0.45;
    public static final double PESO_IMPORTANCIA = 0.35;
    public static final double PESO_ENCAIXE     = 0.20;

    private static final int    MINUTOS_MINIMOS_DO_ESPACO  = 15;
    private static final double HORIZONTE_DE_URGENCIA_DIAS = 14.0;
    private static final double URGENCIA_SEM_PRAZO         = 0.1;

    private CalculadoraDeRanking () {}

    public static Ranking calcular (PedidoDeRanking pedido) throws Exception
    {
        List<RankingDoEspaco> porEspaco = new ArrayList<RankingDoEspaco> ();
        Set<String> comEspaco = new HashSet<String> ();

        for (EspacoLivre espaco : pedido.espacos ())
        {
            List<Candidato> candidatos = new ArrayList<Candidato> ();

            if (espaco.minutos () >= MINUTOS_MINIMOS_DO_ESPACO)
                for (Tarefa tarefa : pedido.tarefas ())
                {
                    Candidato candidato = avaliar (tarefa, espaco, pedido.agora (), pedido.preferencias ());

                    if (candidato != null)
                    {
                        candidatos.add (candidato);
                        comEspaco.add (tarefa.id ());
                    }
                }

            candidatos.sort (comparadorDeCandidatos (pedido.tarefas ()));

            if (candidatos.size () > pedido.limite ())
                candidatos = new ArrayList<Candidato> (candidatos.subList (0, pedido.limite ()));

            porEspaco.add (new RankingDoEspaco (espaco.id (), candidatos));
        }

        List<TarefaSemEspaco> semEspaco = new ArrayList<TarefaSemEspaco> ();

        for (Tarefa tarefa : pedido.tarefas ())
            if (!tarefa.concluida () && !comEspaco.contains (tarefa.id ()))
                semEspaco.add (new TarefaSemEspaco (tarefa.id (),
                                                    pedido.espacos ().isEmpty () ? "sem_espacos" : "nenhum_espaco_antes_do_prazo"));

        // A alocação só é calculada quando o pedido traz "alocar": true; o ranking por espaço é o mesmo.
        return new Ranking (porEspaco, semEspaco, pedido.alocar () ? AlocadoraDeSessoes.alocar (pedido) : null);
    }

    // Minutos que a tarefa pede no total: a estimativa dela ou, sem estimativa, a duração de sessão preferida.
    static int minutosNecessarios (Tarefa tarefa, Preferencias preferencias)
    {
        return tarefa.minutosEstimados () != null ? tarefa.minutosEstimados () : preferencias.duracaoMinutos ();
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
    private static Candidato avaliar (Tarefa tarefa, EspacoLivre espaco, Instant agora, Preferencias preferencias)
    {
        return avaliar (tarefa, espaco, agora, preferencias, minutosNecessarios (tarefa, preferencias), Integer.MAX_VALUE);
    }

    // `necessarios` são os minutos que AINDA faltam da tarefa; `limiteDeSessao` é o tamanho máximo de uma sessão
    // (Integer.MAX_VALUE no ranking, que não divide a tarefa em sessões).
    static Candidato avaliar (Tarefa tarefa, EspacoLivre espaco, Instant agora, Preferencias preferencias,
                              int necessarios, int limiteDeSessao)
    {
        if (tarefa.concluida ())
            return null;

        int disponiveis = espaco.minutos ();
        int noEspaco    = minutosDaSessao (necessarios, disponiveis, limiteDeSessao);
        boolean parcial = necessarios > disponiveis;

        boolean atrasada = tarefa.prazo () != null && !tarefa.prazo ().isAfter (agora);
        Instant fimDaSessao = espaco.inicio ().toInstant ().plus (Duration.ofMinutes (noEspaco));

        if (tarefa.prazo () != null && !atrasada && fimDaSessao.isAfter (tarefa.prazo ()))
            return null;

        double urgencia    = urgencia (tarefa, atrasada, necessarios, agora);
        double importancia = importancia (tarefa);
        double encaixe     = encaixe (tarefa, espaco, preferencias, necessarios, disponiveis, parcial);

        double nota = PESO_URGENCIA * urgencia + PESO_IMPORTANCIA * importancia + PESO_ENCAIXE * encaixe;

        return new Candidato (tarefa.id (), arredondar (nota), noEspaco, parcial,
                              arredondar (urgencia), arredondar (importancia), arredondar (encaixe));
    }

    // 1 = apertado ou atrasado; cai linearmente até 0 quando sobram 14 dias ou mais de folga.
    private static double urgencia (Tarefa tarefa, boolean atrasada, int minutosNecessarios, Instant agora)
    {
        if (tarefa.prazo () == null)
            return URGENCIA_SEM_PRAZO;
        if (atrasada)
            return 1.0;

        double folgaMinutos = Duration.between (agora, tarefa.prazo ()).toMinutes () - minutosNecessarios;

        if (folgaMinutos <= 0)
            return 1.0;

        return 1.0 - limitar (folgaMinutos / 1440.0 / HORIZONTE_DE_URGENCIA_DIAS);
    }

    private static double importancia (Tarefa tarefa)
    {
        double valor = tarefa.prioridade () / 10.0;

        if ("prova".equals (tarefa.tipo ()))
            valor += 0.10;
        else if ("trabalho".equals (tarefa.tipo ()))
            valor += 0.05;

        int peso = tarefa.peso () != null ? tarefa.peso () : 3;
        valor += 0.02 * (peso - 3);

        return limitar (valor);
    }

    // 60% o tamanho (cabe inteira, com pouca sobra, é melhor) e 40% a janela de foco.
    private static double encaixe (Tarefa tarefa, EspacoLivre espaco, Preferencias preferencias,
                                   int necessarios, int disponiveis, boolean parcial)
    {
        double tamanho = parcial ? 0.4 : 1.0 - 0.5 * (disponiveis - necessarios) / (double) disponiveis;

        boolean dificil = !tarefa.pessoal () && ("prova".equals (tarefa.tipo ()) || "trabalho".equals (tarefa.tipo ())
                          || (tarefa.dificuldade () != null && tarefa.dificuldade () >= 4));

        double foco = 0.7;
        if (preferencias.focoMatinal () && dificil)
            foco = dentroDaJanela (espaco.inicio ().toLocalTime (), preferencias.janelaFoco ()) ? 1.0 : 0.4;

        return 0.6 * tamanho + 0.4 * foco;
    }

    // Janelas iguais às da tela de Configurações.
    private static boolean dentroDaJanela (LocalTime hora, String janela)
    {
        LocalTime inicio;
        LocalTime fim;

        switch (janela)
        {
            case "tarde": inicio = LocalTime.of (14, 0);  fim = LocalTime.of (18, 0);  break;
            case "noite": inicio = LocalTime.of (19, 0);  fim = LocalTime.of (22, 30); break;
            default:      inicio = LocalTime.of (8, 30);  fim = LocalTime.of (12, 0);
        }

        return !hora.isBefore (inicio) && hora.isBefore (fim);
    }

    // Nota maior primeiro; empates: prazo mais cedo (sem prazo por último), prioridade maior, id.
    static Comparator<Candidato> comparadorDeCandidatos (List<Tarefa> tarefas)
    {
        java.util.Map<String, Tarefa> porId = new java.util.HashMap<String, Tarefa> ();
        for (Tarefa tarefa : tarefas)
            porId.putIfAbsent (tarefa.id (), tarefa);

        return Comparator
            .comparingDouble (Candidato::nota).reversed ()
            .thenComparing (c -> porId.get (c.tarefaId ()).prazo (), Comparator.nullsLast (Comparator.naturalOrder ()))
            .thenComparing (c -> -porId.get (c.tarefaId ()).prioridade ())
            .thenComparing (Candidato::tarefaId);
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
