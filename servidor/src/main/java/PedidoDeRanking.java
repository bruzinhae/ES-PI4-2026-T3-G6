import java.util.ArrayList;

/**
 * O cliente envia os espaços livres da grade, as tarefas pendentes e as preferências do
 * usuário, e pede o ranking de candidatos para cada espaço. Contrato completo no README.
 */
public class PedidoDeRanking extends Comunicado
{
    private static final long serialVersionUID = 1L;

    public static final int MAXIMO_DE_ITENS = 2000;
    public static final int LIMITE_PADRAO   = 10;

    private DataHora                agora;
    private Preferencias            preferencias;
    private ArrayList<EspacoLivre>  espacos;
    private ArrayList<Tarefa>       tarefas;
    private int                     limite;
    private boolean                 alocar;

    public PedidoDeRanking (DataHora agora, Preferencias preferencias, ArrayList<EspacoLivre> espacos,
                            ArrayList<Tarefa> tarefas, int limite) throws Exception
    {
        this (agora, preferencias, espacos, tarefas, limite, false);
    }

    public PedidoDeRanking (DataHora agora, Preferencias preferencias, ArrayList<EspacoLivre> espacos,
                            ArrayList<Tarefa> tarefas, int limite, boolean alocar) throws Exception
    {
        this.agora        = agora;
        this.preferencias = preferencias;
        this.espacos      = espacos;
        this.tarefas      = tarefas;
        this.limite       = limite;
        this.alocar       = alocar;

        this.valide ();
    }

    public DataHora getAgora ()                 { return this.agora; }
    public Preferencias getPreferencias ()      { return this.preferencias; }
    public ArrayList<EspacoLivre> getEspacos () { return this.espacos; }
    public ArrayList<Tarefa> getTarefas ()      { return this.tarefas; }
    public int getLimite ()                     { return this.limite; }
    public boolean getAlocar ()                 { return this.alocar; }

    // Confere o pedido inteiro. Quem lê um objeto serializado não passa pelo construtor,
    // então o servidor chama este método em cada pedido que chega.
    public void valide () throws Exception
    {
        if (this.agora == null)
            throw new Exception ("Data atual ausente");
        if (this.preferencias == null)
            throw new Exception ("Preferências ausentes");
        if (this.espacos == null)
            throw new Exception ("Espaços ausentes");
        if (this.tarefas == null)
            throw new Exception ("Tarefas ausentes");

        if (!this.preferencias.getJanelaFoco ().equals ("manha") && !this.preferencias.getJanelaFoco ().equals ("tarde")
            && !this.preferencias.getJanelaFoco ().equals ("noite"))
            throw new Exception ("\"janelaFoco\" deve ser manha, tarde ou noite");

        if (this.preferencias.getDuracaoMinutos () < 10 || this.preferencias.getDuracaoMinutos () > 240)
            throw new Exception ("\"duracaoMinutos\" deve estar entre 10 e 240");

        if (this.espacos.size () > MAXIMO_DE_ITENS)
            throw new Exception ("\"espacos\" aceita no máximo " + MAXIMO_DE_ITENS + " itens");

        for (EspacoLivre espaco : this.espacos)
        {
            if (espaco == null || espaco.getInicio () == null)
                throw new Exception ("\"inicio\" é obrigatório");
            if (espaco.getFim () == null)
                throw new Exception ("\"fim\" é obrigatório");
            if (!espaco.getFim ().depoisDe (espaco.getInicio ()))
                throw new Exception ("Em \"espacos\", o \"fim\" deve ser depois do \"inicio\"");

            PedidoDeRanking.confiraId (espaco.getId ());
        }

        if (this.tarefas.size () > MAXIMO_DE_ITENS)
            throw new Exception ("\"tarefas\" aceita no máximo " + MAXIMO_DE_ITENS + " itens");

        for (Tarefa tarefa : this.tarefas)
        {
            if (tarefa == null)
                throw new Exception ("\"tarefas[]\" deve ser um objeto");

            if (tarefa.getPrioridade () < 1 || tarefa.getPrioridade () > 10)
                throw new Exception ("\"prioridade\" deve estar entre 1 e 10");

            if (tarefa.getDificuldade () != null && (tarefa.getDificuldade () < 1 || tarefa.getDificuldade () > 5))
                throw new Exception ("\"dificuldade\" deve estar entre 1 e 5");

            if (tarefa.getPeso () != null && (tarefa.getPeso () < 1 || tarefa.getPeso () > 5))
                throw new Exception ("\"peso\" deve estar entre 1 e 5");

            if (!Tarefa.CATEGORIA_ESTUDOS.equals (tarefa.getCategoria ()) && !Tarefa.CATEGORIA_PESSOAL.equals (tarefa.getCategoria ()))
                throw new Exception ("\"categoria\" deve ser \"estudos\" ou \"pessoal\"");

            PedidoDeRanking.confiraId (tarefa.getId ());

            if (tarefa.getMinutosEstimados () != null && (tarefa.getMinutosEstimados () < 15 || tarefa.getMinutosEstimados () > 1440))
                throw new Exception ("\"minutosEstimados\" deve estar entre 15 e 1440");
        }

        if (this.limite < 1 || this.limite > 100)
            throw new Exception ("\"limite\" deve estar entre 1 e 100");
    }

    private static void confiraId (String id) throws Exception
    {
        if (id == null)
            throw new Exception ("\"id\" é obrigatório");
        if (id.length () == 0)
            throw new Exception ("\"id\" não pode ser vazio");
    }

    @Override
    public String toString ()
    {
        return "Pedido de ranking: " + this.espacos.size () + " espaco(s), " + this.tarefas.size () + " tarefa(s)";
    }
}
