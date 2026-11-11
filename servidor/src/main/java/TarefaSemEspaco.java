import java.io.*;

public class TarefaSemEspaco implements Serializable
{
    private static final long serialVersionUID = 1L;

    private String tarefaId;
    private String motivo; // sem_espacos ou nenhum_espaco_antes_do_prazo

    public TarefaSemEspaco (String tarefaId, String motivo)
    {
        this.tarefaId = tarefaId;
        this.motivo   = motivo;
    }
}
