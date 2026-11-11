import java.io.*;

/**
 * Um intervalo livre da grade, calculado pelo backend Node (grade da semana menos blocos
 * fixos e sessoes ja marcadas). O servidor so recebe e ranqueia candidatos para ele.
 */
public class EspacoLivre implements Comparable<EspacoLivre>, Cloneable, Serializable
{
    private static final long serialVersionUID = 1L;

    private String   id;
    private DataHora inicio;
    private DataHora fim;

    public EspacoLivre (String id, DataHora inicio, DataHora fim) throws Exception
    {
        if (id == null)
            throw new Exception ("Id ausente");
        if (inicio == null)
            throw new Exception ("Inicio ausente");
        if (fim == null)
            throw new Exception ("Fim ausente");

        this.id     = id;
        this.inicio = inicio;
        this.fim    = fim;
    }

    public String getId ()
    {
        return this.id;
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
        return (int) this.inicio.minutosAte (this.fim);
    }

    @Override
    public String toString ()
    {
        return "id....: " + this.id + "\n" +
               "inicio: " + this.inicio + "\n" +
               "fim...: " + this.fim;
    }

    @Override
    public boolean equals (Object obj)
    {
        if (obj == this) return true;
        if (obj == null) return false;

        if (obj.getClass () != this.getClass ()) return false;
        EspacoLivre outro = (EspacoLivre) obj;

        if (!this.id.equals (outro.id)) return false;
        if (!this.inicio.equals (outro.inicio)) return false;
        if (!this.fim.equals (outro.fim)) return false;

        return true;
    }

    @Override
    public int hashCode ()
    {
        int ret = 666;

        ret = ret * 7 + this.id.hashCode ();
        ret = ret * 7 + this.inicio.hashCode ();
        ret = ret * 7 + this.fim.hashCode ();

        if (ret < 0) ret = -ret;
        return ret;
    }

    @Override
    public int compareTo (EspacoLivre outro)
    {
        // o que comeca primeiro vem antes; empate pelo id
        int ret = this.inicio.compareTo (outro.inicio);
        if (ret != 0) return ret;

        return this.id.compareTo (outro.id);
    }

    // construtor de copia
    public EspacoLivre (EspacoLivre modelo) throws Exception
    {
        if (modelo == null)
            throw new Exception ("Modelo ausente");

        this.id     = modelo.id;
        this.inicio = modelo.inicio;
        this.fim    = modelo.fim;
    }

    @Override
    public Object clone ()
    {
        EspacoLivre ret = null;

        try
        {
            ret = new EspacoLivre (this);
        }
        catch (Exception erro)
        {} // sei que nao vai dar erro

        return ret;
    }
}
