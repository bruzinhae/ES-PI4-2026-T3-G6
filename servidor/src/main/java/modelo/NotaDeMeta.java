// Guilherme Domingues de Sousa - 22013871
package modelo;

import json.*;
import java.time.*;

// Nota calculada para uma meta e as partes dela (urgencia, lacuna e importancia).
// Comparable: a meta de maior nota vem primeiro.
public class NotaDeMeta implements Comparable<NotaDeMeta>
{
    // id da meta avaliada
    private String         metaId;
    // nota final, de 0 a 1
    private double         nota;
    // partes da nota: urgencia, lacuna (o que falta do progresso) e importancia
    private double         urgencia;
    private double         lacuna;
    private double         importancia;
    // true se o prazo ja passou
    private boolean        atrasada;
    private OffsetDateTime prazo;            // so para desempatar
    private double         pesoDaPrioridade; // so para desempatar

    // Guarda os valores ja calculados; prazo e peso so servem para desempatar
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

    // Devolve meta id
    public String getMetaId ()
    {
        return this.metaId;
    }

    // Ordem: nota maior primeiro; empate: prazo mais proximo (sem prazo por ultimo),
    // depois peso da prioridade maior e, por fim, o id
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

    // Escreve o objeto em JSON; o Parceiro envia esse texto ao cliente
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
