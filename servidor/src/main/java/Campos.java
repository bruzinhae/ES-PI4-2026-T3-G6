import java.util.ArrayList;

/**
 * Leitura tipada de campos de um objeto JSON já convertido em Objeto (ver Json.ler).
 *
 * Cada método valida o tipo e lança uma Exception com mensagem em português, que o
 * servidor devolve ao cliente dentro de um comunicado de erro.
 */
public class Campos
{
    private Campos () {}

    public static Objeto comoObjeto (Object valor, String nome) throws Exception
    {
        if (!(valor instanceof Objeto))
            throw new Exception ("\"" + nome + "\" deve ser um objeto");

        return (Objeto) valor;
    }

    public static ArrayList<Object> lista (Objeto objeto, String nome, int maximo) throws Exception
    {
        Object valor = objeto.get (nome);

        if (!(valor instanceof ArrayList))
            throw new Exception ("\"" + nome + "\" deve ser uma lista");

        ArrayList<Object> lista = (ArrayList<Object>) valor;

        if (lista.size () > maximo)
            throw new Exception ("\"" + nome + "\" aceita no máximo " + maximo + " itens");

        return lista;
    }

    public static String texto (Objeto objeto, String nome, boolean obrigatorio, String padrao) throws Exception
    {
        Object valor = objeto.get (nome);

        if (valor == null)
        {
            if (obrigatorio)
                throw new Exception ("\"" + nome + "\" é obrigatório");
            return padrao;
        }

        if (!(valor instanceof String))
            throw new Exception ("\"" + nome + "\" deve ser um texto");

        String texto = (String) valor;

        if (obrigatorio && texto.length () == 0)
            throw new Exception ("\"" + nome + "\" não pode ser vazio");

        return texto;
    }

    // Devolve null quando o campo não veio e não é obrigatório.
    public static Integer inteiro (Objeto objeto, String nome, boolean obrigatorio, Integer minimo, Integer maximo) throws Exception
    {
        Object valor = objeto.get (nome);

        if (valor == null)
        {
            if (obrigatorio)
                throw new Exception ("\"" + nome + "\" é obrigatório");
            return null;
        }

        if (!(valor instanceof Double) || ((Double) valor) != Math.rint ((Double) valor))
            throw new Exception ("\"" + nome + "\" deve ser um número inteiro");

        int inteiro = (int) Math.round ((Double) valor);

        if ((minimo != null && inteiro < minimo) || (maximo != null && inteiro > maximo))
            throw new Exception ("\"" + nome + "\" deve estar entre " + minimo + " e " + maximo);

        return inteiro;
    }

    public static boolean logico (Objeto objeto, String nome, boolean padrao) throws Exception
    {
        Object valor = objeto.get (nome);

        if (valor == null)
            return padrao;

        if (!(valor instanceof Boolean))
            throw new Exception ("\"" + nome + "\" deve ser verdadeiro ou falso");

        return (Boolean) valor;
    }

    // Data e hora no formato ISO-8601 com fuso, ex.: 2026-10-27T09:00:00-03:00 ou ...Z.
    public static DataHora dataHora (Objeto objeto, String nome, boolean obrigatorio) throws Exception
    {
        Object valor = objeto.get (nome);

        if (valor == null)
        {
            if (obrigatorio)
                throw new Exception ("\"" + nome + "\" é obrigatório");
            return null;
        }

        if (!(valor instanceof String))
            throw new Exception ("\"" + nome + "\" deve ser uma data e hora em texto");

        try
        {
            return DataHora.ler ((String) valor);
        }
        catch (Exception erro)
        {
            throw new Exception ("\"" + nome + "\" deve estar no formato 2026-10-27T09:00:00-03:00");
        }
    }
}
