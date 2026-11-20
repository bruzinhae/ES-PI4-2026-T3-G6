// Guilherme Domingues de Sousa - 22013871
package json;

import java.util.*;

// Escreve valores em JSON a mao, sem biblioteca. So tem metodos estaticos.
public class EscritorDeJson
{
    // Texto entre aspas, com escape de aspas, barra e caracteres de controle;
    // null vira a palavra null
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

    // Lista em JSON; cada item escreve o proprio JSON no toString
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

    // Lista de textos em JSON
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
