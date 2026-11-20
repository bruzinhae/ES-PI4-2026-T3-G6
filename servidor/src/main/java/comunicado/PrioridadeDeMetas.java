// Guilherme Domingues de Sousa - 22013871
package comunicado;

import json.*;
import modelo.*;
import java.util.*;

// Resposta ao PedidoDeMetas: metas ordenadas da mais para a menos urgente, a meta
// em foco e as datas sugeridas para os marcos dela.
public class PrioridadeDeMetas extends Comunicado
{
    private ArrayList<NotaDeMeta> ranking;        // da mais para a menos urgente
    private String                foco;           // id da meta de maior nota (null sem metas)
    private ArrayList<String>     datasDosMarcos; // AAAA-MM-DD, so da meta foco

    // Guarda o resultado ja calculado pela CalculadoraDeMetas
    public PrioridadeDeMetas (ArrayList<NotaDeMeta> ranking, String foco,
                              ArrayList<String> datasDosMarcos)
    {
        this.ranking        = ranking;
        this.foco           = foco;
        this.datasDosMarcos = datasDosMarcos;
    }

    // Escreve a resposta em JSON, que e o que o Parceiro envia ao cliente
    @Override
    public String toString ()
    {
        return "{\"tipo\":\"prioridadeDeMetas\",\"ranking\":" + EscritorDeJson.lista (this.ranking) +
               ",\"foco\":" + EscritorDeJson.texto (this.foco) +
               ",\"datasDosMarcos\":" + EscritorDeJson.listaDeTextos (this.datasDosMarcos) + "}";
    }
}
