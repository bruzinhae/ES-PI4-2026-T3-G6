import java.time.*;

public class SessaoAlocada
{
    private String         espacoId;
    private String         tarefaId;
    private OffsetDateTime inicio;
    private OffsetDateTime fim;
    private int            minutos;
    private int            minutosRestantes; // o que falta da tarefa depois desta sessao
    private double         nota;
    private double         urgencia;
    private double         importancia;
    private double         encaixe;

    public SessaoAlocada (String espacoId, String tarefaId, OffsetDateTime inicio,
                          OffsetDateTime fim, int minutos, int minutosRestantes, double nota,
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

    public OffsetDateTime getFim ()
    {
        return this.fim;
    }

    public SessaoAlocada estendida (int minutosExtras, int novosMinutosRestantes)
    {
        OffsetDateTime novoFim = this.fim.plusMinutes (minutosExtras);

        return new SessaoAlocada (this.espacoId, this.tarefaId, this.inicio, novoFim,
                                  this.minutos + minutosExtras, novosMinutosRestantes,
                                  this.nota, this.urgencia, this.importancia, this.encaixe);
    }

    @Override
    public String toString ()
    {
        return "{\"espacoId\":"        + EscritorDeJson.texto (this.espacoId) +
               ",\"tarefaId\":"        + EscritorDeJson.texto (this.tarefaId) +
               ",\"inicio\":"          + EscritorDeJson.texto (this.inicio.toString ()) +
               ",\"fim\":"             + EscritorDeJson.texto (this.fim.toString ()) +
               ",\"minutos\":"         + this.minutos +
               ",\"minutosRestantes\":" + this.minutosRestantes +
               ",\"nota\":"            + this.nota +
               ",\"urgencia\":"        + this.urgencia +
               ",\"importancia\":"     + this.importancia +
               ",\"encaixe\":"         + this.encaixe + "}";
    }
}
