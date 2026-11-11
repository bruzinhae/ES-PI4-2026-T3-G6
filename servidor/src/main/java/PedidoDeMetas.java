import java.util.ArrayList;

/**
 * O cliente envia as metas ativas do estudante e pede qual deve receber atenção primeiro e em que
 * datas propor os marcos novos dessa meta. Contrato completo no README.
 */
public class PedidoDeMetas extends Comunicado
{
    public static final int MAXIMO_DE_METAS = 200;
    public static final int MARCOS_PADRAO   = 3;
    public static final int MARCOS_MAXIMOS  = 5;

    private DataHora        agora;
    private ArrayList<Meta> metas;
    private int             quantidadeDeMarcos;

    public PedidoDeMetas (DataHora agora, ArrayList<Meta> metas, int quantidadeDeMarcos) throws Exception
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

    public DataHora getAgora ()         { return this.agora; }
    public ArrayList<Meta> getMetas ()  { return this.metas; }
    public int getQuantidadeDeMarcos () { return this.quantidadeDeMarcos; }

    @Override
    public String tipo ()
    {
        return "pedidoDeMetas";
    }

    @Override
    protected Objeto campos ()
    {
        return new Objeto (); // o servidor só recebe este comunicado; nunca o envia
    }

    @Override
    public String toString ()
    {
        return "Pedido de metas: " + this.metas.size () + " meta(s), " + this.quantidadeDeMarcos + " marco(s)";
    }

    static PedidoDeMetas deObjeto (Objeto objeto) throws Exception
    {
        DataHora agora = Campos.dataHora (objeto, "agora", false);

        ArrayList<Meta> metas = new ArrayList<Meta> ();
        for (Object item : Campos.lista (objeto, "metas", MAXIMO_DE_METAS))
        {
            Objeto m = Campos.comoObjeto (item, "metas[]");

            String tipo = Campos.texto (m, "tipo", false, "geral");
            if (!tipo.equals ("geral") && !tipo.equals ("disciplina") && !tipo.equals ("habito") && !tipo.equals ("projeto"))
                throw new Exception ("\"tipo\" da meta deve ser geral, disciplina, habito ou projeto");

            String prioridade = Campos.texto (m, "prioridade", false, "media");
            if (!prioridade.equals ("baixa") && !prioridade.equals ("media") && !prioridade.equals ("alta"))
                throw new Exception ("\"prioridade\" da meta deve ser baixa, media ou alta");

            // Só metas ativas entram na disputa; concluídas e canceladas são ignoradas.
            if (!Campos.texto (m, "situacao", false, "ativa").equals ("ativa"))
                continue;

            Integer progresso = Campos.inteiro (m, "progresso", false, 0, 100);
            DataHora prazo = Campos.dataHora (m, "prazo", false);

            metas.add (new Meta (Campos.texto (m, "id", true, null),
                                 Campos.texto (m, "titulo", false, ""),
                                 tipo, prioridade,
                                 progresso == null ? 0 : progresso,
                                 prazo));
        }

        Integer marcos = Campos.inteiro (objeto, "quantidadeDeMarcos", false, 1, MARCOS_MAXIMOS);

        return new PedidoDeMetas (agora == null ? DataHora.agora (-3 * 3600) : agora,
                                  metas, marcos == null ? MARCOS_PADRAO : marcos);
    }
}
