import java.io.*;

public class SessaoAlocada implements Serializable
{
    private static final long serialVersionUID = 1L;

    private String   espacoId;
    private String   tarefaId;
    private DataHora inicio;
    private DataHora fim;
    private int      minutos;
    private int      minutosRestantes; // o que falta da tarefa depois desta sessao
    private double   nota;
    private double   urgencia;
    private double   importancia;
    private double   encaixe;

    public SessaoAlocada (String espacoId, String tarefaId, DataHora inicio, DataHora fim,
                          int minutos, int minutosRestantes, double nota,
                          double urgencia, double importancia, double encaixe)
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

    public String getTarefaId ()
    {
        return this.tarefaId;
    }

    public DataHora getFim ()
    {
        return this.fim;
    }

    public SessaoAlocada estendida (int minutosExtras, int novosMinutosRestantes)
    {
        DataHora novoFim = this.fim.maisMinutos (minutosExtras);

        return new SessaoAlocada (this.espacoId, this.tarefaId, this.inicio, novoFim,
                                  this.minutos + minutosExtras, novosMinutosRestantes,
                                  this.nota, this.urgencia, this.importancia, this.encaixe);
    }
}
