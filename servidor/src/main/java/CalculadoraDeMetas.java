import java.util.ArrayList;

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
public class CalculadoraDeMetas
{
    public static final double PESO_URGENCIA    = 0.45;
    public static final double PESO_LACUNA      = 0.35;
    public static final double PESO_IMPORTANCIA = 0.20;

    private static final double HORIZONTE_DE_URGENCIA_DIAS = 14.0;
    private static final double URGENCIA_SEM_PRAZO         = 0.1;

    private CalculadoraDeMetas () {}

    public static PrioridadeDeMetas calcular (PedidoDeMetas pedido) throws Exception
    {
        DataHora agora = pedido.getAgora ();
        ArrayList<Meta> metas = pedido.getMetas ();

        // Metas com o mesmo id valem como uma só no desempate: vale a primeira da lista.
        ArrayList<NotaDeMeta> notas = new ArrayList<NotaDeMeta> ();
        for (int i = 0; i < metas.size (); i++)
            notas.add (avaliar (metas.get (i), metas.get (CalculadoraDeMetas.posicaoDoId (metas, metas.get (i).getId ())), agora));

        Ordenador.ordene (notas);

        String foco = notas.size () == 0 ? null : notas.get (0).getMetaId ();
        ArrayList<String> datas = foco == null ? new ArrayList<String> ()
                                               : datasDosMarcos (metas.get (CalculadoraDeMetas.posicaoDoId (metas, foco)),
                                                                 pedido.getAgora (), pedido.getQuantidadeDeMarcos ());

        return new PrioridadeDeMetas (notas, foco, datas);
    }

    // A posição da primeira meta da lista com esse id.
    private static int posicaoDoId (ArrayList<Meta> metas, String id)
    {
        for (int i = 0; i < metas.size (); i++)
            if (metas.get (i).getId ().equals (id))
                return i;

        return -1;
    }

    // `referencia` é a meta de que a nota herda o prazo e a prioridade para o desempate.
    static NotaDeMeta avaliar (Meta meta, Meta referencia, DataHora agora) throws Exception
    {
        boolean atrasada = meta.getPrazo () != null && !meta.getPrazo ().depoisDe (agora);

        double urgencia    = urgencia (meta, atrasada, agora);
        double lacuna      = limitar (1.0 - meta.getProgresso () / 100.0);
        double importancia = pesoDaPrioridade (meta);

        double nota = PESO_URGENCIA * urgencia + PESO_LACUNA * lacuna + PESO_IMPORTANCIA * importancia;

        return new NotaDeMeta (meta.getId (), arredondar (nota), arredondar (urgencia), arredondar (lacuna),
                               arredondar (importancia), atrasada, referencia.getPrazo (), pesoDaPrioridade (referencia));
    }

    private static double urgencia (Meta meta, boolean atrasada, DataHora agora)
    {
        if (meta.getPrazo () == null)
            return URGENCIA_SEM_PRAZO;
        if (atrasada)
            return 1.0;

        double dias = agora.minutosAte (meta.getPrazo ()) / 1440.0;
        return 1.0 - limitar (dias / HORIZONTE_DE_URGENCIA_DIAS);
    }

    static double pesoDaPrioridade (Meta meta)
    {
        switch (meta.getPrioridade ())
        {
            case "alta":  return 1.0;
            case "baixa": return 0.3;
            default:      return 0.6;
        }
    }

    // Dias de calendário até o prazo, no fuso do pedido; zero para meta atrasada ou com prazo hoje.
    static int diasAteOPrazo (Meta meta, DataHora agora)
    {
        long hoje  = agora.getDiaLocal ();
        long prazo = meta.getPrazo ().noFusoDe (agora).getDiaLocal ();

        return (int) Math.max (0, prazo - hoje);
    }

    // Posições espaçadas igualmente em k/(n+1) do caminho até o prazo; cada data fica depois da anterior
    // enquanto couber no prazo.
    static ArrayList<String> datasDosMarcos (Meta meta, DataHora agora, int quantidade)
    {
        ArrayList<String> datas = new ArrayList<String> ();

        if (meta.habito () || meta.getPrazo () == null)
            return datas;

        int dias = diasAteOPrazo (meta, agora);
        int anterior = 0;

        for (int k = 1; k <= quantidade; k++)
        {
            int dia = (int) Math.round (dias * k / (double) (quantidade + 1));
            dia = Math.max (dia, Math.min (anterior + 1, dias));
            dia = Math.min (dia, dias);
            anterior = dia;

            datas.add (DataHora.textoDoDia (agora.getDiaLocal () + dia));
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
