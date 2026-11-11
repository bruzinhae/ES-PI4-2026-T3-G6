import java.util.ArrayList;

/**
 * O cliente envia as metas ativas do estudante e pede qual deve receber atenção primeiro e em que
 * datas propor os marcos novos dessa meta. Contrato completo no README.
 */
public class PedidoDeMetas extends Comunicado
{
    private static final long serialVersionUID = 1L;

    private DataHora        agora;
    private ArrayList<Meta> metas;
    private int             quantidadeDeMarcos;

    public DataHora getAgora ()         { return this.agora; }
    public ArrayList<Meta> getMetas ()  { return this.metas; }
    public int getQuantidadeDeMarcos () { return this.quantidadeDeMarcos; }

    public String toString ()
    {
        return "Pedido de metas: " + this.metas.size () + " meta(s), " + this.quantidadeDeMarcos + " marco(s)";
    }
}
