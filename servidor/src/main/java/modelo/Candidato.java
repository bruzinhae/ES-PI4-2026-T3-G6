// Guilherme Domingues de Sousa - 22013871
package modelo;

import json.*;
import java.time.*;

// Uma tarefa recomendada para um espaco livre, com a nota e as tres partes dela
// (urgencia, importancia e encaixe). Comparable: a de maior nota vem primeiro.
public class Candidato implements Comparable<Candidato>
{
    // id da tarefa recomendada
    private String         tarefaId;
    // nota final, de 0 a 1
    private double         nota;
    // quanto da tarefa cabe neste espaco
    private int            minutosNoEspaco;
    private boolean        parcial; // a tarefa nao cabe inteira no espaco
    // as tres partes da nota, cada uma de 0 a 1
    private double         urgencia;
    private double         importancia;
    private double         encaixe;
    private OffsetDateTime prazo;      // so para desempatar
    private int            prioridade; // so para desempatar

    // Guarda os valores ja calculados; prazo e prioridade so servem para desempatar
    public Candidato (String tarefaId, double nota, int minutosNoEspaco, boolean parcial,
                      double urgencia, double importancia, double encaixe,
                      OffsetDateTime prazo, int prioridade)
    {
        this.tarefaId        = tarefaId;
        this.nota            = nota;
        this.minutosNoEspaco = minutosNoEspaco;
        this.parcial         = parcial;
        this.urgencia        = urgencia;
        this.importancia     = importancia;
        this.encaixe         = encaixe;
        this.prazo           = prazo;
        this.prioridade      = prioridade;
    }

    // Devolve tarefa id
    public String getTarefaId ()
    {
        return this.tarefaId;
    }

    // Devolve nota
    public double getNota ()
    {
        return this.nota;
    }

    // Devolve minutos no espaco
    public int getMinutosNoEspaco ()
    {
        return this.minutosNoEspaco;
    }

    // Devolve urgencia
    public double getUrgencia ()
    {
        return this.urgencia;
    }

    // Devolve importancia
    public double getImportancia ()
    {
        return this.importancia;
    }

    // Devolve encaixe
    public double getEncaixe ()
    {
        return this.encaixe;
    }

    // Ordem: nota maior primeiro; empate: prazo mais proximo (sem prazo por ultimo),
    // depois prioridade maior e, por fim, o id
    @Override
    public int compareTo (Candidato can) // nota maior primeiro; depois prazo, prioridade e id
    {
        if (this.nota!=can.nota)
            return Double.compare (can.nota, this.nota);

        if (this.prazo==null && can.prazo!=null) return  1; // sem prazo por ultimo
        if (this.prazo!=null && can.prazo==null) return -1;
        if (this.prazo!=null && !this.prazo.isEqual (can.prazo))
            return this.prazo.isBefore (can.prazo) ? -1 : 1;

        if (this.prioridade!=can.prioridade)
            return can.prioridade - this.prioridade;

        return this.tarefaId.compareTo (can.tarefaId);
    }

    // Escreve o objeto em JSON; o Parceiro envia esse texto ao cliente
    @Override
    public String toString ()
    {
        return "{\"tarefaId\":"      + EscritorDeJson.texto (this.tarefaId) +
               ",\"nota\":"          + this.nota +
               ",\"minutosNoEspaco\":" + this.minutosNoEspaco +
               ",\"parcial\":"       + this.parcial +
               ",\"urgencia\":"      + this.urgencia +
               ",\"importancia\":"   + this.importancia +
               ",\"encaixe\":"       + this.encaixe + "}";
    }
}
