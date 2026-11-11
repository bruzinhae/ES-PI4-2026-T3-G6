/**
 * Meta ativa do estudante, candidata a receber a atencao da Sofia.
 *
 * tipo       geral, disciplina, habito ou projeto
 * prioridade baixa, media ou alta
 * progresso  0 a 100, ja calculado pelo backend (marcos atingidos ou horas da semana)
 * prazo      entrega; null quando a meta nao tem prazo
 */
public class Meta implements Cloneable
{
    private String   id;
    private String   titulo;
    private String   tipo;
    private String   prioridade;
    private int      progresso;
    private DataHora prazo;

    public Meta (String id, String titulo, String tipo, String prioridade, int progresso, DataHora prazo) throws Exception
    {
        if (id == null)
            throw new Exception ("Id ausente");
        if (titulo == null)
            throw new Exception ("Titulo ausente");
        if (tipo == null)
            throw new Exception ("Tipo ausente");
        if (prioridade == null)
            throw new Exception ("Prioridade ausente");

        this.id         = id;
        this.titulo     = titulo;
        this.tipo       = tipo;
        this.prioridade = prioridade;
        this.progresso  = progresso;
        this.prazo      = prazo;
    }

    public String getId ()
    {
        return this.id;
    }

    public String getTitulo ()
    {
        return this.titulo;
    }

    public String getTipo ()
    {
        return this.tipo;
    }

    public String getPrioridade ()
    {
        return this.prioridade;
    }

    public int getProgresso ()
    {
        return this.progresso;
    }

    public DataHora getPrazo ()
    {
        return this.prazo;
    }

    public boolean habito ()
    {
        return "habito".equals (this.tipo);
    }

    @Override
    public String toString ()
    {
        return "id........: " + this.id + "\n" +
               "titulo....: " + this.titulo + "\n" +
               "tipo......: " + this.tipo + "\n" +
               "prioridade: " + this.prioridade + "\n" +
               "progresso.: " + this.progresso + "\n" +
               "prazo.....: " + this.prazo;
    }

    @Override
    public boolean equals (Object obj)
    {
        if (obj == this) return true;
        if (obj == null) return false;

        if (obj.getClass () != this.getClass ()) return false;
        Meta outro = (Meta) obj;

        if (!this.id.equals (outro.id)) return false;
        if (!this.titulo.equals (outro.titulo)) return false;
        if (!this.tipo.equals (outro.tipo)) return false;
        if (!this.prioridade.equals (outro.prioridade)) return false;
        if (this.progresso != outro.progresso) return false;
        if (this.prazo == null ? outro.prazo != null : !this.prazo.equals (outro.prazo)) return false;

        return true;
    }

    @Override
    public int hashCode ()
    {
        int ret = 666;

        ret = ret * 7 + this.id.hashCode ();
        ret = ret * 7 + this.titulo.hashCode ();
        ret = ret * 7 + this.tipo.hashCode ();
        ret = ret * 7 + this.prioridade.hashCode ();
        ret = ret * 7 + ((Integer) this.progresso).hashCode ();
        ret = ret * 7 + (this.prazo == null ? 0 : this.prazo.hashCode ());

        if (ret < 0) ret = -ret;
        return ret;
    }

    // construtor de copia
    public Meta (Meta modelo) throws Exception
    {
        if (modelo == null)
            throw new Exception ("Modelo ausente");

        this.id         = modelo.id;
        this.titulo     = modelo.titulo;
        this.tipo       = modelo.tipo;
        this.prioridade = modelo.prioridade;
        this.progresso  = modelo.progresso;
        this.prazo      = modelo.prazo;
    }

    @Override
    public Object clone ()
    {
        Meta ret = null;

        try
        {
            ret = new Meta (this);
        }
        catch (Exception erro)
        {} // sei que nao vai dar erro

        return ret;
    }
}
