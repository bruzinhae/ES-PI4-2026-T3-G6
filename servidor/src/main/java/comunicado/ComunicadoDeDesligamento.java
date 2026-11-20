package comunicado;

// Aviso enviado a todos os clientes quando o servidor e desativado
public class ComunicadoDeDesligamento extends Comunicado
{
    @Override
    public String toString ()
    {
        return "{\"tipo\":\"comunicadoDeDesligamento\"}";
    }
}
