/** O servidor avisa os clientes conectados que está sendo desativado. */
public class ComunicadoDeDesligamento extends Comunicado
{
    @Override
    public String tipo ()
    {
        return "comunicadoDeDesligamento";
    }

    @Override
    protected Objeto campos ()
    {
        return new Objeto ();
    }
}
