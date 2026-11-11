import java.io.*;

// Tarefa que ficou (total ou parcialmente) sem espaco na alocacao.
// motivo: "sem_espacos", "nenhum_espaco_antes_do_prazo", "espacos_insuficientes" ou "alocacao_parcial".
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

}
