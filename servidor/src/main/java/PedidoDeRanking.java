import java.util.*;

public class PedidoDeRanking extends Comunicado
{
    private static final long serialVersionUID = 1L;

    private DataHora                agora;
    private Preferencias            preferencias;
    private ArrayList<EspacoLivre>  espacos;
    private ArrayList<Tarefa>       tarefas;
    private int                     limite; // maximo de candidatos por espaco
    private boolean                 alocar; // pede tambem a alocacao

    public DataHora getAgora ()                 { return this.agora; }
    public Preferencias getPreferencias ()      { return this.preferencias; }
    public ArrayList<EspacoLivre> getEspacos () { return this.espacos; }
    public ArrayList<Tarefa> getTarefas ()      { return this.tarefas; }
    public int getLimite ()                     { return this.limite; }
    public boolean isAlocar ()                 { return this.alocar; }

    public String toString ()
    {
        return "Pedido de ranking: " + this.espacos.size () + " espaco(s), " +
               this.tarefas.size () + " tarefa(s)";
    }
}
