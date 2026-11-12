import java.util.*;

public class CalculadoraDeMetas
{
    public static final double PESO_URGENCIA    = 0.45;
    public static final double PESO_LACUNA      = 0.35;
    public static final double PESO_IMPORTANCIA = 0.20;

    private static final double HORIZONTE_DE_URGENCIA_DIAS = 14.0;
    private static final double URGENCIA_SEM_PRAZO         = 0.1;

    public static PrioridadeDeMetas calcular (PedidoDeMetas pedido)
    {
        DataHora agora = pedido.getAgora ();
        ArrayList<Meta> metas = pedido.getMetas ();

        ArrayList<NotaDeMeta> notas = new ArrayList<NotaDeMeta> ();
        for (int i = 0; i < metas.size (); i++)
        {
            int primeira = CalculadoraDeMetas.posicaoDoId (metas, metas.get (i).getId ());
            notas.add (avaliar (metas.get (i), metas.get (primeira), agora));
        }

        notas = new Ordenador<NotaDeMeta> ().ordene (notas);

        String foco = notas.size () == 0 ? null : notas.get (0).getMetaId ();
        ArrayList<Integer> dias = new ArrayList<Integer> ();

        if (foco != null)
        {
            Meta meta = metas.get (CalculadoraDeMetas.posicaoDoId (metas, foco));
            dias = diasDosMarcos (meta, agora, pedido.getQuantidadeDeMarcos ());
        }

        return new PrioridadeDeMetas (notas, foco, dias);
    }

    private static int posicaoDoId (ArrayList<Meta> metas, String id)
    {
        for (int i = 0; i < metas.size (); i++)
            if (metas.get (i).getId ().equals (id))
                return i;

        return -1;
    }

    static NotaDeMeta avaliar (Meta meta, Meta referencia, DataHora agora)
    {
        boolean atrasada = meta.getPrazo () != null && !meta.getPrazo ().depoisDe (agora);

        double urgencia    = urgencia (meta, atrasada, agora);
        double lacuna      = limitar (1.0 - meta.getProgresso () / 100.0);
        double importancia = pesoDaPrioridade (meta);

        double nota =
        PESO_URGENCIA * urgencia + PESO_LACUNA * lacuna + PESO_IMPORTANCIA * importancia;

        return new NotaDeMeta (meta.getId (), arredondar (nota), arredondar (urgencia),
                               arredondar (lacuna), arredondar (importancia), atrasada,
                               referencia.getPrazo (), pesoDaPrioridade (referencia));
    }

    private static double urgencia (Meta meta, boolean atrasada, DataHora agora)
    {
        if (meta.getPrazo () == null)
            return URGENCIA_SEM_PRAZO;
        if (atrasada)
            return 1.0;

        double dias = agora.minutosAte (meta.getPrazo ()) / 1440.0;
        return 1.0 - limitar (dias / HORIZONTE_DE_URGENCIA_DIAS); // chega a 0 com 14 dias
    }

    static double pesoDaPrioridade (Meta meta)
    {
        if (meta.getPrioridade ().equals ("alta"))
            return 1.0;
        if (meta.getPrioridade ().equals ("baixa"))
            return 0.3;

        return 0.6;
    }

    static int diasAteOPrazo (Meta meta, DataHora agora)
    {
        int hoje  = agora.getDiaLocal ();
        int prazo = meta.getPrazo ().noFusoDe (agora).getDiaLocal ();

        return Math.max (0, prazo - hoje); // atrasada ou com prazo hoje: zero
    }

    static ArrayList<Integer> diasDosMarcos (Meta meta, DataHora agora, int quantidade)
    {
        ArrayList<Integer> marcos = new ArrayList<Integer> ();

        if (meta.habito () || meta.getPrazo () == null)
            return marcos;

        int dias = diasAteOPrazo (meta, agora);
        int anterior = 0;

        for (int k = 1; k <= quantidade; k++)
        {
            int dia = (int) (dias * k / (double) (quantidade + 1) + 0.5); // partes iguais
            dia = Math.max (dia, Math.min (anterior + 1, dias)); // depois do anterior, se couber
            dia = Math.min (dia, dias);
            anterior = dia;

            marcos.add (agora.getDiaLocal () + dia);
        }

        return marcos;
    }

    private static double limitar (double valor)
    {
        return Math.max (0.0, Math.min (1.0, valor));
    }

    private static double arredondar (double valor)
    {
        return (int) (valor * 1000.0 + 0.5) / 1000.0; // tres casas
    }
}
