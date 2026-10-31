package br.faculdade.acaistudy.servidor.json;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Leitor e escritor de JSON mínimos, sem bibliotecas externas.
 *
 * Mantém o servidor com dependência zero, como o exemplo do professor (Fazedor de
 * Continhas). Na leitura, o JSON vira: Map (objeto), List (lista), String, Double (número),
 * Boolean ou null. Na escrita, aceita esses mesmos tipos mais qualquer Number.
 */
public final class Json
{
    // Evita estouro de pilha com JSON malicioso do tipo [[[[[[...
    private static final int PROFUNDIDADE_MAXIMA = 64;

    private final String texto;
    private int posicao = 0;

    private Json (String texto)
    {
        this.texto = texto;
    }

    public static Object ler (String texto) throws Exception
    {
        if (texto == null)
            throw new Exception ("JSON ausente");

        Json leitor = new Json (texto);
        leitor.pularEspacos ();
        Object valor = leitor.lerValor (0);
        leitor.pularEspacos ();

        if (leitor.posicao != texto.length ())
            throw leitor.erro ("Há texto sobrando depois do JSON");

        return valor;
    }

    // ------------------------------------------------------------------ leitura

    private Exception erro (String mensagem)
    {
        return new Exception ("JSON inválido na posição " + this.posicao + ": " + mensagem);
    }

    private void pularEspacos ()
    {
        while (this.posicao < this.texto.length () && Character.isWhitespace (this.texto.charAt (this.posicao)))
            this.posicao++;
    }

    private char espie () throws Exception
    {
        if (this.posicao >= this.texto.length ())
            throw erro ("o texto terminou antes da hora");

        return this.texto.charAt (this.posicao);
    }

    private void espere (char esperado) throws Exception
    {
        if (espie () != esperado)
            throw erro ("esperava '" + esperado + "'");

        this.posicao++;
    }

    private Object lerValor (int profundidade) throws Exception
    {
        if (profundidade > PROFUNDIDADE_MAXIMA)
            throw erro ("estrutura aninhada demais");

        char c = espie ();

        if (c == '{')
            return lerObjeto (profundidade);
        if (c == '[')
            return lerLista (profundidade);
        if (c == '"')
            return lerTexto ();
        if (this.texto.startsWith ("true", this.posicao))
        {
            this.posicao += 4;
            return Boolean.TRUE;
        }
        if (this.texto.startsWith ("false", this.posicao))
        {
            this.posicao += 5;
            return Boolean.FALSE;
        }
        if (this.texto.startsWith ("null", this.posicao))
        {
            this.posicao += 4;
            return null;
        }

        return lerNumero ();
    }

    private Map<String, Object> lerObjeto (int profundidade) throws Exception
    {
        Map<String, Object> objeto = new LinkedHashMap<String, Object> ();

        espere ('{');
        pularEspacos ();

        if (espie () == '}')
        {
            this.posicao++;
            return objeto;
        }

        for (;;)
        {
            pularEspacos ();
            String chave = lerTexto ();
            pularEspacos ();
            espere (':');
            pularEspacos ();
            objeto.put (chave, lerValor (profundidade + 1));
            pularEspacos ();

            char c = espie ();
            this.posicao++;

            if (c == '}')
                return objeto;
            if (c != ',')
                throw erro ("esperava ',' ou '}'");
        }
    }

    private List<Object> lerLista (int profundidade) throws Exception
    {
        List<Object> lista = new ArrayList<Object> ();

        espere ('[');
        pularEspacos ();

        if (espie () == ']')
        {
            this.posicao++;
            return lista;
        }

        for (;;)
        {
            pularEspacos ();
            lista.add (lerValor (profundidade + 1));
            pularEspacos ();

            char c = espie ();
            this.posicao++;

            if (c == ']')
                return lista;
            if (c != ',')
                throw erro ("esperava ',' ou ']'");
        }
    }

