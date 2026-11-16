package modelo;

import json.*;
import java.time.*;

public class EspacoLivre implements Comparable<EspacoLivre>
{
    private String         id;
    private OffsetDateTime inicio;
    private OffsetDateTime fim;

    public EspacoLivre (String id, OffsetDateTime inicio, OffsetDateTime fim)
    {
        this.id     = id;
        this.inicio = inicio;
        this.fim    = fim;
    }

    public EspacoLivre (ObjetoJson json) throws Exception
    {
        this.id     = json.getTexto    ("id");
        this.inicio = json.getDataHora ("inicio");
        this.fim    = json.getDataHora ("fim");
    }

    public String getId ()
    {
        return this.id;
    }

    public OffsetDateTime getInicio ()
    {
        return this.inicio;
    }

    public OffsetDateTime getFim ()
    {
        return this.fim;
    }

    public int getMinutos ()
    {
        return (int) Duration.between (this.inicio, this.fim).toMinutes ();
    }

    @Override
    public int compareTo (EspacoLivre esp)
    {
        if (!this.inicio.isEqual (esp.inicio))
            return this.inicio.isBefore (esp.inicio) ? -1 : 1;

        return this.id.compareTo (esp.id);
    }
}
