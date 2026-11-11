import java.io.*;

public class TarefaSemAlocacao implements Serializable
{
    private static final long serialVersionUID = 1L;

    private String tarefaId;
    private String motivo;
    private int    minutosRestantes;

    public TarefaSemAlocacao (String tarefaId, String motivo, int minutosRestantes)
    {
        this.tarefaId         = tarefaId;
        this.motivo           = motivo;
        this.minutosRestantes = minutosRestantes;
    }
}
