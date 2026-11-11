/** Resposta a um comunicado inválido. A conexão continua aberta (exceto se a mensagem era grande demais). */
public class Erro extends Comunicado
{
    private String mensagem;

    public Erro (String mensagem) throws Exception
    {
        if (mensagem == null)
            throw new Exception ("Mensagem ausente");

        this.mensagem = mensagem;
    }

    @Override
    public String tipo ()
    {
        return "erro";
    }

    @Override
    protected Objeto campos ()
    {
        Objeto objeto = new Objeto ();
        objeto.guarde ("mensagem", this.mensagem);
        return objeto;
    }

    @Override
    public String toString ()
    {
        return this.mensagem;
    }
}
