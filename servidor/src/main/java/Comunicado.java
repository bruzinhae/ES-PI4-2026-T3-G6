/**
 * Tudo o que trafega entre o servidor e o cliente (o backend Node) é um Comunicado.
 *
 * No exemplo do professor (Fazedor de Continhas) os comunicados são objetos Java
 * serializados. Aqui a hierarquia é a mesma (PedidoDeRanking, Ranking, PedidoDeMetas, PrioridadeDeMetas, PedidoParaSair,
 * ComunicadoDeDesligamento, Erro), mas cada comunicado viaja como UMA LINHA de JSON, porque
 * o Node não lê a serialização de objetos do Java. O campo "tipo" faz o papel do instanceof.
 */
public abstract class Comunicado
{
    public abstract String tipo ();

    protected abstract Objeto campos ();

    public String paraJson ()
    {
        Objeto objeto = new Objeto ();
        objeto.guarde ("tipo", tipo ());

        Objeto campos = campos ();
        for (int i = 0; i < campos.getQuantidade (); i++)
            objeto.guarde (campos.getNome (i), campos.getValor (i));

        return Json.escrever (objeto);
    }

    // Converte uma linha de JSON no comunicado correspondente. Só os tipos que o cliente envia.
    public static Comunicado deJson (String linha) throws Exception
    {
        Objeto objeto = Campos.comoObjeto (Json.ler (linha), "comunicado");
        String tipo = Campos.texto (objeto, "tipo", true, null);

        switch (tipo)
        {
            case "pedidoDeRanking":
                return PedidoDeRanking.deObjeto (objeto);
            case "pedidoDeMetas":
                return PedidoDeMetas.deObjeto (objeto);
            case "pedidoParaSair":
                return new PedidoParaSair ();
            default:
                throw new Exception ("Tipo de comunicado desconhecido: " + tipo);
        }
    }
}
