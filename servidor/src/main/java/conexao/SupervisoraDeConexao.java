package conexao;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.net.Socket;
import java.util.ArrayList;

import calculo.CalculadoraDeMetas;
import calculo.CalculadoraDeRanking;
import comunicado.Comunicado;
import comunicado.Erro;
import comunicado.PedidoDeMetas;
import comunicado.PedidoDeRanking;
import comunicado.PedidoParaSair;

// Thread dedicada a um cliente. Le os pedidos (ranking, metas ou saida), calcula a
// resposta e a devolve; erros de calculo voltam ao cliente como um Erro.
public class SupervisoraDeConexao extends Thread
{
    // o cliente atendido por esta thread
    private Parceiro            usuario;
    // socket do cliente
    private Socket              conexao;
    // todos os clientes conectados (compartilhada entre as threads)
    private ArrayList<Parceiro> usuarios;

    // Guarda o socket do cliente e a lista compartilhada de clientes conectados
    public SupervisoraDeConexao
    (Socket conexao, ArrayList<Parceiro> usuarios)
    throws Exception
    {
        if (conexao==null)
            throw new Exception ("Conexao ausente");

        if (usuarios==null)
            throw new Exception ("Usuarios ausentes");

        this.conexao  = conexao;
        this.usuarios = usuarios;
    }

    // 1) abre os fluxos em UTF-8, 2) registra o cliente na lista, 3) atende pedidos ate
    // ele sair ou a conexao cair. instanceof decide qual pedido chegou.
    public void run ()
    {

        // transmissor: escreve texto para o cliente (true = descarrega a cada println)
        PrintWriter transmissor;
        try
        {
            transmissor =
            new PrintWriter(
            new OutputStreamWriter(
            this.conexao.getOutputStream(), "UTF-8"), true);
        }
        catch (Exception erro)
        {
            return;
        }
        
        // receptor: le o texto que o cliente envia, linha por linha
        BufferedReader receptor=null;
        try
        {
            receptor=
            new BufferedReader(
            new InputStreamReader(
            this.conexao.getInputStream(), "UTF-8"));
        }
        catch (Exception err0)
        {
            try
            {
                transmissor.close();
            }
            catch (Exception falha)
            {} // so tentando fechar antes de acabar a thread
            
            return;
        }

        try
        {
            // Parceiro reune o socket e os fluxos de entrada e saida
            this.usuario =
            new Parceiro (this.conexao,
                          receptor,
                          transmissor);
        }
        catch (Exception erro)
        {} // sei que passei os parametros corretos

        try
        {
            // synchronized: so uma thread por vez mexe na lista, pois todas as
            // supervisoras a compartilham
            synchronized (this.usuarios)
            {
                this.usuarios.add (this.usuario);
            }

            for(;;)
            {
                // envie() bloqueia ate chegar a proxima mensagem do cliente
                Comunicado comunicado = this.usuario.envie ();

                // null: o cliente fechou a conexao, entao a thread termina
                if (comunicado==null)
                    return;
                else if (comunicado instanceof PedidoDeRanking)
                {
                    try
                    {
                        // converte o tipo geral Comunicado para o pedido que ele realmente e
                        PedidoDeRanking pedido = (PedidoDeRanking)comunicado;

                        // calcula o ranking e envia a resposta ao cliente
                        this.usuario.receba (CalculadoraDeRanking.calcular (pedido));
                    }
                    catch (Exception erro)
                    {
                        String mensagem = "Nao foi possivel calcular o ranking: ";

                        this.usuario.receba (new Erro (mensagem+erro.getMessage()));
                    }
                }
                else if (comunicado instanceof PedidoDeMetas)
                {
                    try
                    {
                        // converte o tipo geral Comunicado para o pedido que ele realmente e
                        PedidoDeMetas pedido = (PedidoDeMetas)comunicado;

                        // calcula a prioridade das metas e envia a resposta ao cliente
                        this.usuario.receba (CalculadoraDeMetas.calcular (pedido));
                    }
                    catch (Exception erro)
                    {
                        String mensagem = "Nao foi possivel priorizar as metas: ";

                        this.usuario.receba (new Erro (mensagem+erro.getMessage()));
                    }
                }
                // o cliente pediu para sair: sai da lista e fecha a conexao
                else if (comunicado instanceof PedidoParaSair)
                {
                    synchronized (this.usuarios)
                    {
                        this.usuarios.remove (this.usuario);
                    }
                    this.usuario.adeus();
                }
            }
        }
        catch (Exception erro)
        {
            try
            {
                transmissor.close ();
                receptor   .close ();
            }
            catch (Exception falha)
            {} // so tentando fechar antes de acabar a thread

            return;
        }
    }
}
