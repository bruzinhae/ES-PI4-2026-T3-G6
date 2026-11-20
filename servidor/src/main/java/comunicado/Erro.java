// Guilherme Domingues de Sousa - 22013871
package comunicado;

import json.*;

// Resposta enviada quando um pedido nao pode ser atendido; leva a mensagem do motivo
public class Erro extends Comunicado
{
    // motivo da falha, mostrado ao cliente
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
