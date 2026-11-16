import java.util.*;

public class LeitorDeJson
{
    private String texto;
    private int    posicao;

    public LeitorDeJson (String texto) throws Exception
    {
        if (texto==null)
            throw new Exception ("Texto ausente");

        this.texto   = texto;
        this.posicao = 0;
    }

    public ObjetoJson leObjeto () throws Exception // o texto inteiro tem de ser um objeto
    {
        Object ret = this.leValor ();

        if (!(ret instanceof ObjetoJson))
            throw new Exception ("O JSON deve ser um objeto");

        this.pulaBrancos ();

        if (this.posicao < this.texto.length ())
            throw new Exception ("Sobrou texto depois do JSON");

        return (ObjetoJson)ret;
    }

    private Object leValor () throws Exception
    {
        this.pulaBrancos ();

        char c = this.proximo ();

        if (c=='{') return this.leObjetoInterno ();
        if (c=='[') return this.leLista ();
        if (c=='"') return this.leTexto ();
        if (c=='t' || c=='f' || c=='n') return this.lePalavra ();

        return this.leNumero ();
    }

    private ObjetoJson leObjetoInterno () throws Exception
    {
        ObjetoJson ret = new ObjetoJson ();

        this.consuma ('{');
        this.pulaBrancos ();

        if (this.proximo ()=='}')
        {
            this.posicao++;
            return ret;
        }

        for (;;)
        {
            this.pulaBrancos ();
            String nome = this.leTexto ();
            this.pulaBrancos ();
            this.consuma (':');
            ret.ponha (nome, this.leValor ());
            this.pulaBrancos ();

            char c = this.proximo ();
            this.posicao++;

            if (c=='}')
                return ret;

            if (c!=',')
                throw new Exception ("Esperava , ou } na posicao " + (this.posicao-1));
        }
    }

    private ArrayList<Object> leLista () throws Exception
    {
        ArrayList<Object> ret = new ArrayList<Object> ();

        this.consuma ('[');
        this.pulaBrancos ();

        if (this.proximo ()==']')
        {
            this.posicao++;
            return ret;
        }

        for (;;)
        {
            ret.add (this.leValor ());
            this.pulaBrancos ();

            char c = this.proximo ();
            this.posicao++;

            if (c==']')
                return ret;

            if (c!=',')
                throw new Exception ("Esperava , ou ] na posicao " + (this.posicao-1));
        }
    }

    private String leTexto () throws Exception
    {
        StringBuilder ret = new StringBuilder ();

        this.consuma ('"');

        for (;;)
        {
            char c = this.proximo ();
            this.posicao++;

            if (c=='"')
                return ret.toString ();

            if (c!='\\')
            {
                ret.append (c);
                continue;
            }

            char e = this.proximo ();
            this.posicao++;

            if      (e=='n') ret.append ('\n');
            else if (e=='t') ret.append ('\t');
            else if (e=='r') ret.append ('\r');
            else if (e=='b') ret.append ('\b');
            else if (e=='f') ret.append ('\f');
            else if (e=='u')
            {
                ret.append ((char)Integer.parseInt (this.texto.substring (this.posicao, this.posicao+4), 16));
                this.posicao = this.posicao + 4;
            }
            else
                ret.append (e); // \" \\ e \/
        }
    }

    private Object lePalavra () throws Exception
    {
        if (this.texto.startsWith ("true", this.posicao))
        {
            this.posicao = this.posicao + 4;
            return true;
        }

        if (this.texto.startsWith ("false", this.posicao))
        {
            this.posicao = this.posicao + 5;
            return false;
        }

        if (this.texto.startsWith ("null", this.posicao))
        {
            this.posicao = this.posicao + 4;
            return null;
        }

        throw new Exception ("Palavra invalida na posicao " + this.posicao);
    }

    private Object leNumero () throws Exception
    {
        int inicio = this.posicao;

        while (this.posicao < this.texto.length () &&
               "+-0123456789.eE".indexOf (this.texto.charAt (this.posicao))!=-1)
            this.posicao++;

        if (this.posicao==inicio)
            throw new Exception ("Valor invalido na posicao " + inicio);

        return Double.parseDouble (this.texto.substring (inicio, this.posicao));
    }

    private char proximo () throws Exception
    {
        if (this.posicao >= this.texto.length ())
            throw new Exception ("O JSON terminou antes da hora");

        return this.texto.charAt (this.posicao);
    }

    private void pulaBrancos ()
    {
        while (this.posicao < this.texto.length () &&
               " \t\r\n".indexOf (this.texto.charAt (this.posicao))!=-1)
            this.posicao++;
    }

    private void consuma (char esperado) throws Exception
    {
        if (this.proximo ()!=esperado)
            throw new Exception ("Esperava " + esperado + " na posicao " + this.posicao);

        this.posicao++;
    }
}
