import java.io.*;
import java.net.*;
import java.util.concurrent.Semaphore;

public class Parceiro
{
    private Socket         conexao;
    private BufferedReader receptor;
    private PrintWriter    transmissor;

    private Comunicado proximoComunicado=null;

    private Semaphore mutEx = new Semaphore (1,true);

    public Parceiro (Socket         conexao,
                     BufferedReader receptor,
                     PrintWriter    transmissor)
                     throws Exception // se parametro nulos
    {
        if (conexao==null)
            throw new Exception ("Conexao ausente");

        if (receptor==null)
            throw new Exception ("Receptor ausente");

        if (transmissor==null)
            throw new Exception ("Transmissor ausente");

        this.conexao     = conexao;
        this.receptor    = receptor;
        this.transmissor = transmissor;
    }

    public void receba (Comunicado x) throws Exception
    {
        this.transmissor.println (x); // o toString de cada comunicado e o seu JSON
        this.transmissor.flush   ();

        if (this.transmissor.checkError ())
            throw new Exception ("Erro de transmissao");
    }

    public Comunicado espie () throws Exception
    {
        try
        {
            this.mutEx.acquireUninterruptibly();
            if (this.proximoComunicado==null) this.proximoComunicado = this.leComunicado ();
            this.mutEx.release();
            return this.proximoComunicado;
        }
        catch (Exception erro)
        {
            throw new Exception ("Erro de recepcao");
        }
    }

    public Comunicado envie () throws Exception
    {
        try
        {
            if (this.proximoComunicado==null) this.proximoComunicado = this.leComunicado ();
            Comunicado ret         = this.proximoComunicado;
            this.proximoComunicado = null;
            return ret;
        }
        catch (Exception erro)
        {
            throw new Exception ("Erro de recepcao");
        }
    }

    public void adeus () throws Exception
    {
        try
        {
            this.transmissor.close();
            this.receptor   .close();
            this.conexao    .close();
        }
        catch (Exception erro)
        {
            throw new Exception ("Erro de desconexao");
        }
    }

    private Comunicado leComunicado () throws Exception // uma linha de texto = um comunicado em JSON
    {
        String linha = this.receptor.readLine ();

        if (linha==null)
            return null; // o parceiro fechou a conexao

        ObjetoJson json = new LeitorDeJson (linha).leObjeto ();
        String     tipo = json.getTexto ("tipo");

        if (tipo.equals ("pedidoDeRanking"))
            return new PedidoDeRanking (json);

        if (tipo.equals ("pedidoDeMetas"))
            return new PedidoDeMetas (json);

        if (tipo.equals ("pedidoParaSair"))
            return new PedidoParaSair ();

        throw new Exception ("Tipo de comunicado desconhecido: " + tipo);
    }
}
