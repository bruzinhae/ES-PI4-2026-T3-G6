package br.faculdade.acaistudy.servidor.comunicado;

import br.faculdade.acaistudy.servidor.json.Campos;
import br.faculdade.acaistudy.servidor.modelo.Meta;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * O cliente envia as metas ativas do estudante e pede qual deve receber atenção primeiro e em que
 * datas propor os marcos novos dessa meta. Contrato completo no README.
 */
public class PedidoDeMetas extends Comunicado
{
    public static final int MAXIMO_DE_METAS  = 200;
    public static final int MARCOS_PADRAO    = 3;
    public static final int MARCOS_MAXIMOS   = 5;

    private final OffsetDateTime agora;
    private final List<Meta>     metas;
    private final int            quantidadeDeMarcos;

    public PedidoDeMetas (OffsetDateTime agora, List<Meta> metas, int quantidadeDeMarcos) throws Exception
    {
        if (agora == null)
            throw new Exception ("Data atual ausente");
        if (metas == null)
            throw new Exception ("Metas ausentes");
        if (quantidadeDeMarcos < 1 || quantidadeDeMarcos > MARCOS_MAXIMOS)
            throw new Exception ("Quantidade de marcos inválida");

        this.agora              = agora;
        this.metas              = metas;
        this.quantidadeDeMarcos = quantidadeDeMarcos;
    }

    public OffsetDateTime agora ()      { return this.agora; }
    public List<Meta> metas ()          { return this.metas; }
    public int quantidadeDeMarcos ()    { return this.quantidadeDeMarcos; }

    public String tipo ()
    {
        return "pedidoDeMetas";
    }

    protected Map<String, Object> campos ()
    {
        return Map.of (); // o servidor só recebe este comunicado; nunca o envia
    }

    static PedidoDeMetas deMapa (Map<String, Object> mapa) throws Exception
    {
        OffsetDateTime agora = Campos.dataHora (mapa, "agora", false);

        List<Meta> metas = new ArrayList<Meta> ();
        for (Object item : Campos.lista (mapa, "metas", MAXIMO_DE_METAS))
        {
            Map<String, Object> m = Campos.comoObjeto (item, "metas[]");

            String tipo = Campos.texto (m, "tipo", false, "geral");
            if (!List.of ("geral", "disciplina", "habito", "projeto").contains (tipo))
                throw new Exception ("\"tipo\" da meta deve ser geral, disciplina, habito ou projeto");

            String prioridade = Campos.texto (m, "prioridade", false, "media");
            if (!List.of ("baixa", "media", "alta").contains (prioridade))
                throw new Exception ("\"prioridade\" da meta deve ser baixa, media ou alta");

            // Só metas ativas entram na disputa; concluídas e canceladas são ignoradas.
            if (!Campos.texto (m, "situacao", false, "ativa").equals ("ativa"))
                continue;

            Integer progresso = Campos.inteiro (m, "progresso", false, 0, 100);
            OffsetDateTime prazo = Campos.dataHora (m, "prazo", false);

            metas.add (new Meta (Campos.texto (m, "id", true, null),
                                 Campos.texto (m, "titulo", false, ""),
                                 tipo, prioridade,
                                 progresso == null ? 0 : progresso,
                                 prazo == null ? null : prazo.toInstant ()));
        }

        Integer marcos = Campos.inteiro (mapa, "quantidadeDeMarcos", false, 1, MARCOS_MAXIMOS);

        return new PedidoDeMetas (agora == null ? OffsetDateTime.now (ZoneOffset.ofHours (-3)) : agora,
                                  metas, marcos == null ? MARCOS_PADRAO : marcos);
    }
}
