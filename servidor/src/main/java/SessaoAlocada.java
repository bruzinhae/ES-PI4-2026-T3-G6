import java.io.*;

/**
 * Uma sessao de estudo decidida pela alocacao: qual tarefa, onde (espaco livre) e quando.
 *
 * minutosRestantes o que ainda falta da tarefa depois desta sessao (0 = a tarefa ficou completa)
 */
public class SessaoAlocada implements Serializable
{
    private static final long serialVersionUID = 1L;

    private String   espacoId;
    private String   tarefaId;
    private DataHora inicio;
    private DataHora fim;
    private int      minutos;
    private int      minutosRestantes;
    private double   nota;
    private double   urgencia;
    private double   importancia;
    private double   encaixe;

    public SessaoAlocada (String espacoId, String tarefaId, DataHora inicio, DataHora fim, int minutos, int minutosRestantes, double nota, double urgencia, double importancia, double encaixe)
    {
        this.espacoId         = espacoId;
        this.tarefaId         = tarefaId;
        this.inicio           = inicio;
        this.fim              = fim;
        this.minutos          = minutos;
        this.minutosRestantes = minutosRestantes;
        this.nota             = nota;
        this.urgencia         = urgencia;
        this.importancia      = importancia;
        this.encaixe          = encaixe;
    }

    public String getEspacoId ()
    {
        return this.espacoId;
    }

    public String getTarefaId ()
    {
        return this.tarefaId;
    }

    public DataHora getInicio ()
    {
        return this.inicio;
    }

    public DataHora getFim ()
    {
        return this.fim;
    }

    public int getMinutos ()
    {
        return this.minutos;
    }

    public int getMinutosRestantes ()
    {
        return this.minutosRestantes;
    }

    public double getNota ()
    {
        return this.nota;
    }

    public double getUrgencia ()
    {
        return this.urgencia;
    }

    public double getImportancia ()
    {
        return this.importancia;
    }

    public double getEncaixe ()
    {
        return this.encaixe;
    }

    // Mesma sessao com mais minutos no fim (usada para juntar sessoes seguidas da mesma tarefa).
    public SessaoAlocada estendida (int minutosExtras, int novosMinutosRestantes)
    {
        return new SessaoAlocada (this.espacoId, this.tarefaId, this.inicio, this.fim.maisMinutos (minutosExtras),
                                  this.minutos + minutosExtras, novosMinutosRestantes, this.nota,
                                  this.urgencia, this.importancia, this.encaixe);
    }

}
