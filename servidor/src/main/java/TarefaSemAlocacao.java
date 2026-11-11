/**
 * Tarefa que ficou (total ou parcialmente) sem espaco na alocacao.
 * motivo: "sem_espacos", "nenhum_espaco_antes_do_prazo", "espacos_insuficientes" ou "alocacao_parcial".
 */
public class TarefaSemAlocacao implements Cloneable
{
    private String tarefaId;
    private String motivo;
    private int    minutosRestantes;

    public TarefaSemAlocacao (String tarefaId, String motivo, int minutosRestantes) throws Exception
    {
        if (tarefaId == null)
            throw new Exception ("TarefaId ausente");
        if (motivo == null)
            throw new Exception ("Motivo ausente");

        this.tarefaId         = tarefaId;
        this.motivo           = motivo;
        this.minutosRestantes = minutosRestantes;
    }

    public String getTarefaId ()
    {
        return this.tarefaId;
    }

    public String getMotivo ()
    {
        return this.motivo;
    }

    public int getMinutosRestantes ()
    {
        return this.minutosRestantes;
    }

    public Objeto paraObjeto ()
    {
        Objeto ret = new Objeto ();
        ret.guarde ("tarefaId", this.tarefaId);
        ret.guarde ("motivo", this.motivo);
        ret.guarde ("minutosRestantes", this.minutosRestantes);
        return ret;
    }

    @Override
    public String toString ()
    {
        return "tarefaId........: " + this.tarefaId + "\n" +
               "motivo..........: " + this.motivo + "\n" +
               "minutosRestantes: " + this.minutosRestantes;
    }

    @Override
    public boolean equals (Object obj)
    {
        if (obj == this) return true;
        if (obj == null) return false;

        if (obj.getClass () != this.getClass ()) return false;
        TarefaSemAlocacao outro = (TarefaSemAlocacao) obj;

        if (!this.tarefaId.equals (outro.tarefaId)) return false;
        if (!this.motivo.equals (outro.motivo)) return false;
        if (this.minutosRestantes != outro.minutosRestantes) return false;

        return true;
    }

    @Override
    public int hashCode ()
    {
        int ret = 666;

        ret = ret * 7 + this.tarefaId.hashCode ();
        ret = ret * 7 + this.motivo.hashCode ();
        ret = ret * 7 + ((Integer) this.minutosRestantes).hashCode ();

        if (ret < 0) ret = -ret;
        return ret;
    }

    // construtor de copia
    public TarefaSemAlocacao (TarefaSemAlocacao modelo) throws Exception
    {
        if (modelo == null)
            throw new Exception ("Modelo ausente");

        this.tarefaId         = modelo.tarefaId;
        this.motivo           = modelo.motivo;
        this.minutosRestantes = modelo.minutosRestantes;
    }

    @Override
    public Object clone ()
    {
        TarefaSemAlocacao ret = null;

        try
        {
            ret = new TarefaSemAlocacao (this);
        }
        catch (Exception erro)
        {} // sei que nao vai dar erro

        return ret;
    }
}
