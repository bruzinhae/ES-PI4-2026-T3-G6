package br.faculdade.acaistudy.servidor;

import br.faculdade.acaistudy.servidor.comunicado.Comunicado;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.net.Socket;
import java.nio.charset.StandardCharsets;

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

    private final Socket         conexao;
    private final BufferedReader receptor;
    private final PrintWriter    transmissor;

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

    // Lê a próxima linha enviada pelo cliente. Devolve null quando o cliente fechou a conexão.
    public String envie () throws Exception
    {
        StringBuilder linha = new StringBuilder ();

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
