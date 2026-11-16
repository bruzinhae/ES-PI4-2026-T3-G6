package modelo;

import json.*;
import java.time.*;

public class Meta
{
    private String         id;
    private String         tipo;       // geral, disciplina, habito ou projeto
    private String         prioridade; // baixa, media ou alta
    private int            progresso;  // de 0 a 100
    private OffsetDateTime prazo;      // null se a meta nao tem prazo

    public Meta (ObjetoJson json) throws Exception
    {
        this.id         = json.getTexto          ("id");
        this.tipo       = json.getTexto          ("tipo");
        this.prioridade = json.getTexto          ("prioridade");
        this.progresso  = json.getInteiro        ("progresso");
        this.prazo      = json.getDataHoraOuNula ("prazo");
    }

    public String getId ()
    {
        return this.id;
    }

    public String getPrioridade ()
    {
        return this.prioridade;
    }

    public int getProgresso ()
    {
        return this.progresso;
    }

    public OffsetDateTime getPrazo ()
    {
        return this.prazo;
    }

    public boolean habito ()
    {
        return "habito".equals (this.tipo);
    }
}
