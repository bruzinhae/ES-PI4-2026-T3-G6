package br.faculdade.acaistudy.servidor.ranking;

import br.faculdade.acaistudy.servidor.comunicado.PedidoDeMetas;
import br.faculdade.acaistudy.servidor.comunicado.PrioridadeDeMetas;
import br.faculdade.acaistudy.servidor.modelo.Meta;
import br.faculdade.acaistudy.servidor.modelo.NotaDeMeta;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Decide qual meta merece atenção primeiro e em que datas propor os marcos novos dela.
 *
 * Nota = 0,45 x urgência + 0,35 x lacuna + 0,20 x importância   (cada parte vai de 0 a 1)
 *
 *   urgência    1 se o prazo já passou; 0,1 sem prazo; senão cai linearmente até 0 com 14 dias de folga;
 *   lacuna      quanto falta para a meta: 1 - progresso/100;
 *   importância prioridade que o estudante deu à meta (baixa 0,3, média 0,6, alta 1,0).
 *
 * Os pesos são os mesmos do ranking de tarefas (CalculadoraDeRanking).
 * Desempate: prazo mais cedo (sem prazo por último), prioridade maior, id.
 *
 * Datas dos marcos (só para a meta foco, e nunca para hábito ou meta sem prazo): espaçadas igualmente
 * entre hoje e o prazo, em dias diferentes sempre que o prazo permitir. Meta atrasada recebe hoje.
 *
 * É uma classe sem estado: pode ser usada por várias threads ao mesmo tempo.
 */
public final class CalculadoraDeMetas
{
    public static final double PESO_URGENCIA    = 0.45;
    public static final double PESO_LACUNA      = 0.35;
    public static final double PESO_IMPORTANCIA = 0.20;

    private static final double HORIZONTE_DE_URGENCIA_DIAS = 14.0;
    private static final double URGENCIA_SEM_PRAZO         = 0.1;

    private CalculadoraDeMetas () {}

    public static PrioridadeDeMetas calcular (PedidoDeMetas pedido) throws Exception
    {
        Instant agora = pedido.agora ().toInstant ();

        Map<String, Meta> porId = new HashMap<String, Meta> ();
        List<NotaDeMeta> notas = new ArrayList<NotaDeMeta> ();

        for (Meta meta : pedido.metas ())
        {
            porId.putIfAbsent (meta.id (), meta);
            notas.add (avaliar (meta, agora));
        }

        notas.sort (Comparator
            .comparingDouble (NotaDeMeta::nota).reversed ()
            .thenComparing (n -> porId.get (n.metaId ()).prazo (), Comparator.nullsLast (Comparator.naturalOrder ()))
            .thenComparing (n -> -pesoDaPrioridade (porId.get (n.metaId ())))
            .thenComparing (NotaDeMeta::metaId));

        String foco = notas.isEmpty () ? null : notas.get (0).metaId ();
        List<String> datas = foco == null ? new ArrayList<String> ()
                                          : datasDosMarcos (porId.get (foco), pedido.agora (), pedido.quantidadeDeMarcos ());

        return new PrioridadeDeMetas (notas, foco, datas);
    }

    static NotaDeMeta avaliar (Meta meta, Instant agora)
    {
        boolean atrasada = meta.prazo () != null && !meta.prazo ().isAfter (agora);

        double urgencia    = urgencia (meta, atrasada, agora);
        double lacuna      = limitar (1.0 - meta.progresso () / 100.0);
        double importancia = pesoDaPrioridade (meta);

        double nota = PESO_URGENCIA * urgencia + PESO_LACUNA * lacuna + PESO_IMPORTANCIA * importancia;

        return new NotaDeMeta (meta.id (), arredondar (nota), arredondar (urgencia), arredondar (lacuna),
                               arredondar (importancia), atrasada);
    }

    private static double urgencia (Meta meta, boolean atrasada, Instant agora)
    {
        if (meta.prazo () == null)
            return URGENCIA_SEM_PRAZO;
        if (atrasada)
            return 1.0;

        double dias = Duration.between (agora, meta.prazo ()).toMinutes () / 1440.0;
        return 1.0 - limitar (dias / HORIZONTE_DE_URGENCIA_DIAS);
    }

    private static double pesoDaPrioridade (Meta meta)
    {
        switch (meta.prioridade ())
        {
            case "alta":  return 1.0;
            case "baixa": return 0.3;
            default:      return 0.6;
        }
    }

    // Dias de calendário até o prazo, no fuso do pedido; zero para meta atrasada ou com prazo hoje.
    static int diasAteOPrazo (Meta meta, OffsetDateTime agora)
    {
        LocalDate hoje  = agora.toLocalDate ();
        LocalDate prazo = meta.prazo ().atOffset (agora.getOffset ()).toLocalDate ();

        return (int) Math.max (0, ChronoUnit.DAYS.between (hoje, prazo));
    }

    // Posições espaçadas igualmente em k/(n+1) do caminho até o prazo; cada data fica depois da anterior
    // enquanto couber no prazo.
    static List<String> datasDosMarcos (Meta meta, OffsetDateTime agora, int quantidade)
    {
        List<String> datas = new ArrayList<String> ();

        if (meta.habito () || meta.prazo () == null)
            return datas;

        int dias = diasAteOPrazo (meta, agora);
        int anterior = 0;

        for (int k = 1; k <= quantidade; k++)
        {
            int dia = (int) Math.round (dias * k / (double) (quantidade + 1));
            dia = Math.max (dia, Math.min (anterior + 1, dias));
            dia = Math.min (dia, dias);
            anterior = dia;

            datas.add (agora.toLocalDate ().plusDays (dia).toString ());
        }

        return datas;
    }

    private static double limitar (double valor)
    {
        return Math.max (0.0, Math.min (1.0, valor));
    }

    private static double arredondar (double valor)
    {
        return Math.round (valor * 1000.0) / 1000.0;
    }
}
