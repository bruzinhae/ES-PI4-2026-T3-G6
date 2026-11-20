// Guilherme Domingues de Sousa - 22013871
package calculo;

import comunicado.*;
import modelo.*;
import java.time.*;
import java.time.temporal.*;
import java.util.*;

// Prioriza as metas do usuario. Nota = 0,45 x urgencia + 0,35 x lacuna (quanto falta
// de progresso) + 0,20 x importancia. A meta de maior nota e o foco, e para ela
// o servidor propoe as datas dos marcos. Nao guarda estado entre pedidos.
public class CalculadoraDeMetas
{
    public static final double PESO_URGENCIA    = 0.45;
    public static final double PESO_LACUNA      = 0.35;
    public static final double PESO_IMPORTANCIA = 0.20;

    private static final double HORIZONTE_DE_URGENCIA_DIAS = 14.0;
    private static final double URGENCIA_SEM_PRAZO         = 0.1;

    // Avalia cada meta, ordena da mais para a menos urgente e define o foco
    public static PrioridadeDeMetas calcular (PedidoDeMetas pedido)
    {
        OffsetDateTime agora = pedido.getAgora ();
        ArrayList<Meta> metas = pedido.getMetas ();

        ArrayList<NotaDeMeta> notas = new ArrayList<NotaDeMeta> ();
        for (int i = 0; i < metas.size (); i++)
        {
            int primeira = CalculadoraDeMetas.posicaoDoId (metas, metas.get (i).getId ());
            notas.add (avaliar (metas.get (i), metas.get (primeira), agora));
        }

        Collections.sort (notas);

        String foco = notas.size () == 0 ? null : notas.get (0).getMetaId ();
        ArrayList<String> datas = new ArrayList<String> ();

        if (foco != null)
        {
            Meta meta = metas.get (CalculadoraDeMetas.posicaoDoId (metas, foco));
            datas = datasDosMarcos (meta, agora, pedido.getQuantidadeDeMarcos ());
        }

        return new PrioridadeDeMetas (notas, foco, datas);
    }

    // Posicao da primeira meta com esse id, ou -1 se nao existe
    private static int posicaoDoId (ArrayList<Meta> metas, String id)
    {
        for (int i = 0; i < metas.size (); i++)
            if (metas.get (i).getId ().equals (id))
                return i;

        return -1;
    }

    // Calcula a nota de uma meta; referencia e a primeira meta com o mesmo id,
    // usada nos desempates
    static NotaDeMeta avaliar (Meta meta, Meta referencia, OffsetDateTime agora)
    {
        boolean atrasada = meta.getPrazo () != null && !meta.getPrazo ().isAfter (agora);

        double urgencia    = urgencia (meta, atrasada, agora);
        double lacuna      = limitar (1.0 - meta.getProgresso () / 100.0);
        double importancia = pesoDaPrioridade (meta);

        double nota =
        PESO_URGENCIA * urgencia + PESO_LACUNA * lacuna + PESO_IMPORTANCIA * importancia;

        return new NotaDeMeta (meta.getId (), arredondar (nota), arredondar (urgencia),
                               arredondar (lacuna), arredondar (importancia), atrasada,
                               referencia.getPrazo (), pesoDaPrioridade (referencia));
    }

    // 1 se ja passou do prazo; 0,1 se nao tem prazo; senao cai de 1 ate 0 em 14 dias
    private static double urgencia (Meta meta, boolean atrasada, OffsetDateTime agora)
    {
        if (meta.getPrazo () == null)
            return URGENCIA_SEM_PRAZO;
        if (atrasada)
            return 1.0;

        double dias = Duration.between (agora, meta.getPrazo ()).toMinutes () / 1440.0;
        return 1.0 - limitar (dias / HORIZONTE_DE_URGENCIA_DIAS); // chega a 0 com 14 dias
    }

    // alta = 1,0; media = 0,6; baixa = 0,3
    static double pesoDaPrioridade (Meta meta)
    {
        if (meta.getPrioridade ().equals ("alta"))
            return 1.0;
        if (meta.getPrioridade ().equals ("baixa"))
            return 0.3;

        return 0.6;
    }

    // Dias inteiros de hoje ate o prazo, no fuso de agora (zero se ja venceu)
    static int diasAteOPrazo (Meta meta, OffsetDateTime agora)
    {
        LocalDate hoje  = agora.toLocalDate ();
        LocalDate prazo = meta.getPrazo ().withOffsetSameInstant (agora.getOffset ()).toLocalDate ();

        return (int) Math.max (0, ChronoUnit.DAYS.between (hoje, prazo)); // atrasada ou com prazo hoje: zero
    }

    // Divide o tempo ate o prazo em partes iguais e devolve as datas (AAAA-MM-DD) dos
    // marcos. Habito ou meta sem prazo nao tem marcos.
    static ArrayList<String> datasDosMarcos (Meta meta, OffsetDateTime agora, int quantidade)
    {
        ArrayList<String> datas = new ArrayList<String> ();

        if (meta.habito () || meta.getPrazo () == null)
            return datas;

        LocalDate hoje = agora.toLocalDate ();

        int dias = diasAteOPrazo (meta, agora);
        int anterior = 0;

        for (int k = 1; k <= quantidade; k++)
        {
            int dia = (int) (dias * k / (double) (quantidade + 1) + 0.5); // partes iguais
            dia = Math.max (dia, Math.min (anterior + 1, dias)); // depois do anterior, se couber
            dia = Math.min (dia, dias);
            anterior = dia;

            datas.add (hoje.plusDays (dia).toString ());
        }

        return datas;
    }

    // Mantem o valor entre 0 e 1
    private static double limitar (double valor)
    {
        return Math.max (0.0, Math.min (1.0, valor));
    }

    // Arredonda para tres casas decimais
    private static double arredondar (double valor)
    {
        return (int) (valor * 1000.0 + 0.5) / 1000.0; // tres casas
    }
}
