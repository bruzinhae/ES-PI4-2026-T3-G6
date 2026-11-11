import java.util.ArrayList;

/**
 * Resultado da alocacao: as sessoes decididas (em ordem cronologica) e as tarefas que nao couberam por inteiro.
 *
 * truncada true se a alocacao parou ao atingir o limite de sessoes por pedido
 */
public class Alocacao implements Cloneable
{
    private ArrayList<SessaoAlocada>     sessoes;
    private ArrayList<TarefaSemAlocacao> semAlocacao;
    private boolean                      truncada;

    public Alocacao (ArrayList<SessaoAlocada> sessoes, ArrayList<TarefaSemAlocacao> semAlocacao, boolean truncada) throws Exception
    {
        if (sessoes == null)
            throw new Exception ("Sessoes ausente");
        if (semAlocacao == null)
            throw new Exception ("SemAlocacao ausente");

        this.sessoes     = sessoes;
        this.semAlocacao = semAlocacao;
        this.truncada    = truncada;
    }

    public ArrayList<SessaoAlocada> getSessoes ()
    {
        return this.sessoes;
    }

    public ArrayList<TarefaSemAlocacao> getSemAlocacao ()
    {
        return this.semAlocacao;
    }

    public boolean getTruncada ()
    {
        return this.truncada;
    }

    // Os campos que a resposta ao pedido de ranking ganha quando o pedido pede a alocacao.
    public Objeto paraObjeto ()
    {
        ArrayList<Object> itens = new ArrayList<Object> ();
        for (SessaoAlocada sessao : this.sessoes)
            itens.add (sessao.paraObjeto ());

        ArrayList<Object> sem = new ArrayList<Object> ();
        for (TarefaSemAlocacao tarefa : this.semAlocacao)
            sem.add (tarefa.paraObjeto ());

        Objeto ret = new Objeto ();
        ret.guarde ("alocacao", itens);
        ret.guarde ("semAlocacao", sem);
        if (this.truncada)
            ret.guarde ("alocacaoTruncada", true);
        return ret;
    }

    @Override
    public String toString ()
    {
        return "sessoes....: " + this.sessoes + "\n" +
               "semAlocacao: " + this.semAlocacao + "\n" +
               "truncada...: " + this.truncada;
    }

    @Override
    public boolean equals (Object obj)
    {
        if (obj == this) return true;
        if (obj == null) return false;

        if (obj.getClass () != this.getClass ()) return false;
        Alocacao outro = (Alocacao) obj;

        if (!this.sessoes.equals (outro.sessoes)) return false;
        if (!this.semAlocacao.equals (outro.semAlocacao)) return false;
        if (this.truncada != outro.truncada) return false;

        return true;
    }

    @Override
    public int hashCode ()
    {
        int ret = 666;

        ret = ret * 7 + this.sessoes.hashCode ();
        ret = ret * 7 + this.semAlocacao.hashCode ();
        ret = ret * 7 + ((Boolean) this.truncada).hashCode ();

        if (ret < 0) ret = -ret;
        return ret;
    }

    // construtor de copia
    public Alocacao (Alocacao modelo) throws Exception
    {
        if (modelo == null)
            throw new Exception ("Modelo ausente");

        this.sessoes     = new ArrayList<SessaoAlocada> (modelo.sessoes);
        this.semAlocacao = new ArrayList<TarefaSemAlocacao> (modelo.semAlocacao);
        this.truncada    = modelo.truncada;
    }

    @Override
    public Object clone ()
    {
        Alocacao ret = null;

        try
        {
            ret = new Alocacao (this);
        }
        catch (Exception erro)
        {} // sei que nao vai dar erro

        return ret;
    }
}
