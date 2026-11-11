import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.Semaphore;

/**
 * A "outra ponta" de uma conexão: embrulha o socket e conversa em comunicados.
 *
 * Mesma ideia do Parceiro do Fazedor de Continhas (receba, envie, adeus), só que os
 * comunicados trafegam como linhas de texto JSON em vez de objetos serializados.
 */
public class Parceiro
{
    // Uma linha maior que isto é recusada (protege a memória do servidor).
    public static final int TAMANHO_MAXIMO_DA_LINHA = 2_000_000;

    // Conexão parada por mais que isto é encerrada.
    public static final int TEMPO_MAXIMO_OCIOSO_MS = 5 * 60 * 1000;

    private Socket         conexao;
    private BufferedReader receptor;
    private PrintWriter    transmissor;

    private String proximaLinha = null;

    private Semaphore mutEx = new Semaphore (1, true);

    public Parceiro (Socket conexao) throws Exception
    {
        if (conexao == null)
            throw new Exception ("Conexao ausente");

        try
        {
            conexao.setSoTimeout (TEMPO_MAXIMO_OCIOSO_MS);
            this.receptor    = new BufferedReader (new InputStreamReader (conexao.getInputStream (), StandardCharsets.UTF_8));
            this.transmissor = new PrintWriter (new OutputStreamWriter (conexao.getOutputStream (), StandardCharsets.UTF_8), false);
        }
        catch (IOException erro)
        {
            throw new Exception ("Erro ao abrir os fluxos da conexao");
        }

        this.conexao = conexao;
    }

    // Envia um comunicado (uma linha). Chamadas concorrentes (resposta x desligamento) não se misturam.
    public synchronized void receba (Comunicado comunicado) throws Exception
    {
        if (comunicado == null)
            throw new Exception ("Comunicado ausente");

        this.transmissor.print (comunicado.paraJson ());
        this.transmissor.print ('\n');
        this.transmissor.flush ();

        if (this.transmissor.checkError ())
            throw new Exception ("Erro de transmissao");
    }

    // Envia uma resposta em texto simples (uma linha), como nos comandos OLA, DATA e HORA.
    public synchronized void recebaTexto (String texto) throws Exception
    {
        if (texto == null)
            throw new Exception ("Texto ausente");

        this.transmissor.print (texto.replace ('\n', ' ').replace ('\r', ' '));
        this.transmissor.print ('\n');
        this.transmissor.flush ();

        if (this.transmissor.checkError ())
            throw new Exception ("Erro de transmissao");
    }

    // Espia a proxima linha enviada pela outra ponta, sem tira-la da fila (envie a tira).
    // Devolve null quando a outra ponta fechou a conexao.
    public String espie () throws Exception
    {
        try
        {
            this.mutEx.acquireUninterruptibly ();
            if (this.proximaLinha == null) this.proximaLinha = this.lerLinha ();
            return this.proximaLinha;
        }
        catch (Exception erro)
        {
            throw new Exception ("Erro de recepcao");
        }
        finally
        {
            this.mutEx.release ();
        }
    }

    // Le a proxima linha enviada pelo cliente (a que o espie ja tiver lido, se houver).
    // Devolve null quando o cliente fechou a conexao.
    public String envie () throws Exception
    {
        try
        {
            if (this.proximaLinha == null) this.proximaLinha = this.lerLinha ();
            String ret = this.proximaLinha;
            this.proximaLinha = null;
            return ret;
        }
        catch (Exception erro)
        {
            throw new Exception (erro.getMessage () == null ? "Erro de recepcao" : erro.getMessage ());
        }
    }

    private String lerLinha () throws Exception
    {
        StringBuffer linha = new StringBuffer ();

        try
        {
            for (;;)
            {
                int c = this.receptor.read ();

                if (c == -1)
                    return linha.length () == 0 ? null : linha.toString ();
                if (c == '\n')
                    return linha.toString ();
                if (c != '\r')
                    linha.append ((char) c);

                if (linha.length () > TAMANHO_MAXIMO_DA_LINHA)
                    throw new Exception ("Mensagem grande demais");
            }
        }
        catch (IOException erro)
        {
            throw new Exception ("Erro de recepcao");
        }
    }

    public void adeus () throws Exception
    {
        try
        {
            this.transmissor.close ();
            this.receptor.close ();
            this.conexao.close ();
        }
        catch (Exception erro)
        {
            throw new Exception ("Erro de desconexao");
        }
    }
}
