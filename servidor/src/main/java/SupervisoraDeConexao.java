import java.io.*;
import java.net.*;
import java.util.*;

/**
 * Atende UM cliente numa thread própria: lê comunicados, responde e repete até o cliente sair.
 * Equivalente à SupervisoraDeConexao do Fazedor de Continhas, mas sem estado por conexão:
 * cada PedidoDeRanking e cada PedidoDeMetas é independente (o servidor não guarda nada entre pedidos).
 * Quem confere os valores do pedido é o cliente, como no exemplo.
 */
public class SupervisoraDeConexao extends Thread
{
    private Parceiro            usuario;
    private Socket              conexao;
    private ArrayList<Parceiro> usuarios;

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

    public void run ()
    {
        ObjectOutputStream transmissor;
        try
        {
            transmissor =
            new ObjectOutputStream(
            this.conexao.getOutputStream());
        }
        catch (Exception erro)
        {
            return;
        }

        ObjectInputStream receptor=null;
        try
        {
            receptor=
            new ObjectInputStream(
            this.conexao.getInputStream());
            receptor.setObjectInputFilter (new FiltroDeComunicados ());
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
            this.usuario =
            new Parceiro (this.conexao,
                          receptor,
                          transmissor);
        }
        catch (Exception erro)
        {} // sei que passei os parametros corretos

        try
        {
            synchronized (this.usuarios)
            {
                this.usuarios.add (this.usuario);
            }

            for(;;)
            {
                Comunicado comunicado = this.usuario.envie ();

                if (comunicado==null)
                    return;
                else if (comunicado instanceof PedidoDeRanking)
                {
                    try
                    {
                        this.usuario.receba (CalculadoraDeRanking.calcular ((PedidoDeRanking)comunicado));
                    }
                    catch (Exception erro)
                    {
                        this.usuario.receba (new Erro ("Não foi possível calcular o ranking: "+erro.getMessage()));
                    }
                }
                else if (comunicado instanceof PedidoDeMetas)
                {
                    try
                    {
                        this.usuario.receba (CalculadoraDeMetas.calcular ((PedidoDeMetas)comunicado));
                    }
                    catch (Exception erro)
                    {
                        this.usuario.receba (new Erro ("Não foi possível priorizar as metas: "+erro.getMessage()));
                    }
                }
                else if (comunicado instanceof PedidoParaSair)
                    return;
            }
        }
        catch (Exception erro)
        {} // erro de rede, objeto de classe proibida ou fluxo corrompido: encerra esta conexao
        finally
        {
            synchronized (this.usuarios)
            {
                this.usuarios.remove (this.usuario);
            }

            try
            {
                this.usuario.adeus();
            }
            catch (Exception falha)
            {} // so tentando fechar antes de acabar a thread
        }
    }
}
