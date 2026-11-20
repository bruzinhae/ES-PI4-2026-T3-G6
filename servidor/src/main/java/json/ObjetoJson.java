// Guilherme Domingues de Sousa - 22013871
package json;

import java.time.*;
import java.util.*;

// Objeto JSON ja lido: pares nome/valor em duas listas paralelas. Os getters
// convertem o valor para o tipo pedido e falham se o campo nao existe.
public class ObjetoJson
{
    // nomes[i] e valores[i] formam o i-esimo par do objeto
    private ArrayList<String> nomes   = new ArrayList<String> ();
    private ArrayList<Object> valores = new ArrayList<Object> ();

    // Acrescenta um par nome/valor
    public void ponha (String nome, Object valor)
    {
        this.nomes.add   (nome);
        this.valores.add (valor);
    }

    // Valor do campo; null se nao existe ou vale null
    public Object get (String nome) // null se o campo nao existe ou vale null
    {
        int posicao = this.nomes.indexOf (nome);

        if (posicao==-1)
            return null;

        return this.valores.get (posicao);
    }

    // Como get, mas lanca Exception se o campo falta
    private Object exija (String nome) throws Exception
    {
        Object ret = this.get (nome);

        if (ret==null)
            throw new Exception ("Falta o campo " + nome);

        return ret;
    }

    // Campo obrigatorio como texto
    public String getTexto (String nome) throws Exception
    {
        return (String)this.exija (nome);
    }

    // Campo obrigatorio como inteiro (o leitor guarda numeros como Double)
    public int getInteiro (String nome) throws Exception
    {
        return ((Double)this.exija (nome)).intValue ();
    }

    // Campo opcional como inteiro; null se falta
    public Integer getInteiroOuNulo (String nome)
    {
        Object valor = this.get (nome);

        if (valor==null)
            return null;

        return ((Double)valor).intValue ();
    }

    // Campo obrigatorio como verdadeiro/falso
    public boolean getLogico (String nome) throws Exception
    {
        return (Boolean)this.exija (nome);
    }

    // Campo obrigatorio como objeto
    public ObjetoJson getObjeto (String nome) throws Exception
    {
        return (ObjetoJson)this.exija (nome);
    }

    // Campo obrigatorio como lista de objetos
    public ArrayList<ObjetoJson> getObjetos (String nome) throws Exception
    {
        ArrayList<?> lista = (ArrayList<?>)this.exija (nome);
        ArrayList<ObjetoJson> ret = new ArrayList<ObjetoJson> ();

        for (Object item : lista)
            ret.add ((ObjetoJson)item);

        return ret;
    }

    // Campo obrigatorio como data e hora ISO-8601 com fuso
    public OffsetDateTime getDataHora (String nome) throws Exception
    {
        return OffsetDateTime.parse (this.getTexto (nome));
    }

    // Campo opcional como data e hora; null se falta
    public OffsetDateTime getDataHoraOuNula (String nome) throws Exception
    {
        if (this.get (nome)==null)
            return null;

        return this.getDataHora (nome);
    }
}
