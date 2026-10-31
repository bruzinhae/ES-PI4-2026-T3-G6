package br.faculdade.acaistudy.servidor.comunicado;

import java.util.Map;

/** O cliente avisa que vai encerrar a conexão. */
public class PedidoParaSair extends Comunicado
{
    public String tipo ()
    {
        return "pedidoParaSair";
    }

    protected Map<String, Object> campos ()
    {
        return Map.of ();
    }
}
