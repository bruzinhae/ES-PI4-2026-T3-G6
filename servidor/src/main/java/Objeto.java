import java.util.ArrayList;

/**
 * Um objeto JSON: pares nome/valor na ordem em que foram guardados.
 *
 * Os valores são String, Double (ou qualquer Number), Boolean, null, outro Objeto ou um
 * ArrayList de valores (o JSON lido por Json.ler e o JSON escrito por Json.escrever usam só isso).
 */
public class Objeto implements Cloneable
{
    private ArrayList<String> nomes   = new ArrayList<String> ();
    private ArrayList<Object> valores = new ArrayList<Object> ();

    public Objeto ()
    {}

    // Guarda o valor com o nome; se o nome ja existe, troca o valor e mantem a posicao.
    public void guarde (String nome, Object valor)
    {
        int posicao = this.nomes.indexOf (nome);

        if (posicao == -1)
        {
            this.nomes.add (nome);
            this.valores.add (valor);
        }
        else
            this.valores.set (posicao, valor);
    }

    public boolean tem (String nome)
    {
        return this.nomes.indexOf (nome) != -1;
    }

    // O valor guardado com o nome, ou null se nao ha nenhum.
    public Object get (String nome)
    {
        int posicao = this.nomes.indexOf (nome);

        if (posicao == -1)
            return null;

        return this.valores.get (posicao);
    }

    public int getQuantidade ()
    {
        return this.nomes.size ();
    }

    public String getNome (int posicao)
    {
        return this.nomes.get (posicao);
    }

    public Object getValor (int posicao)
    {
        return this.valores.get (posicao);
    }

    @Override
    public String toString ()
    {
        return Json.escrever (this);
    }

    @Override
    public boolean equals (Object obj)
    {
        if (obj == this) return true;
        if (obj == null) return false;

        if (obj.getClass () != this.getClass ()) return false;
        Objeto outro = (Objeto) obj;

        if (!this.nomes.equals (outro.nomes)) return false;
        if (!this.valores.equals (outro.valores)) return false;

        return true;
    }

    @Override
    public int hashCode ()
    {
        int ret = 666;

        ret = ret * 7 + this.nomes.hashCode ();
        ret = ret * 7 + this.valores.hashCode ();

        if (ret < 0) ret = -ret;
        return ret;
    }

    // construtor de copia
    public Objeto (Objeto modelo) throws Exception
    {
        if (modelo == null)
            throw new Exception ("Modelo ausente");

        this.nomes   = new ArrayList<String> (modelo.nomes);
        this.valores = new ArrayList<Object> (modelo.valores);
    }

    @Override
    public Object clone ()
    {
        Objeto ret = null;

        try
        {
            ret = new Objeto (this);
        }
        catch (Exception erro)
        {} // sei que nao vai dar erro

        return ret;
    }
}
