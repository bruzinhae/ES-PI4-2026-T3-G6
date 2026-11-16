import java.util.*;

public class EscritorDeJson
{
    public static String texto (String valor)
    {
        if (valor==null)
            return "null";

        StringBuilder ret = new StringBuilder ("\"");

        for (int i=0; i<valor.length (); i++)
        {
            char c = valor.charAt (i);

            if      (c=='"')  ret.append ("\\\"");
            else if (c=='\\') ret.append ("\\\\");
            else if (c=='\n') ret.append ("\\n");
            else if (c=='\r') ret.append ("\\r");
            else if (c=='\t') ret.append ("\\t");
            else if (c<32)    ret.append (String.format ("\\u%04x", (int)c));
            else              ret.append (c);
        }

        return ret.append ("\"").toString ();
    }

    public static String lista (ArrayList<?> itens) // cada item escreve o seu proprio JSON no toString
    {
        StringBuilder ret = new StringBuilder ("[");

        for (int i=0; i<itens.size (); i++)
        {
            if (i>0)
                ret.append (",");

            ret.append (itens.get (i));
        }

        return ret.append ("]").toString ();
    }

    public static String listaDeTextos (ArrayList<String> itens)
    {
        StringBuilder ret = new StringBuilder ("[");

        for (int i=0; i<itens.size (); i++)
        {
            if (i>0)
                ret.append (",");

            ret.append (EscritorDeJson.texto (itens.get (i)));
        }

        return ret.append ("]").toString ();
    }
}
