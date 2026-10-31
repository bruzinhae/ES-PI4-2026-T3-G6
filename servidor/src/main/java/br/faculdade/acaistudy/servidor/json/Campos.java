package br.faculdade.acaistudy.servidor.json;

import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;

/**
 * Leitura tipada de campos de um objeto JSON já convertido em Map (ver Json.ler).
 *
 * Cada método valida o tipo e lança uma Exception com mensagem em português, que o
 * servidor devolve ao cliente dentro de um comunicado de erro.
 */
public final class Campos
{
    private Campos () {}

    @SuppressWarnings ("unchecked")
    public static Map<String, Object> comoObjeto (Object valor, String nome) throws Exception
    {
        if (!(valor instanceof Map))
            throw new Exception ("\"" + nome + "\" deve ser um objeto");

        return (Map<String, Object>) valor;
    }

    @SuppressWarnings ("unchecked")
    public static List<Object> lista (Map<String, Object> objeto, String nome, int maximo) throws Exception
    {
        Object valor = objeto.get (nome);

        if (!(valor instanceof List))
            throw new Exception ("\"" + nome + "\" deve ser uma lista");

        List<Object> lista = (List<Object>) valor;

        if (lista.size () > maximo)
            throw new Exception ("\"" + nome + "\" aceita no máximo " + maximo + " itens");

        return lista;
    }

    public static String texto (Map<String, Object> objeto, String nome, boolean obrigatorio, String padrao) throws Exception
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

        if (obrigatorio && texto.isEmpty ())
            throw new Exception ("\"" + nome + "\" não pode ser vazio");

        return texto;
    }

    // Devolve null quando o campo não veio e não é obrigatório.
    public static Integer inteiro (Map<String, Object> objeto, String nome, boolean obrigatorio, Integer minimo, Integer maximo) throws Exception
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

    public static boolean logico (Map<String, Object> objeto, String nome, boolean padrao) throws Exception
    {
        Object valor = objeto.get (nome);

        if (valor == null)
            return padrao;

        if (!(valor instanceof Boolean))
            throw new Exception ("\"" + nome + "\" deve ser verdadeiro ou falso");

        return (Boolean) valor;
    }

    // Data e hora no formato ISO-8601 com fuso, ex.: 2026-10-27T09:00:00-03:00 ou ...Z.
    public static OffsetDateTime dataHora (Map<String, Object> objeto, String nome, boolean obrigatorio) throws Exception
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
            return OffsetDateTime.parse ((String) valor);
        }
        catch (DateTimeParseException erro)
        {
            throw new Exception ("\"" + nome + "\" deve estar no formato 2026-10-27T09:00:00-03:00");
        }
    }
}