    private String lerTexto () throws Exception
    {
        StringBuilder sb = new StringBuilder ();

        espere ('"');

        for (;;)
        {
            char c = espie ();
            this.posicao++;

            if (c == '"')
                return sb.toString ();

            if (c == '\\')
            {
                char e = espie ();
                this.posicao++;

                switch (e)
                {
                    case '"':  sb.append ('"');  break;
                    case '\\': sb.append ('\\'); break;
                    case '/':  sb.append ('/');  break;
                    case 'b':  sb.append ('\b'); break;
                    case 'f':  sb.append ('\f'); break;
                    case 'n':  sb.append ('\n'); break;
                    case 'r':  sb.append ('\r'); break;
                    case 't':  sb.append ('\t'); break;
                    case 'u':
                        if (this.posicao + 4 > this.texto.length ())
                            throw erro ("sequência \\u incompleta");
                        try
                        {
                            sb.append ((char) Integer.parseInt (this.texto.substring (this.posicao, this.posicao + 4), 16));
                        }
                        catch (NumberFormatException erro)
                        {
                            throw erro ("sequência \\u inválida");
                        }
                        this.posicao += 4;
                        break;
                    default:
                        throw erro ("escape inválido");
                }
            }
            else if (c < 0x20)
                throw erro ("caractere de controle dentro do texto");
            else
                sb.append (c);
        }
    }

    private Double lerNumero () throws Exception
    {
        int inicio = this.posicao;

        while (this.posicao < this.texto.length () && "+-0123456789.eE".indexOf (this.texto.charAt (this.posicao)) >= 0)
            this.posicao++;

        if (inicio == this.posicao)
            throw erro ("valor inesperado");

        try
        {
            return Double.valueOf (this.texto.substring (inicio, this.posicao));
        }
        catch (NumberFormatException erro)
        {
            this.posicao = inicio;
            throw erro ("número inválido");
        }
    }

    // ------------------------------------------------------------------ escrita

    public static String escrever (Object valor)
    {
        StringBuilder sb = new StringBuilder ();
        escrever (valor, sb);
        return sb.toString ();
    }

    private static void escrever (Object valor, StringBuilder sb)
    {
        if (valor == null)
            sb.append ("null");
        else if (valor instanceof Boolean)
            sb.append (valor);
        else if (valor instanceof Number)
            escreverNumero ((Number) valor, sb);
        else if (valor instanceof Map)
        {
            boolean primeiro = true;
            sb.append ('{');
            for (Map.Entry<?, ?> entrada : ((Map<?, ?>) valor).entrySet ())
            {
                if (!primeiro)
                    sb.append (',');
                primeiro = false;
                escreverTexto (String.valueOf (entrada.getKey ()), sb);
                sb.append (':');
                escrever (entrada.getValue (), sb);
            }
            sb.append ('}');
        }
        else if (valor instanceof Collection)
        {
            boolean primeiro = true;
            sb.append ('[');
            for (Object item : (Collection<?>) valor)
            {
                if (!primeiro)
                    sb.append (',');
                primeiro = false;
                escrever (item, sb);
            }
            sb.append (']');
        }
        else
            escreverTexto (valor.toString (), sb);
    }

    private static void escreverNumero (Number numero, StringBuilder sb)
    {
        double d = numero.doubleValue ();

        if (Double.isNaN (d) || Double.isInfinite (d))
            sb.append ("null");
        else if (d == Math.rint (d) && Math.abs (d) < 1e15)
            sb.append ((long) d);
        else
            sb.append (new BigDecimal (d).setScale (6, java.math.RoundingMode.HALF_UP).stripTrailingZeros ().toPlainString ());
    }

    private static void escreverTexto (String texto, StringBuilder sb)
    {
        sb.append ('"');

        for (int i = 0; i < texto.length (); i++)
        {
            char c = texto.charAt (i);

            switch (c)
            {
                case '"':  sb.append ("\\\""); break;
                case '\\': sb.append ("\\\\"); break;
                case '\n': sb.append ("\\n");  break;
                case '\r': sb.append ("\\r");  break;
                case '\t': sb.append ("\\t");  break;
                default:
                    if (c < 0x20)
                        sb.append (String.format ("\\u%04x", (int) c));
                    else
                        sb.append (c);
            }
        }

        sb.append ('"');
    }
}
