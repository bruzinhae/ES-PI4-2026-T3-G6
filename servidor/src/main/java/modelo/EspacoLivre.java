// Guilherme Domingues de Sousa - 22013871
package modelo;

import json.*;
import java.time.*;

// Intervalo livre da grade semanal do usuario (inicio, fim e id). Comparable: ordena
// pelo horario de inicio e, se empatar, pelo id.
public class EspacoLivre implements Comparable<EspacoLivre>
{
    // id do espaco, definido pelo backend
    private String         id;
    // OffsetDateTime: data e hora com fuso (ex.: 2026-11-12T15:00:00-03:00)
    private OffsetDateTime inicio;
    private OffsetDateTime fim;

    // Construtor direto, usado nos testes e nos calculos
    public EspacoLivre (String id, OffsetDateTime inicio, OffsetDateTime fim)
    {
        this.id     = id;
        this.inicio = inicio;
        this.fim    = fim;
    }

    // Le id, inicio e fim do JSON recebido
    public EspacoLivre (ObjetoJson json) throws Exception
    {
        this.id     = json.getTexto    ("id");
        this.inicio = json.getDataHora ("inicio");
        this.fim    = json.getDataHora ("fim");
    }

    // Devolve id
    public String getId ()
    {
        return this.id;
    }

    // Devolve inicio
    public OffsetDateTime getInicio ()
    {
        return this.inicio;
    }

    // Devolve fim
    public OffsetDateTime getFim ()
    {
        return this.fim;
    }

    // Duracao do espaco em minutos inteiros
    public int getMinutos ()
    {
        return (int) Duration.between (this.inicio, this.fim).toMinutes ();
    }

    // Ordem cronologica; empate pelo id
    @Override
    public int compareTo (EspacoLivre esp)
    {
        if (!this.inicio.isEqual (esp.inicio))
            return this.inicio.isBefore (esp.inicio) ? -1 : 1;

        return this.id.compareTo (esp.id);
    }
}
