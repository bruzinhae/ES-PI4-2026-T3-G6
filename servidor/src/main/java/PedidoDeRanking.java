import java.time.*;
import java.util.*;

public class PedidoDeRanking extends Comunicado
{
    private OffsetDateTime         agora;
    private Preferencias           preferencias;
    private ArrayList<EspacoLivre> espacos = new ArrayList<EspacoLivre> ();
    private ArrayList<Tarefa>      tarefas = new ArrayList<Tarefa> ();
    private int                    limite; // maximo de candidatos por espaco
    private boolean                alocar; // pede tambem a alocacao

    public PedidoDeRanking (ObjetoJson json) throws Exception
    {
        this.agora        = json.getDataHora ("agora");
        this.preferencias = new Preferencias (json.getObjeto ("preferencias"));
        this.limite       = json.getInteiro ("limite");
        this.alocar       = json.getLogico ("alocar");

        for (ObjetoJson espaco : json.getObjetos ("espacos"))
            this.espacos.add (new EspacoLivre (espaco));

        for (ObjetoJson tarefa : json.getObjetos ("tarefas"))
            this.tarefas.add (new Tarefa (tarefa));
    }

    public OffsetDateTime getAgora ()
    {
        return this.agora;
    }

    public Preferencias getPreferencias ()
    {
        return this.preferencias;
    }

    public ArrayList<EspacoLivre> getEspacos ()
    {
        return this.espacos;
    }

    public ArrayList<Tarefa> getTarefas ()
    {
        return this.tarefas;
    }

    public int getLimite ()
    {
        return this.limite;
    }

    public boolean isAlocar ()
    {
        return this.alocar;
    }
}
