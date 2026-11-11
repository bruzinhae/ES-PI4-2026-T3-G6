import java.io.*;

/**
 * Tarefa pendente candidata a ser encaixada na grade.
 *
 * prioridade       1 a 10, definida pelo usuario
 * categoria        "estudos" ou "pessoal"; tarefa pessoal nao depende da janela de foco
 * prazo            entrega; null quando a tarefa nao tem prazo
 * minutosEstimados esforco estimado; null quando nao informado
 * dificuldade      da disciplina (1 a 5), ou null
 * peso             da disciplina (1 a 5), ou null
 */
public class Tarefa implements Cloneable, Serializable
{
    private static final long serialVersionUID = 1L;

    private String   id;
    private String   titulo;
    private String   categoria;
    private String   tipo;
    private int      prioridade;
    private DataHora prazo;
    private Integer  minutosEstimados;
    private Integer  dificuldade;
    private Integer  peso;
    private String   situacao;

    public Tarefa (String id, String titulo, String categoria, String tipo, int prioridade, DataHora prazo, Integer minutosEstimados, Integer dificuldade, Integer peso, String situacao) throws Exception
    {
        if (id == null)
            throw new Exception ("Id ausente");
        if (titulo == null)
            throw new Exception ("Titulo ausente");
        if (categoria == null)
            throw new Exception ("Categoria ausente");
        if (tipo == null)
            throw new Exception ("Tipo ausente");
        if (situacao == null)
            throw new Exception ("Situacao ausente");

        this.id               = id;
        this.titulo           = titulo;
        this.categoria        = categoria;
        this.tipo             = tipo;
        this.prioridade       = prioridade;
        this.prazo            = prazo;
        this.minutosEstimados = minutosEstimados;
        this.dificuldade      = dificuldade;
        this.peso             = peso;
        this.situacao         = situacao;
    }

    public String getId ()
    {
        return this.id;
    }

    public String getTitulo ()
    {
        return this.titulo;
    }

    public String getCategoria ()
    {
        return this.categoria;
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

    public String getSituacao ()
    {
        return this.situacao;
    }

    public static final String CATEGORIA_ESTUDOS = "estudos";
    public static final String CATEGORIA_PESSOAL = "pessoal";

    public boolean pessoal ()
    {
        return Tarefa.CATEGORIA_PESSOAL.equals (this.categoria);
    }

    public boolean concluida ()
    {
        return "concluida".equals (this.situacao);
    }

    @Override
    public String toString ()
    {
        return "id..............: " + this.id + "\n" +
               "titulo..........: " + this.titulo + "\n" +
               "categoria.......: " + this.categoria + "\n" +
               "tipo............: " + this.tipo + "\n" +
               "prioridade......: " + this.prioridade + "\n" +
               "prazo...........: " + this.prazo + "\n" +
               "minutosEstimados: " + this.minutosEstimados + "\n" +
               "dificuldade.....: " + this.dificuldade + "\n" +
               "peso............: " + this.peso + "\n" +
               "situacao........: " + this.situacao;
    }

    @Override
    public boolean equals (Object obj)
    {
        if (obj == this) return true;
        if (obj == null) return false;

        if (obj.getClass () != this.getClass ()) return false;
        Tarefa outro = (Tarefa) obj;

        if (!this.id.equals (outro.id)) return false;
        if (!this.titulo.equals (outro.titulo)) return false;
        if (!this.categoria.equals (outro.categoria)) return false;
        if (!this.tipo.equals (outro.tipo)) return false;
        if (this.prioridade != outro.prioridade) return false;
        if (this.prazo == null ? outro.prazo != null : !this.prazo.equals (outro.prazo)) return false;
        if (this.minutosEstimados == null ? outro.minutosEstimados != null : !this.minutosEstimados.equals (outro.minutosEstimados)) return false;
        if (this.dificuldade == null ? outro.dificuldade != null : !this.dificuldade.equals (outro.dificuldade)) return false;
        if (this.peso == null ? outro.peso != null : !this.peso.equals (outro.peso)) return false;
        if (!this.situacao.equals (outro.situacao)) return false;

        return true;
    }

    @Override
    public int hashCode ()
    {
        int ret = 666;

        ret = ret * 7 + this.id.hashCode ();
        ret = ret * 7 + this.titulo.hashCode ();
        ret = ret * 7 + this.categoria.hashCode ();
        ret = ret * 7 + this.tipo.hashCode ();
        ret = ret * 7 + ((Integer) this.prioridade).hashCode ();
        ret = ret * 7 + (this.prazo == null ? 0 : this.prazo.hashCode ());
        ret = ret * 7 + (this.minutosEstimados == null ? 0 : this.minutosEstimados.hashCode ());
        ret = ret * 7 + (this.dificuldade == null ? 0 : this.dificuldade.hashCode ());
        ret = ret * 7 + (this.peso == null ? 0 : this.peso.hashCode ());
        ret = ret * 7 + this.situacao.hashCode ();

        if (ret < 0) ret = -ret;
        return ret;
    }

    // construtor de copia
    public Tarefa (Tarefa modelo) throws Exception
    {
        if (modelo == null)
            throw new Exception ("Modelo ausente");

        this.id               = modelo.id;
        this.titulo           = modelo.titulo;
        this.categoria        = modelo.categoria;
        this.tipo             = modelo.tipo;
        this.prioridade       = modelo.prioridade;
        this.prazo            = modelo.prazo;
        this.minutosEstimados = modelo.minutosEstimados;
        this.dificuldade      = modelo.dificuldade;
        this.peso             = modelo.peso;
        this.situacao         = modelo.situacao;
    }

    @Override
    public Object clone ()
    {
        Tarefa ret = null;

        try
        {
            ret = new Tarefa (this);
        }
        catch (Exception erro)
        {} // sei que nao vai dar erro

        return ret;
    }
}
