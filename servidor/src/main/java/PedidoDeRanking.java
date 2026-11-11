import java.util.*;

// O cliente envia os espaços livres da grade, as tarefas pendentes e as preferências do
// usuário, e pede o ranking de candidatos para cada espaço. Contrato completo no README.
public class PedidoDeRanking extends Comunicado
{
    private static final long serialVersionUID = 1L;

    private DataHora                agora;
    private Preferencias            preferencias;
    private ArrayList<EspacoLivre>  espacos;
    private ArrayList<Tarefa>       tarefas;
    private int                     limite;
    private boolean                 alocar;

    public DataHora getAgora ()                 { return this.agora; }
    public Preferencias getPreferencias ()      { return this.preferencias; }
    public ArrayList<EspacoLivre> getEspacos () { return this.espacos; }
    public ArrayList<Tarefa> getTarefas ()      { return this.tarefas; }
    public int getLimite ()                     { return this.limite; }
    public boolean isAlocar ()                 { return this.alocar; }

    public String toString ()
    {
        return "Pedido de ranking: " + this.espacos.size () + " espaco(s), " + this.tarefas.size () + " tarefa(s)";
    }
}
