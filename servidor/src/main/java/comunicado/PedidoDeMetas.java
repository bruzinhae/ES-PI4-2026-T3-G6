package comunicado;

import json.*;
import modelo.*;
import java.time.*;
import java.util.*;

public class PedidoDeMetas extends Comunicado
{
    private OffsetDateTime  agora;
    private ArrayList<Meta> metas = new ArrayList<Meta> ();
    private int             quantidadeDeMarcos; // marcos novos a propor, de 1 a 5

    public PedidoDeMetas (ObjetoJson json) throws Exception
    {
        this.agora              = json.getDataHora ("agora");
        this.quantidadeDeMarcos = json.getInteiro ("quantidadeDeMarcos");

        for (ObjetoJson meta : json.getObjetos ("metas"))
            this.metas.add (new Meta (meta));
    }

    public OffsetDateTime getAgora ()
    {
        return this.agora;
    }

    public ArrayList<Meta> getMetas ()
    {
        return this.metas;
    }

    public int getQuantidadeDeMarcos ()
    {
        return this.quantidadeDeMarcos;
    }
}
