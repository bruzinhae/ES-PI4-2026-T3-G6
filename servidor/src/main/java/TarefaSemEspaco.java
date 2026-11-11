import java.io.*;

/**
 * Tarefa que nao coube em nenhum dos espacos enviados.
 * motivo: "sem_espacos" ou "nenhum_espaco_antes_do_prazo".
 */
public class TarefaSemEspaco implements Serializable
{
    private static final long serialVersionUID = 1L;

    private String tarefaId;
    private String motivo;

    public TarefaSemEspaco (String tarefaId, String motivo)
    {
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

}
