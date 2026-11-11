import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.ArrayList;

/**
 * Fica aceitando conexões e entrega cada uma a uma SupervisoraDeConexao (uma thread por cliente).
 * Por padrão só escuta em localhost: o servidor não tem autenticação e deve ser chamado apenas
 * pelo backend Node na mesma máquina ou rede interna.
 */
public class AceitadoraDeConexao extends Thread
{
    private ServerSocket        pedido;
    private ArrayList<Parceiro> usuarios;

    public AceitadoraDeConexao (String porta, String host, ArrayList<Parceiro> usuarios) throws Exception
    {
        if (porta == null)
            throw new Exception ("Porta ausente");
        if (usuarios == null)
            throw new Exception ("Usuarios ausentes");

        try
        {
            InetAddress endereco = host == null ? InetAddress.getLoopbackAddress () : InetAddress.getByName (host);
            this.pedido = new ServerSocket (Integer.parseInt (porta), 50, endereco);
        }
        catch (Exception erro)
        {
            throw new Exception ("Porta invalida");
        }

        this.usuarios = usuarios;
    }

    @Override
    public void run ()
    {
        for (;;)
        {
            Socket conexao;

            try
            {
                conexao = this.pedido.accept ();
            }
            catch (Exception erro)
            {
                continue;
            }

            try
            {
                new SupervisoraDeConexao (conexao, this.usuarios).start ();
            }
            catch (Exception erro)
            {} // sei que passei parametros corretos para o construtor
        }
    }
}
