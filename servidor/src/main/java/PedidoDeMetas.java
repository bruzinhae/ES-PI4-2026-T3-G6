import java.util.ArrayList;

/**
 * O cliente envia as metas ativas do estudante e pede qual deve receber atenção primeiro e em que
 * datas propor os marcos novos dessa meta. Contrato completo no README.
 */
public class PedidoDeMetas extends Comunicado
{
    private static final long serialVersionUID = 1L;

    public static final int MAXIMO_DE_METAS = 200;
    public static final int MARCOS_PADRAO   = 3;
    public static final int MARCOS_MAXIMOS  = 5;

    private DataHora        agora;
    private ArrayList<Meta> metas;
    private int             quantidadeDeMarcos;

    public PedidoDeMetas (DataHora agora, ArrayList<Meta> metas, int quantidadeDeMarcos) throws Exception
    {
        this.agora              = agora;
        this.metas              = metas;
        this.quantidadeDeMarcos = quantidadeDeMarcos;

        this.valide ();
    }

    public DataHora getAgora ()         { return this.agora; }
    public ArrayList<Meta> getMetas ()  { return this.metas; }
    public int getQuantidadeDeMarcos () { return this.quantidadeDeMarcos; }

    // Confere o pedido inteiro (o servidor chama este método em cada pedido que chega).
    public void valide () throws Exception
    {
        if (this.agora == null)
            throw new Exception ("Data atual ausente");
        if (this.metas == null)
            throw new Exception ("Metas ausentes");

        if (this.metas.size () > MAXIMO_DE_METAS)
            throw new Exception ("\"metas\" aceita no máximo " + MAXIMO_DE_METAS + " itens");

        for (Meta meta : this.metas)
        {
            if (meta == null)
                throw new Exception ("\"metas[]\" deve ser um objeto");

            if (!meta.getTipo ().equals ("geral") && !meta.getTipo ().equals ("disciplina")
                && !meta.getTipo ().equals ("habito") && !meta.getTipo ().equals ("projeto"))
                throw new Exception ("\"tipo\" da meta deve ser geral, disciplina, habito ou projeto");

            if (!meta.getPrioridade ().equals ("baixa") && !meta.getPrioridade ().equals ("media")
                && !meta.getPrioridade ().equals ("alta"))
                throw new Exception ("\"prioridade\" da meta deve ser baixa, media ou alta");

            if (meta.getProgresso () < 0 || meta.getProgresso () > 100)
                throw new Exception ("\"progresso\" deve estar entre 0 e 100");

            if (meta.getId () == null)
                throw new Exception ("\"id\" é obrigatório");
            if (meta.getId ().length () == 0)
                throw new Exception ("\"id\" não pode ser vazio");
        }

        if (this.quantidadeDeMarcos < 1 || this.quantidadeDeMarcos > MARCOS_MAXIMOS)
            throw new Exception ("\"quantidadeDeMarcos\" deve estar entre 1 e " + MARCOS_MAXIMOS);
    }

    @Override
    public String toString ()
    {
        return "Pedido de metas: " + this.metas.size () + " meta(s), " + this.quantidadeDeMarcos + " marco(s)";
    }
}
