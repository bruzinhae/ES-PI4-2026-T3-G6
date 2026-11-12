import java.util.*;

public class PedidoDeMetas extends Comunicado
{
    private static final long serialVersionUID = 1L;

    private DataHora        agora;
    private ArrayList<Meta> metas;
    private int             quantidadeDeMarcos; // marcos novos a propor, de 1 a 5

    public DataHora getAgora ()
    {
        return this.agora;
    }

    public ArrayList<Meta> getMetas ()
    {
        return this.metas;
    }

    public int getQuantidadeDeMarcos ()
    {
        return this.quantidadeDeMarcos;
    }

    public String toString ()
    {
        return "Pedido de metas: " + this.metas.size () + " meta(s), " +
               this.quantidadeDeMarcos + " marco(s)";
    }
}
