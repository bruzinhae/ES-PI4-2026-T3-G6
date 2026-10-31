package br.faculdade.acaistudy.servidor.comunicado;

import java.util.LinkedHashMap;
import java.util.Map;

/** Resposta a um comunicado inválido. A conexão continua aberta (exceto se a mensagem era grande demais). */
public class Erro extends Comunicado
{
    private final String mensagem;

    public Erro (String mensagem) throws Exception
    {
        if (mensagem == null)
            throw new Exception ("Mensagem ausente");

        this.mensagem = mensagem;
    }

    public String tipo ()
    {
        return "erro";
    }

    protected Map<String, Object> campos ()
    {
        Map<String, Object> mapa = new LinkedHashMap<String, Object> ();
        mapa.put ("mensagem", this.mensagem);
        return mapa;
    }
}
