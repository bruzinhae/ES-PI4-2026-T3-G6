import java.util.ArrayList;

/**
 * Servidor de ranking do AçaíStudy (issue #34), baseado no Fazedor de Continhas.
 *
 * Uso: java Servidor [PORTA [HOST]]    (padrão: porta 3000, somente em localhost)
 * Para desativar, digite "desativar" no console.
 */
public class Servidor
{
    public static String PORTA_PADRAO = "3000";

    public static void main (String[] args)
    {
        if (args.length > 2)
        {
            System.err.println ("Uso esperado: java Servidor [PORTA [HOST]]\n");
            return;
        }

        String porta = Servidor.PORTA_PADRAO;
        String host  = null;

        if (args.length >= 1)
            porta = args[0];

        if (args.length == 2)
            host = args[1];

        ArrayList<Parceiro> usuarios = new ArrayList<Parceiro> ();

        AceitadoraDeConexao aceitadoraDeConexao = null;
        try
        {
            aceitadoraDeConexao = new AceitadoraDeConexao (porta, host, usuarios);
            aceitadoraDeConexao.start ();
        }
        catch (Exception erro)
        {
            System.err.println ("Escolha uma porta apropriada e liberada para uso!\n");
            return;
        }

        for (;;)
        {
            System.out.println ("O servidor esta ativo na porta " + porta + "! Para desativa-lo,");
            System.out.println ("use o comando \"desativar\"\n");
            System.out.print   ("> ");

            String comando = Teclado.getUmString ();

            if (comando == null)
            {
                // Sem console (ex.: rodando em segundo plano): continua ativo ate o processo ser encerrado.
                try { Thread.sleep (Long.MAX_VALUE); } catch (InterruptedException erro) {}
                continue;
            }

            if (comando.trim ().toLowerCase ().equals ("desativar"))
            {
                synchronized (usuarios)
                {
                    ComunicadoDeDesligamento comunicadoDeDesligamento = new ComunicadoDeDesligamento ();

                    for (Parceiro usuario : usuarios)
                    {
                        try
                        {
                            usuario.receba (comunicadoDeDesligamento);
                            usuario.adeus  ();
                        }
                        catch (Exception erro)
                        {}
                    }
                }

                System.out.println ("O servidor foi desativado!\n");
                System.exit (0);
            }
            else
                System.err.println ("Comando invalido!\n");
        }
    }
}
