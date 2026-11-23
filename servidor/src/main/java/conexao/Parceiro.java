package conexao;

import java.io.BufferedReader;
import java.io.PrintWriter;
import java.net.Socket;
import java.util.concurrent.Semaphore;

import comunicado.Comunicado;
import comunicado.PedidoDeMetas;
import comunicado.PedidoDeRanking;
import comunicado.PedidoParaSair;
import json.LeitorDeJson;
import json.ObjetoJson;

// Representa o cliente conectado: guarda o socket e os fluxos de texto e oferece
// as operacoes do protocolo. Cada mensagem e uma linha de JSON.
public class Parceiro
{
    // socket da conexao TCP com o cliente
    private Socket         conexao;
    // receptor: le o texto enviado pelo cliente, linha por linha
    private BufferedReader receptor;
    // transmissor: escreve texto para o cliente
    private PrintWriter    transmissor;

    // comunicado ja lido mas ainda nao entregue (null = nada guardado)
    private Comunicado proximoComunicado=null;

    // garante que espie() e envie() nao leiam a mesma linha ao mesmo tempo
    // Semaphore com 1 permissao funciona como trava: quem pega a permissao
    // executa sozinho ate devolve-la. Evita duas threads lendo ao mesmo tempo.
    private Semaphore mutEx = new Semaphore (1,true);

    // Recebe o socket e os fluxos ja abertos; nenhum pode ser nulo
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

    // Envia um comunicado ao cliente (escreve o JSON dele em uma linha)
    public void receba (Comunicado x) throws Exception
    {
        this.transmissor.println (x); // o toString de cada comunicado e o seu JSON
        // flush: empurra o texto para a rede agora, sem esperar encher o buffer
        this.transmissor.flush   ();

        // PrintWriter nao lanca excecao: checkError diz se houve falha na escrita
        if (this.transmissor.checkError ())
            throw new Exception ("Erro de transmissao");
    }

    // Olha o proximo comunicado sem consumi-lo: fica guardado ate o envie()
    public Comunicado espie () throws Exception
    {
        try
        {
            // pega a trava (espera se outra thread estiver com ela)
            this.mutEx.acquireUninterruptibly();
            if (this.proximoComunicado==null) this.proximoComunicado = this.leComunicado ();
            // devolve a trava
            this.mutEx.release();
            return this.proximoComunicado;
        }
        catch (Exception erro)
        {
            throw new Exception ("Erro de recepcao");
        }
    }

    // Entrega o proximo comunicado (le da conexao se ainda nao houver um guardado)
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

    // Fecha os fluxos e o socket
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

    // Le uma linha, descobre o comunicado pelo campo "tipo" e o constroi.
    // Devolve null quando o cliente fechou a conexao.
    private Comunicado leComunicado () throws Exception // uma linha de texto = um comunicado em JSON
    {
        // readLine bloqueia ate chegar uma linha inteira
        String linha = this.receptor.readLine ();

        if (linha==null)
            return null; // o parceiro fechou a conexao

        // transforma o texto da linha em objeto JSON
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
