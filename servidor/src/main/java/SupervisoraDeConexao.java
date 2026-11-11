import java.io.*;
import java.net.*;
import java.util.*;

/**
 * Atende UM cliente numa thread própria: lê comunicados, responde e repete até o cliente sair.
 * Equivalente à SupervisoraDeConexao do Fazedor de Continhas, mas sem estado por conexão:
 * cada PedidoDeRanking e cada PedidoDeMetas é independente (o servidor não guarda nada entre pedidos).
 */
public class SupervisoraDeConexao extends Thread
{
    // Conexão parada por mais que isto é encerrada.
    public static final int TEMPO_MAXIMO_OCIOSO_MS = 5 * 60 * 1000;

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

    // Excecoes como NullPointerException vem sem mensagem; o cliente sempre recebe um texto.
    private static String mensagemDe (Exception erro, String padrao)
    {
        return erro.getMessage()==null ? padrao : erro.getMessage();
    }

    @Override
    public void run ()
    {
        ObjectOutputStream transmissor;
        try
        {
            this.conexao.setSoTimeout (TEMPO_MAXIMO_OCIOSO_MS);
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
                    PedidoDeRanking pedidoDeRanking = (PedidoDeRanking)comunicado;

                    try
                    {
                        pedidoDeRanking.valide ();
                    }
                    catch (Exception erro)
                    {
                        this.usuario.receba (new Erro (mensagemDe (erro,"Pedido invalido")));
                        continue;
                    }

                    try
                    {
                        this.usuario.receba (CalculadoraDeRanking.calcular (pedidoDeRanking));
                    }
                    catch (Exception erro)
                    {
                        this.usuario.receba (new Erro ("Não foi possível calcular o ranking: " + mensagemDe (erro,"erro inesperado")));
                    }
                }
                else if (comunicado instanceof PedidoDeMetas)
                {
                    PedidoDeMetas pedidoDeMetas = (PedidoDeMetas)comunicado;

                    try
                    {
                        pedidoDeMetas.valide ();
                    }
                    catch (Exception erro)
                    {
                        this.usuario.receba (new Erro (mensagemDe (erro,"Pedido invalido")));
                        continue;
                    }

                    try
                    {
                        this.usuario.receba (CalculadoraDeMetas.calcular (pedidoDeMetas));
                    }
                    catch (Exception erro)
                    {
                        this.usuario.receba (new Erro ("Não foi possível priorizar as metas: " + mensagemDe (erro,"erro inesperado")));
                    }
                }
                else if (comunicado instanceof PedidoParaSair)
                    return;
            }
        }
        catch (Exception erro)
        {
            // Erro de rede, tempo ocioso esgotado, objeto de classe proibida ou fluxo corrompido: encerra esta conexao.
            try
            {
                this.usuario.receba (new Erro (mensagemDe (erro,"Erro de conexao")));
            }
            catch (Exception falha)
            {} // so tentando avisar antes de acabar a thread
        }
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
