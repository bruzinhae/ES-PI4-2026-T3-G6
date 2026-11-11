/** O cliente avisa que vai encerrar a conexão. */
public class PedidoParaSair extends Comunicado
{
    @Override
    public String tipo ()
    {
        return "pedidoParaSair";
    }

    @Override
    protected Objeto campos ()
    {
        return new Objeto ();
    }
}
