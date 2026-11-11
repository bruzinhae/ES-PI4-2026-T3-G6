import java.util.ArrayList;

/**
 * Leitor e escritor de JSON mínimos, sem bibliotecas externas.
 *
 * Mantém o servidor com dependência zero, como o exemplo do professor (Fazedor de
 * Continhas). Na leitura, o JSON vira: Objeto (objeto), ArrayList (lista), String, Double (número),
 * Boolean ou null. Na escrita, aceita esses mesmos tipos mais qualquer Number.
 */
public class Json
{
    // Evita estouro de pilha com JSON malicioso do tipo [[[[[[...
    private static final int PROFUNDIDADE_MAXIMA = 64;

    private String texto;
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

    private Objeto lerObjeto (int profundidade) throws Exception
    {
        Objeto objeto = new Objeto ();

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
            objeto.guarde (chave, lerValor (profundidade + 1));
            pularEspacos ();

            char c = espie ();
            this.posicao++;

            if (c == '}')
                return objeto;
            if (c != ',')
                throw erro ("esperava ',' ou '}'");
        }
    }

    private ArrayList<Object> lerLista (int profundidade) throws Exception
    {
        ArrayList<Object> lista = new ArrayList<Object> ();

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
        StringBuffer sb = new StringBuffer ();

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
        StringBuffer sb = new StringBuffer ();
        escrever (valor, sb);
        return sb.toString ();
    }

    private static void escrever (Object valor, StringBuffer sb)
    {
        if (valor == null)
            sb.append ("null");
        else if (valor instanceof Boolean)
            sb.append (valor);
        else if (valor instanceof Number)
            escreverNumero ((Number) valor, sb);
        else if (valor instanceof Objeto)
        {
            Objeto objeto = (Objeto) valor;

            sb.append ('{');
            for (int i = 0; i < objeto.getQuantidade (); i++)
            {
                if (i > 0)
                    sb.append (',');
                escreverTexto (objeto.getNome (i), sb);
                sb.append (':');
                escrever (objeto.getValor (i), sb);
            }
            sb.append ('}');
        }
        else if (valor instanceof ArrayList)
        {
            ArrayList<?> lista = (ArrayList<?>) valor;

            sb.append ('[');
            for (int i = 0; i < lista.size (); i++)
            {
                if (i > 0)
                    sb.append (',');
                escrever (lista.get (i), sb);
            }
            sb.append (']');
        }
        else
            escreverTexto (valor.toString (), sb);
    }

    // Inteiros saem sem casas decimais; os demais com ate 6 casas, sem zeros sobrando no fim.
    private static void escreverNumero (Number numero, StringBuffer sb)
    {
        double d = numero.doubleValue ();

        if (Double.isNaN (d) || Double.isInfinite (d))
            sb.append ("null");
        else if (d == Math.rint (d) && Math.abs (d) < 1e15)
            sb.append ((long) d);
        else
        {
            long milionesimos = Math.round (Math.abs (d) * 1000000.0);
            long inteira      = milionesimos / 1000000L;
            String fracao     = Long.toString (milionesimos % 1000000L);

            while (fracao.length () < 6)
                fracao = "0" + fracao;

            int fim = fracao.length ();
            while (fim > 0 && fracao.charAt (fim - 1) == '0')
                fim--;

            if (d < 0 && milionesimos != 0)
                sb.append ('-');

            sb.append (inteira);

            if (fim > 0)
                sb.append ('.').append (fracao.substring (0, fim));
        }
    }

    private static void escreverTexto (String texto, StringBuffer sb)
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
                        sb.append ("\\u").append (quatroDigitosHexa (c));
                    else
                        sb.append (c);
            }
        }

        sb.append ('"');
    }

    // O codigo do caractere em 4 digitos hexadecimais minusculos (ex.: 001f).
    private static String quatroDigitosHexa (int codigo)
    {
        String digitos = "0123456789abcdef";

        return "" + digitos.charAt (codigo / 4096 % 16) + digitos.charAt (codigo / 256 % 16)
                  + digitos.charAt (codigo / 16 % 16) + digitos.charAt (codigo % 16);
    }
}
