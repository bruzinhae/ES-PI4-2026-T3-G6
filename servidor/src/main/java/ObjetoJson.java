import java.time.*;
import java.util.*;

public class ObjetoJson
{
    private ArrayList<String> nomes   = new ArrayList<String> ();
    private ArrayList<Object> valores = new ArrayList<Object> ();

    public void ponha (String nome, Object valor)
    {
        this.nomes.add   (nome);
        this.valores.add (valor);
    }

    public Object get (String nome) // null se o campo nao existe ou vale null
    {
        int posicao = this.nomes.indexOf (nome);

        if (posicao==-1)
            return null;

        return this.valores.get (posicao);
    }

    private Object exija (String nome) throws Exception
    {
        Object ret = this.get (nome);

        if (ret==null)
            throw new Exception ("Falta o campo " + nome);

        return ret;
    }

    public String getTexto (String nome) throws Exception
    {
        return (String)this.exija (nome);
    }

    public int getInteiro (String nome) throws Exception
    {
        return ((Double)this.exija (nome)).intValue ();
    }

    public Integer getInteiroOuNulo (String nome)
    {
        Object valor = this.get (nome);

        if (valor==null)
            return null;

        return ((Double)valor).intValue ();
    }

    public boolean getLogico (String nome) throws Exception
    {
        return (Boolean)this.exija (nome);
    }

    public ObjetoJson getObjeto (String nome) throws Exception
    {
        return (ObjetoJson)this.exija (nome);
    }

    public ArrayList<ObjetoJson> getObjetos (String nome) throws Exception
    {
        ArrayList<?> lista = (ArrayList<?>)this.exija (nome);
        ArrayList<ObjetoJson> ret = new ArrayList<ObjetoJson> ();

        for (Object item : lista)
            ret.add ((ObjetoJson)item);

        return ret;
    }

    public OffsetDateTime getDataHora (String nome) throws Exception
    {
        return OffsetDateTime.parse (this.getTexto (nome));
    }

    public OffsetDateTime getDataHoraOuNula (String nome) throws Exception
    {
        if (this.get (nome)==null)
            return null;

        return this.getDataHora (nome);
    }
}
