package conexao;

import java.net.ServerSocket;
import java.net.Socket;
import java.util.ArrayList;

// Thread que fica no accept() da porta do servidor. Para cada cliente que conecta,
// cria e liga uma SupervisoraDeConexao (uma thread por cliente).
public class AceitadoraDeConexao extends Thread
{
    // ServerSocket: fica escutando a porta e entrega uma conexao por cliente
    private ServerSocket        pedido;
    // clientes conectados (compartilhada com o Servidor e com as supervisoras)
    private ArrayList<Parceiro> usuarios;

    // Abre o ServerSocket na porta informada (texto, vem de args) e guarda a lista
    // compartilhada de clientes. Lanca Exception se a porta ou a lista forem invalidas.
    public AceitadoraDeConexao
    (String porta, ArrayList<Parceiro> usuarios)
    throws Exception
    {
        if (porta==null)
            throw new Exception ("Porta ausente");

        try
        {
            this.pedido =
            new ServerSocket (Integer.parseInt(porta));
        }
        catch (Exception  erro)
        {
            throw new Exception ("Porta invalida");
        }

        if (usuarios==null)
            throw new Exception ("Usuarios ausentes");

        this.usuarios = usuarios;
    }

    // Laco infinito: espera uma conexao, entrega ao supervisor e volta a esperar
    public void run ()
    {
        for(;;)
        {
            // accept() bloqueia ate um cliente conectar e devolve o socket dele
            Socket conexao=null;
            try
            {
                conexao = this.pedido.accept();
            }
            catch (Exception erro)
            {
                continue;
            }

            SupervisoraDeConexao supervisoraDeConexao=null;
            try
            {
                // uma thread nova por cliente: varios sao atendidos ao mesmo tempo
                supervisoraDeConexao =
                new SupervisoraDeConexao (conexao, usuarios);
            }
            catch (Exception erro)
            {} // sei que passei parametros corretos para o construtor
            // start() inicia a thread; este laco ja volta ao accept() para o proximo cliente
            supervisoraDeConexao.start();
        }
    }
}
