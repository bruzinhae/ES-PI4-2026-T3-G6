/**
 * Fica de olho nos comunicados que chegam do servidor e, se for o de desligamento, avisa o usuario
 * e encerra o cliente. Igual a do Fazedor de Continhas.
 */
public class TratadoraDeComunicadoDeDesligamento extends Thread
{
    private Parceiro servidor;

    public TratadoraDeComunicadoDeDesligamento (Parceiro servidor) throws Exception
    {
        if (servidor==null)
            throw new Exception ("Servidor ausente");

        this.servidor = servidor;
    }

    @Override
    public void run ()
    {
        for(;;)
        {
            try
            {
                if (this.servidor.espie() instanceof ComunicadoDeDesligamento)
                {
                    System.out.println ("\nO servidor vai ser desligado agora;");
                    System.err.println ("volte mais tarde!\n");
                    System.exit(0);
                }
            }
            catch (Exception erro)
            {
                System.out.println ("\nA conexao com o servidor foi encerrada;");
                System.err.println ("volte mais tarde!\n");
                System.exit(0);
            }
        }
    }
}
