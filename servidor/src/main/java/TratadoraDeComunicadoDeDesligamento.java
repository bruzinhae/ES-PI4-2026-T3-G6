/**
 * Fica de olho nas linhas que chegam do servidor e, se for o comunicado de desligamento,
 * avisa o usuario e encerra o cliente. Igual a do Fazedor de Continhas, mas os comunicados
 * chegam como linhas de JSON (o campo "tipo" faz o papel do instanceof).
 */
public class TratadoraDeComunicadoDeDesligamento extends Thread
{
    private Parceiro servidor;

    public TratadoraDeComunicadoDeDesligamento (Parceiro servidor) throws Exception
    {
        if (servidor == null)
            throw new Exception ("Servidor ausente");

        this.servidor = servidor;
    }

    @Override
    public void run ()
    {
        for (;;)
        {
            try
            {
                String linha = this.servidor.espie ();

                if (linha == null)
                {
                    System.out.println ("\nO servidor encerrou a conexao;");
                    System.err.println ("volte mais tarde!\n");
                    System.exit (0);
                }

                if (Cliente.ehComunicadoDeDesligamento (linha))
                {
                    System.out.println ("\nO servidor vai ser desligado agora;");
                    System.err.println ("volte mais tarde!\n");
                    System.exit (0);
                }
            }
            catch (Exception erro)
            {}
        }
    }
}
