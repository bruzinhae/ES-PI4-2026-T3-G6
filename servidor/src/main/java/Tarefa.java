import java.io.*;

// Tarefa pendente candidata a ser encaixada na grade.
//
// categoria        "estudos" ou "pessoal" (tarefa pessoal nao depende da janela de foco)
// prioridade       1 a 10, definida pelo usuario
// prazo            entrega; null quando a tarefa nao tem prazo
// minutosEstimados esforco estimado; null quando nao informado
// dificuldade      da disciplina (1 a 5), ou null
// peso             da disciplina (1 a 5), ou null
public class Tarefa implements Serializable
{
    private static final long serialVersionUID = 1L;

    public static final String CATEGORIA_ESTUDOS = "estudos";
    public static final String CATEGORIA_PESSOAL = "pessoal";

    private String   id;
    private String   categoria;
    private String   tipo;
    private int      prioridade;
    private DataHora prazo;
    private Integer  minutosEstimados;
    private Integer  dificuldade;
    private Integer  peso;
    private String   situacao;

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

    public DataHora getPrazo ()
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
