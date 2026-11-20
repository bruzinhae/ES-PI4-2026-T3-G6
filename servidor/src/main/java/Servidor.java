import comunicado.*;
import conexao.*;
import java.util.*;

// Ponto de entrada do servidor de ranking: abre a porta, aceita clientes e
// fica lendo comandos do teclado (o comando "desativar" encerra tudo).
public class Servidor
{
	// Porta usada quando nenhuma e informada na linha de comando
	public static String PORTA_PADRAO = "3000";
	
    // Uso: java Servidor [PORTA]. Cria a lista compartilhada de clientes conectados,
    // liga a thread que aceita conexoes e entra no laco de comandos.
    public static void main (String[] args)
    {
        if (args.length>1)
        {
            System.err.println ("Uso esperado: java Servidor [PORTA]\n");
            return;
        }

        // sem argumento usa a porta padrao
        String porta=Servidor.PORTA_PADRAO;
        
        if (args.length==1)
            porta = args[0];

        // lista compartilhada pelas threads; sempre acessada dentro de synchronized
        ArrayList<Parceiro> usuarios =
        new ArrayList<Parceiro> ();

        // a aceitadora roda em outra thread e fica esperando clientes
        AceitadoraDeConexao aceitadoraDeConexao=null;
        try
        {
            aceitadoraDeConexao =
            new AceitadoraDeConexao (porta, usuarios);
            // start() liga a thread da aceitadora: ela passa a rodar em paralelo a este laco
            aceitadoraDeConexao.start();
        }
        catch (Exception erro)
        {
            System.err.println ("Escolha uma porta apropriada e liberada para uso!\n");
            return;
        }

        // laco do console: le um comando por vez ate alguem digitar "desativar"
        for(;;)
        {
            System.out.println ("O servidor esta ativo! Para desativa-lo,");
            System.out.println ("use o comando \"desativar\"\n");
            System.out.print   ("> ");

            String comando=null;
            try
            {
                // espera o operador digitar uma linha no console (Teclado e a classe do professor)
                comando = Teclado.getUmString();
            }
            catch (Exception erro)
            {}

            if (comando.toLowerCase().equals("desativar"))
            {
                // avisa cada cliente conectado do desligamento e fecha a conexao dele
                synchronized (usuarios)
                {
					ComunicadoDeDesligamento comunicadoDeDesligamento =
                    new ComunicadoDeDesligamento ();
                    
                    for (Parceiro usuario:usuarios)
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
                // encerra o programa inteiro, inclusive as threads dos clientes
                System.exit(0);
            }
            else
                System.err.println ("Comando invalido!\n");
        }
    }
}
