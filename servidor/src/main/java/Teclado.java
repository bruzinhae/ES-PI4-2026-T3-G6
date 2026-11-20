import java.io.*;

// Classe do material de aula (PPOO): le valores digitados no console. O Servidor usa
// so getUmString, para ler o comando "desativar".
public class Teclado
{
    private static BufferedReader teclado =
                   new BufferedReader (
                   new InputStreamReader (
                   System.in));

    // Le uma linha como texto
    public static String getUmString ()
    {
        String ret=null;

        try
        {
            ret = teclado.readLine ();
        }
        catch (IOException erro)
        {} // sei que nao vai dar erro

        return ret;
    }

    // Le uma linha e converte para byte (erro se nao for um numero valido)
    public static byte getUmByte () throws Exception
    {
        byte ret=(byte)0;

        try
        {
            ret = Byte.parseByte (teclado.readLine ());
        }
        catch (IOException erro)
        {} // sei que nao vai dar erro
        catch (NumberFormatException erro)
        {
            throw new Exception ("Byte invalido!");
        }

        return ret;
    }
 
    // Le uma linha e converte para short
    public static short getUmShort () throws Exception
    {
        short ret=(short)0;

        try
        {
            ret = Short.parseShort (teclado.readLine ());
        }
        catch (IOException erro)
        {} // sei que nao vai dar erro
        catch (NumberFormatException erro)
        {
            throw new Exception ("Short invalido!");
        }

        return ret;
    }

    // Le uma linha e converte para int
    public static int getUmInt () throws Exception
    {
        int ret=0;

        try
        {
            ret = Integer.parseInt (teclado.readLine ());
        }
        catch (IOException erro)
        {} // sei que nao vai dar erro
        catch (NumberFormatException erro)
        {
            throw new Exception ("Int invalido!");
        }

        return ret;
    }

    // Le uma linha e converte para long
    public static long getUmLong () throws Exception
    {
      //long ret=(long)0;
      //long ret=0;
        long ret=0L;

        try
        {
            ret = Long.parseLong (teclado.readLine ());
        }
        catch (IOException erro)
        {} // sei que nao vai dar erro
        catch (NumberFormatException erro)
        {
            throw new Exception ("Long invalido!");
        }

        return ret;
    }

    // Le uma linha e converte para float
    public static float getUmFloat () throws Exception
    {
      //float ret=0;
      //float ret=(float)0.0;
        float ret=0.0F;

        try
        {
            ret = Float.parseFloat (teclado.readLine ());
        }
        catch (IOException erro)
        {} // sei que nao vai dar erro
        catch (NumberFormatException erro)
        {
            throw new Exception ("Float invalido!");
        }

        return ret;
    }

    // Le uma linha e converte para double
    public static double getUmDouble () throws Exception
    {
      //double ret=0;
      //double ret=(long)0;
      //double ret=0L;
        double ret=0.0;

        try
        {
            ret = Double.parseDouble (teclado.readLine ());
        }
        catch (IOException erro)
        {} // sei que nao vai dar erro
        catch (NumberFormatException erro)
        {
            throw new Exception ("Double invalido!");
        }

        return ret;
    }

    // Le uma linha e devolve o primeiro caractere (erro se estiver vazia)
    public static char getUmChar () throws Exception
    {
        char ret=' ';

        try
        {
            String str = teclado.readLine ();

            if (str==null)
                throw new Exception ("Char invalido!");

            if (str.length() != 1)
                throw new Exception ("Char invalido!");

             ret = str.charAt(0);
        }
        catch (IOException erro)
        {} // sei que nao vai dar erro

        return ret;
    }

    // Le uma linha e converte para boolean (true ou false)
    public static boolean getUmBoolean () throws Exception
    {
        boolean ret=false;

        try
        {
            String str = teclado.readLine ();

            if (str==null)
                throw new Exception ("Boolean invalido!");

            if (!str.equals("true") && !str.equals("false"))
                throw new Exception ("Boolean invalido!");

            ret = Boolean.parseBoolean (str);
        }
        catch (IOException erro)
        {} // sei que nao vai dar erro

        return ret;
    }
}