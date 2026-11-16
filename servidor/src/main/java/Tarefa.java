import java.time.*;

public class Tarefa
{
    public static final String CATEGORIA_PESSOAL = "pessoal";

    private String         id;
    private String         categoria;        // estudos ou pessoal
    private String         tipo;             // prova, trabalho, exercicio, leitura ou outro
    private int            prioridade;       // de 1 a 10
    private OffsetDateTime prazo;            // null se a tarefa nao tem prazo
    private Integer        minutosEstimados; // null se nao informado
    private Integer        dificuldade;      // da disciplina, de 1 a 5 (ou null)
    private Integer        peso;             // da disciplina, de 1 a 5 (ou null)
    private String         situacao;         // pendente, em_andamento ou concluida

    public Tarefa (ObjetoJson json) throws Exception
    {
        this.id               = json.getTexto           ("id");
        this.categoria        = json.getTexto           ("categoria");
        this.tipo             = json.getTexto           ("tipo");
        this.prioridade       = json.getInteiro         ("prioridade");
        this.prazo            = json.getDataHoraOuNula  ("prazo");
        this.minutosEstimados = json.getInteiroOuNulo   ("minutosEstimados");
        this.dificuldade      = json.getInteiroOuNulo   ("dificuldade");
        this.peso             = json.getInteiroOuNulo   ("peso");
        this.situacao         = json.getTexto           ("situacao");
    }

    public String getId ()
    {
        return this.id;
    }

    public String getTipo ()
    {
        return this.tipo;
    }

    public int getPrioridade ()
    {
        return this.prioridade;
    }

    public OffsetDateTime getPrazo ()
    {
        return this.prazo;
    }

    public Integer getMinutosEstimados ()
    {
        return this.minutosEstimados;
    }

    public Integer getDificuldade ()
    {
        return this.dificuldade;
    }

    public Integer getPeso ()
    {
        return this.peso;
    }

    public boolean pessoal ()
    {
        return Tarefa.CATEGORIA_PESSOAL.equals (this.categoria);
    }

    public boolean concluida ()
    {
        return "concluida".equals (this.situacao);
    }
}
