public class Erro extends Comunicado
{
    private static final long serialVersionUID = 1L;

    private String mensagem;

    public Erro (String mensagem)
    {
        this.mensagem = mensagem;
    }

    public String toString ()
    {
        return this.mensagem;
    }
}
