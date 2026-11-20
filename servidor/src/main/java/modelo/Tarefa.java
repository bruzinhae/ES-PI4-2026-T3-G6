// Guilherme Domingues de Sousa - 22013871
package modelo;

import json.*;
import java.time.*;

// Tarefa pendente candidata a entrar na grade. Os campos opcionais ficam null
// quando o JSON nao os informa.
public class Tarefa
{
    // tarefa pessoal nao depende da janela de foco
    public static final String CATEGORIA_PESSOAL = "pessoal";

    // id da tarefa, definido pelo backend
    private String         id;
    private String         categoria;        // estudos ou pessoal
    private String         tipo;             // prova, trabalho, exercicio, leitura ou outro
    private int            prioridade;       // de 1 a 10
    private OffsetDateTime prazo;            // null se a tarefa nao tem prazo
    private Integer        minutosEstimados; // null se nao informado
    private Integer        dificuldade;      // da disciplina, de 1 a 5 (ou null)
    private Integer        peso;             // da disciplina, de 1 a 5 (ou null)
    private String         situacao;         // pendente, em_andamento ou concluida

    // Le os campos do JSON recebido
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

    // Devolve id
    public String getId ()
    {
        return this.id;
    }

    // Devolve tipo
    public String getTipo ()
    {
        return this.tipo;
    }

    // Devolve prioridade
    public int getPrioridade ()
    {
        return this.prioridade;
    }

    // Devolve prazo
    public OffsetDateTime getPrazo ()
    {
        return this.prazo;
    }

    // Devolve minutos estimados
    public Integer getMinutosEstimados ()
    {
        return this.minutosEstimados;
    }

    // Devolve dificuldade
    public Integer getDificuldade ()
    {
        return this.dificuldade;
    }

    // Devolve peso
    public Integer getPeso ()
    {
        return this.peso;
    }

    // true se a categoria e "pessoal"
    public boolean pessoal ()
    {
        return Tarefa.CATEGORIA_PESSOAL.equals (this.categoria);
    }

    // true se a situacao e "concluida"
    public boolean concluida ()
    {
        return "concluida".equals (this.situacao);
    }
}
