// Guilherme Domingues de Sousa - 22013871
package comunicado;

import json.*;
import modelo.*;
import java.time.*;
import java.util.*;

// Pedido para priorizar as metas do usuario e propor datas para os marcos da
// meta de maior prioridade. Montado a partir do JSON enviado pelo backend.
public class PedidoDeMetas extends Comunicado
{
    // instante do pedido: base para prazos e urgencia
    private OffsetDateTime  agora;
    // metas do usuario a priorizar
    private ArrayList<Meta> metas = new ArrayList<Meta> ();
    private int             quantidadeDeMarcos; // marcos novos a propor, de 1 a 5

    // Le "agora", "quantidadeDeMarcos" e a lista "metas" do JSON recebido
    public PedidoDeMetas (ObjetoJson json) throws Exception
    {
        this.agora              = json.getDataHora ("agora");
        this.quantidadeDeMarcos = json.getInteiro ("quantidadeDeMarcos");

        for (ObjetoJson meta : json.getObjetos ("metas"))
            this.metas.add (new Meta (meta));
    }

    // Devolve agora
    public OffsetDateTime getAgora ()
    {
        return this.agora;
    }

    // Devolve metas
    public ArrayList<Meta> getMetas ()
    {
        return this.metas;
    }

    // Devolve quantidade de marcos
    public int getQuantidadeDeMarcos ()
    {
        return this.quantidadeDeMarcos;
    }
}
