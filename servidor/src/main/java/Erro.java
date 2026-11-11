/** Resposta a um comunicado inválido. A conexão continua aberta. */
public class Erro extends Comunicado
{
    private static final long serialVersionUID = 1L;

    private String mensagem;

    public Erro (String mensagem) throws Exception
    {
        if (mensagem == null)
            throw new Exception ("Mensagem ausente");

        this.mensagem = mensagem;
    }

    public String getMensagem ()
    {
        return this.mensagem;
    }

    @Override
    public String toString ()
    {
        return this.mensagem;
    }
}
