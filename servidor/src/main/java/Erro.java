public class Erro extends Comunicado
{
    private String mensagem;

    public Erro (String mensagem)
    {
        this.mensagem = mensagem;
    }

    @Override
    public String toString ()
    {
        return "{\"tipo\":\"erro\",\"mensagem\":" + EscritorDeJson.texto (this.mensagem) + "}";
    }
}
