package br.faculdade.acaistudy.servidor;

import br.faculdade.acaistudy.servidor.comunicado.Comunicado;
import br.faculdade.acaistudy.servidor.comunicado.Erro;
import br.faculdade.acaistudy.servidor.comunicado.PedidoDeRanking;
import br.faculdade.acaistudy.servidor.comunicado.PedidoParaSair;
import br.faculdade.acaistudy.servidor.ranking.CalculadoraDeRanking;

import java.net.Socket;
import java.util.ArrayList;

/**
 * Atende UM cliente numa thread própria: lê comunicados, responde e repete até o cliente sair.
 * Equivalente à SupervisoraDeConexao do Fazedor de Continhas, mas sem estado por conexão:
 * cada PedidoDeRanking é independente (o servidor não guarda nada entre pedidos).
 */
public class SupervisoraDeConexao extends Thread
{
    private Parceiro               usuario;
    private final Socket           conexao;
    private final ArrayList<Parceiro> usuarios;

    public SupervisoraDeConexao (Socket conexao, ArrayList<Parceiro> usuarios) throws Exception
    {
        if (conexao == null)
            throw new Exception ("Conexao ausente");
        if (usuarios == null)
            throw new Exception ("Usuarios ausentes");

        this.conexao  = conexao;
        this.usuarios = usuarios;
    }

    // Exceções como NullPointerException vêm sem mensagem; o cliente sempre recebe um texto.
    private static String mensagemDe (Exception erro, String padrao)
    {
        return erro.getMessage () == null ? padrao : erro.getMessage ();
    }

    public void run ()
    {
        try
        {
            this.usuario = new Parceiro (this.conexao);
        }
        catch (Exception erro)
        {
            try { this.conexao.close (); } catch (Exception falha) {} // só tentando fechar antes de acabar a thread
            return;
        }

        synchronized (this.usuarios)
        {
            this.usuarios.add (this.usuario);
        }

        try
        {
            for (;;)
            {
                String linha = this.usuario.envie ();

                if (linha == null)
                    break; // o cliente fechou a conexão

                if (linha.isBlank ())
                    continue;

                Comunicado comunicado;

                try
                {
                    comunicado = Comunicado.deJson (linha);
                }
                catch (Exception erro)
                {
                    this.usuario.receba (new Erro (mensagemDe (erro, "Pedido inválido")));
                    continue;
                }

                if (comunicado instanceof PedidoDeRanking)
                {
                    try
                    {
                        this.usuario.receba (CalculadoraDeRanking.calcular ((PedidoDeRanking) comunicado));
                    }
                    catch (Exception erro)
                    {
                        this.usuario.receba (new Erro ("Não foi possível calcular o ranking: " + mensagemDe (erro, "erro inesperado")));
                    }
                }
                else if (comunicado instanceof PedidoParaSair)
                    break;
            }
        }
        catch (Exception erro)
        {
            // Erro de rede, tempo ocioso esgotado ou mensagem grande demais: encerra esta conexão.
            try { this.usuario.receba (new Erro (mensagemDe (erro, "Erro de conexao"))); } catch (Exception falha) {}
        }
        finally
        {
            synchronized (this.usuarios)
            {
                this.usuarios.remove (this.usuario);
            }

            try { this.usuario.adeus (); } catch (Exception falha) {} // só tentando fechar antes de acabar a thread
        }
    }
}
