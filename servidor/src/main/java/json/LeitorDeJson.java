// Guilherme Domingues de Sousa - 22013871
package json;

import java.util.*;

// Le um texto JSON a mao (sem biblioteca) e o transforma em ObjetoJson. Guarda a
// posicao atual e avanca caractere a caractere. Valores: objeto, lista, texto,
// numero (Double), true, false e null.
public class LeitorDeJson
{
    // texto JSON que esta sendo lido
    private String texto;
    // indice do proximo caractere a ler
    private int    posicao;

    // Recebe o texto a ler (nao pode ser null)
    public LeitorDeJson (String texto) throws Exception
    {
        if (texto==null)
            throw new Exception ("Texto ausente");

        this.texto   = texto;
        this.posicao = 0;
    }

    // Ponto de entrada: le o texto inteiro, que tem de ser um objeto, e confere que
    // nao sobrou nada depois dele
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

    // Olha o primeiro caractere para saber qual tipo de valor vem a seguir
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

    // Le { "nome": valor, ... } e guarda cada par no ObjetoJson
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

    // Le [ valor, valor, ... ]
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

    // Le um texto entre aspas e trata os escapes de barra invertida (como o de quebra de linha)
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

    // Le true, false ou null
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

    // Le um numero e o devolve como Double
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

    // Caractere da posicao atual, sem avancar; erro se o texto acabou
    private char proximo () throws Exception
    {
        if (this.posicao >= this.texto.length ())
            throw new Exception ("O JSON terminou antes da hora");

        return this.texto.charAt (this.posicao);
    }

    // Avanca ate o proximo caractere que nao e espaco, tab ou quebra de linha
    private void pulaBrancos ()
    {
        while (this.posicao < this.texto.length () &&
               " \t\r\n".indexOf (this.texto.charAt (this.posicao))!=-1)
            this.posicao++;
    }

    // Exige o caractere esperado na posicao atual e avanca
    private void consuma (char esperado) throws Exception
    {
        if (this.proximo ()!=esperado)
            throw new Exception ("Esperava " + esperado + " na posicao " + this.posicao);

        this.posicao++;
    }
}
