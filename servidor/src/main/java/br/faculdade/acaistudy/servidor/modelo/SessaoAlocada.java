package br.faculdade.acaistudy.servidor.modelo;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Uma sessão de estudo decidida pela alocação: qual tarefa, onde (espaço livre) e quando.
 *
 * @param minutosRestantes o que ainda falta da tarefa depois desta sessão (0 = a tarefa ficou completa)
 */
public record SessaoAlocada (String espacoId, String tarefaId, OffsetDateTime inicio, OffsetDateTime fim,
                             int minutos, int minutosRestantes, double nota,
                             double urgencia, double importancia, double encaixe)
{
    public Map<String, Object> paraMapa ()
    {
        Map<String, Object> composicao = new LinkedHashMap<String, Object> ();
        composicao.put ("urgencia", this.urgencia);
        composicao.put ("importancia", this.importancia);
        composicao.put ("encaixe", this.encaixe);

        Map<String, Object> mapa = new LinkedHashMap<String, Object> ();
        mapa.put ("espacoId", this.espacoId);
        mapa.put ("tarefaId", this.tarefaId);
        mapa.put ("inicio", DateTimeFormatter.ISO_OFFSET_DATE_TIME.format (this.inicio));
        mapa.put ("fim", DateTimeFormatter.ISO_OFFSET_DATE_TIME.format (this.fim));
        mapa.put ("minutos", this.minutos);
        mapa.put ("minutosRestantes", this.minutosRestantes);
        mapa.put ("nota", this.nota);
        mapa.put ("composicao", composicao);
        return mapa;
    }

    // Mesma sessão com mais minutos no fim (usada para juntar sessões seguidas da mesma tarefa).
    public SessaoAlocada estendida (int minutosExtras, int novosMinutosRestantes)
    {
        return new SessaoAlocada (this.espacoId, this.tarefaId, this.inicio, this.fim.plusMinutes (minutosExtras),
                                  this.minutos + minutosExtras, novosMinutosRestantes, this.nota,
                                  this.urgencia, this.importancia, this.encaixe);
    }
}
