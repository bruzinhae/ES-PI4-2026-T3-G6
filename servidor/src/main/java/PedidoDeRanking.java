import java.util.ArrayList;

/**
 * O cliente envia os espaços livres da grade, as tarefas pendentes e as preferências do
 * usuário, e pede o ranking de candidatos para cada espaço. Contrato completo no README.
 */
public class PedidoDeRanking extends Comunicado
{
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
        if (agora == null)
            throw new Exception ("Data atual ausente");
        if (preferencias == null)
            throw new Exception ("Preferências ausentes");
        if (espacos == null)
            throw new Exception ("Espaços ausentes");
        if (tarefas == null)
            throw new Exception ("Tarefas ausentes");
        if (limite < 1)
            throw new Exception ("Limite inválido");

        this.agora        = agora;
        this.preferencias = preferencias;
        this.espacos      = espacos;
        this.tarefas      = tarefas;
        this.limite       = limite;
        this.alocar       = alocar;
    }

    public DataHora getAgora ()                 { return this.agora; }
    public Preferencias getPreferencias ()      { return this.preferencias; }
    public ArrayList<EspacoLivre> getEspacos () { return this.espacos; }
    public ArrayList<Tarefa> getTarefas ()      { return this.tarefas; }
    public int getLimite ()                     { return this.limite; }
    public boolean getAlocar ()                 { return this.alocar; }

    @Override
    public String tipo ()
    {
        return "pedidoDeRanking";
    }

    @Override
    protected Objeto campos ()
    {
        return new Objeto (); // o servidor só recebe este comunicado; nunca o envia
    }

    @Override
    public String toString ()
    {
        return "Pedido de ranking: " + this.espacos.size () + " espaco(s), " + this.tarefas.size () + " tarefa(s)";
    }

    static PedidoDeRanking deObjeto (Objeto objeto) throws Exception
    {
        DataHora agora = Campos.dataHora (objeto, "agora", false);

        Preferencias preferencias = Preferencias.padrao ();
        if (objeto.get ("preferencias") != null)
        {
            Objeto p = Campos.comoObjeto (objeto.get ("preferencias"), "preferencias");
            String janela = Campos.texto (p, "janelaFoco", false, "manha");

            if (!janela.equals ("manha") && !janela.equals ("tarde") && !janela.equals ("noite"))
                throw new Exception ("\"janelaFoco\" deve ser manha, tarde ou noite");

            Integer duracao = Campos.inteiro (p, "duracaoMinutos", false, 10, 240);
            preferencias = new Preferencias (janela, Campos.logico (p, "focoMatinal", true), duracao == null ? 50 : duracao,
                                             Campos.logico (p, "antifadiga", true));
        }

        ArrayList<EspacoLivre> espacos = new ArrayList<EspacoLivre> ();
        for (Object item : Campos.lista (objeto, "espacos", MAXIMO_DE_ITENS))
        {
            Objeto e = Campos.comoObjeto (item, "espacos[]");
            DataHora inicio = Campos.dataHora (e, "inicio", true);
            DataHora fim    = Campos.dataHora (e, "fim", true);

            if (!fim.depoisDe (inicio))
                throw new Exception ("Em \"espacos\", o \"fim\" deve ser depois do \"inicio\"");

            espacos.add (new EspacoLivre (Campos.texto (e, "id", true, null), inicio, fim));
        }

        ArrayList<Tarefa> tarefas = new ArrayList<Tarefa> ();
        for (Object item : Campos.lista (objeto, "tarefas", MAXIMO_DE_ITENS))
        {
            Objeto t = Campos.comoObjeto (item, "tarefas[]");
            DataHora prazo = Campos.dataHora (t, "prazo", false);

            Integer prioridade = Campos.inteiro (t, "prioridade", false, 1, 10);
            Integer dificuldade = null;
            Integer peso = null;

            if (t.get ("disciplina") != null)
            {
                Objeto d = Campos.comoObjeto (t.get ("disciplina"), "disciplina");
                dificuldade = Campos.inteiro (d, "dificuldade", false, 1, 5);
                peso        = Campos.inteiro (d, "peso", false, 1, 5);
            }

            String categoria = Campos.texto (t, "categoria", false, Tarefa.CATEGORIA_ESTUDOS);
            if (!Tarefa.CATEGORIA_ESTUDOS.equals (categoria) && !Tarefa.CATEGORIA_PESSOAL.equals (categoria))
                throw new Exception ("\"categoria\" deve ser \"estudos\" ou \"pessoal\"");

            tarefas.add (new Tarefa (Campos.texto (t, "id", true, null),
                                     Campos.texto (t, "titulo", false, ""),
                                     categoria,
                                     Campos.texto (t, "tipo", false, "outro"),
                                     prioridade == null ? 5 : prioridade,
                                     prazo,
                                     Campos.inteiro (t, "minutosEstimados", false, 15, 1440),
                                     dificuldade,
                                     peso,
                                     Campos.texto (t, "situacao", false, "pendente")));
        }

        Integer limite = Campos.inteiro (objeto, "limite", false, 1, 100);

        return new PedidoDeRanking (agora == null ? DataHora.agora (0) : agora,
                                    preferencias, espacos, tarefas,
                                    limite == null ? LIMITE_PADRAO : limite,
                                    Campos.logico (objeto, "alocar", false));
    }
}
