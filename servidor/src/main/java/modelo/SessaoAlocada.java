// Guilherme Domingues de Sousa - 22013871
package modelo;

import json.*;
import java.time.*;

// Sessao de estudo reservada pela alocacao: qual tarefa, em que espaco, de quando
// ate quando, e quantos minutos ainda faltam da tarefa
public class SessaoAlocada
{
    // espaco em que a sessao foi colocada
    private String         espacoId;
    // tarefa estudada na sessao
    private String         tarefaId;
    private OffsetDateTime inicio;
    private OffsetDateTime fim;
    // duracao da sessao
    private int            minutos;
    private int            minutosRestantes; // o que falta da tarefa depois desta sessao
    // nota do candidato escolhido e as partes dela
    private double         nota;
    private double         urgencia;
    private double         importancia;
    private double         encaixe;

    // Guarda os valores ja calculados (a nota vem do Candidato escolhido)
    public SessaoAlocada (String espacoId, String tarefaId, OffsetDateTime inicio,
                          OffsetDateTime fim, int minutos, int minutosRestantes, double nota,
                          double urgencia, double importancia, double encaixe)
    {
        this.espacoId         = espacoId;
        this.tarefaId         = tarefaId;
        this.inicio           = inicio;
        this.fim              = fim;
        this.minutos          = minutos;
        this.minutosRestantes = minutosRestantes;
        this.nota             = nota;
        this.urgencia         = urgencia;
        this.importancia      = importancia;
        this.encaixe          = encaixe;
    }

    // Devolve tarefa id
    public String getTarefaId ()
    {
        return this.tarefaId;
    }

    // Devolve fim
    public OffsetDateTime getFim ()
    {
        return this.fim;
    }

    // Devolve minutos
    public int getMinutos ()
    {
        return this.minutos;
    }

    // Devolve uma copia mais longa, usada ao juntar duas sessoes seguidas da mesma tarefa
    public SessaoAlocada estendida (int minutosExtras, int novosMinutosRestantes)
    {
        OffsetDateTime novoFim = this.fim.plusMinutes (minutosExtras);

        return new SessaoAlocada (this.espacoId, this.tarefaId, this.inicio, novoFim,
                                  this.minutos + minutosExtras, novosMinutosRestantes,
                                  this.nota, this.urgencia, this.importancia, this.encaixe);
    }

    // Escreve o objeto em JSON; o Parceiro envia esse texto ao cliente
    @Override
    public String toString ()
    {
        return "{\"espacoId\":"        + EscritorDeJson.texto (this.espacoId) +
               ",\"tarefaId\":"        + EscritorDeJson.texto (this.tarefaId) +
               ",\"inicio\":"          + EscritorDeJson.texto (this.inicio.toString ()) +
               ",\"fim\":"             + EscritorDeJson.texto (this.fim.toString ()) +
               ",\"minutos\":"         + this.minutos +
               ",\"minutosRestantes\":" + this.minutosRestantes +
               ",\"nota\":"            + this.nota +
               ",\"urgencia\":"        + this.urgencia +
               ",\"importancia\":"     + this.importancia +
               ",\"encaixe\":"         + this.encaixe + "}";
    }
}
