package br.faculdade.acaistudy.servidor.comunicado;

import java.util.Map;

/** O servidor avisa os clientes conectados que está sendo desativado. */
public class ComunicadoDeDesligamento extends Comunicado
{
    public String tipo ()
    {
        return "comunicadoDeDesligamento";
    }

    protected Map<String, Object> campos ()
    {
        return Map.of ();
    }
}
