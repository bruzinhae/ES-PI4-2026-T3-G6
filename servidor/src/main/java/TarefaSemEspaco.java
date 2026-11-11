import java.io.*;

/**
 * Tarefa que nao coube em nenhum dos espacos enviados.
 * motivo: "sem_espacos" ou "nenhum_espaco_antes_do_prazo".
 */
public class TarefaSemEspaco implements Cloneable, Serializable
{
    private static final long serialVersionUID = 1L;

    private String tarefaId;
    private String motivo;

    public TarefaSemEspaco (String tarefaId, String motivo) throws Exception
    {
        if (tarefaId == null)
            throw new Exception ("TarefaId ausente");
        if (motivo == null)
            throw new Exception ("Motivo ausente");

        this.tarefaId = tarefaId;
        this.motivo   = motivo;
    }

    public String getTarefaId ()
    {
        return this.tarefaId;
    }

    public String getMotivo ()
    {
        return this.motivo;
    }


    @Override
    public String toString ()
    {
        return "tarefaId: " + this.tarefaId + "\n" +
               "motivo..: " + this.motivo;
    }

    @Override
    public boolean equals (Object obj)
    {
        if (obj == this) return true;
        if (obj == null) return false;

        if (obj.getClass () != this.getClass ()) return false;
        TarefaSemEspaco outro = (TarefaSemEspaco) obj;

        if (!this.tarefaId.equals (outro.tarefaId)) return false;
        if (!this.motivo.equals (outro.motivo)) return false;

        return true;
    }

    @Override
    public int hashCode ()
    {
        int ret = 666;

        ret = ret * 7 + this.tarefaId.hashCode ();
        ret = ret * 7 + this.motivo.hashCode ();

        if (ret < 0) ret = -ret;
        return ret;
    }

    // construtor de copia
    public TarefaSemEspaco (TarefaSemEspaco modelo) throws Exception
    {
        if (modelo == null)
            throw new Exception ("Modelo ausente");

        this.tarefaId = modelo.tarefaId;
        this.motivo   = modelo.motivo;
    }

    @Override
    public Object clone ()
    {
        TarefaSemEspaco ret = null;

        try
        {
            ret = new TarefaSemEspaco (this);
        }
        catch (Exception erro)
        {} // sei que nao vai dar erro

        return ret;
    }
}
