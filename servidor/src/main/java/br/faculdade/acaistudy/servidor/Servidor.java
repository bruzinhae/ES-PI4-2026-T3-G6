package br.faculdade.acaistudy.servidor;

import br.faculdade.acaistudy.servidor.comunicado.ComunicadoDeDesligamento;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;

/**
 * Servidor de ranking do AçaíStudy (issue #34), baseado no Fazedor de Continhas.
 *
 * Uso: java ...Servidor [PORTA [HOST]]    (padrão: porta 3000, somente em localhost)
 * Para desativar, digite "desativar" no console.
 */
public class Servidor
{
    public static final String PORTA_PADRAO = "3000";

    public static void main (String[] args)
    {
        if (args.length > 2)
        {
            System.err.println ("Uso esperado: java Servidor [PORTA [HOST]]\n");
            return;
        }

        String porta = args.length >= 1 ? args[0] : PORTA_PADRAO;
        String host  = args.length == 2 ? args[1] : null;

        ArrayList<Parceiro> usuarios = new ArrayList<Parceiro> ();

        try
        {
            new AceitadoraDeConexao (porta, host, usuarios).start ();
        }
        catch (Exception erro)
        {
            System.err.println ("Escolha uma porta apropriada e liberada para uso!\n");
            return;
        }

        BufferedReader teclado = new BufferedReader (new InputStreamReader (System.in));

        System.out.println ("O servidor esta ativo na porta " + porta + "! Para desativa-lo,");
        System.out.println ("use o comando \"desativar\"\n");

        for (;;)
        {
            String comando = null;

            try
            {
                System.out.print ("> ");
                comando = teclado.readLine ();
            }
            catch (Exception erro)
            {}

            if (comando == null)
            {
                // Sem console (ex.: rodando em segundo plano): continua ativo até o processo ser encerrado.
                try { Thread.sleep (Long.MAX_VALUE); } catch (InterruptedException erro) {}
                continue;
            }

            if (comando.trim ().equalsIgnoreCase ("desativar"))
            {
                synchronized (usuarios)
                {
                    ComunicadoDeDesligamento comunicadoDeDesligamento = new ComunicadoDeDesligamento ();

                    for (Parceiro usuario : usuarios)
                    {
                        try
                        {
                            usuario.receba (comunicadoDeDesligamento);
                            usuario.adeus ();
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
