package modelo;

import json.*;
import java.time.*;

public class NotaDeMeta implements Comparable<NotaDeMeta>
{
    private String         metaId;
    private double         nota;
    private double         urgencia;
    private double         lacuna;
    private double         importancia;
    private boolean        atrasada;
    private OffsetDateTime prazo;            // so para desempatar
    private double         pesoDaPrioridade; // so para desempatar

    public NotaDeMeta (String metaId, double nota, double urgencia, double lacuna,
                       double importancia, boolean atrasada, OffsetDateTime prazo,
                       double pesoDaPrioridade)
    {
        this.metaId           = metaId;
        this.nota             = nota;
        this.urgencia         = urgencia;
        this.lacuna           = lacuna;
        this.importancia      = importancia;
        this.atrasada         = atrasada;
        this.prazo            = prazo;
        this.pesoDaPrioridade = pesoDaPrioridade;
    }

    public String getMetaId ()
    {
        return this.metaId;
    }

    @Override
    public int compareTo (NotaDeMeta not) // nota maior primeiro; depois prazo, prioridade e id
    {
        if (this.nota!=not.nota)
            return Double.compare (not.nota, this.nota);

        if (this.prazo==null && not.prazo!=null) return  1; // sem prazo por ultimo
        if (this.prazo!=null && not.prazo==null) return -1;
        if (this.prazo!=null && !this.prazo.isEqual (not.prazo))
            return this.prazo.isBefore (not.prazo) ? -1 : 1;

        if (this.pesoDaPrioridade!=not.pesoDaPrioridade)
            return Double.compare (not.pesoDaPrioridade, this.pesoDaPrioridade);

        return this.metaId.compareTo (not.metaId);
    }

    @Override
    public String toString ()
    {
        return "{\"metaId\":"      + EscritorDeJson.texto (this.metaId) +
               ",\"nota\":"        + this.nota +
               ",\"urgencia\":"    + this.urgencia +
               ",\"lacuna\":"      + this.lacuna +
               ",\"importancia\":" + this.importancia +
               ",\"atrasada\":"    + this.atrasada + "}";
    }
}
