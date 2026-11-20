// Guilherme Domingues de Sousa - 22013871
package modelo;

import json.*;
import java.time.*;

// Meta do usuario (geral, disciplina, habito ou projeto) com prioridade, progresso
// de 0 a 100 e prazo opcional
public class Meta
{
    // id da meta, definido pelo backend
    private String         id;
    private String         tipo;       // geral, disciplina, habito ou projeto
    private String         prioridade; // baixa, media ou alta
    private int            progresso;  // de 0 a 100
    private OffsetDateTime prazo;      // null se a meta nao tem prazo

    // Le os campos do JSON recebido
    public Meta (ObjetoJson json) throws Exception
    {
        this.id         = json.getTexto          ("id");
        this.tipo       = json.getTexto          ("tipo");
        this.prioridade = json.getTexto          ("prioridade");
        this.progresso  = json.getInteiro        ("progresso");
        this.prazo      = json.getDataHoraOuNula ("prazo");
    }

    // Devolve id
    public String getId ()
    {
        return this.id;
    }

    // Devolve prioridade
    public String getPrioridade ()
    {
        return this.prioridade;
    }

    // Devolve progresso
    public int getProgresso ()
    {
        return this.progresso;
    }

    // Devolve prazo
    public OffsetDateTime getPrazo ()
    {
        return this.prazo;
    }

    // Habito nao tem marcos com datas
    public boolean habito ()
    {
        return "habito".equals (this.tipo);
    }
}
