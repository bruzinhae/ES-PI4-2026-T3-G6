package br.faculdade.acaistudy.servidor.ranking;

import br.faculdade.acaistudy.servidor.comunicado.PedidoDeRanking;
import br.faculdade.acaistudy.servidor.modelo.Alocacao;
import br.faculdade.acaistudy.servidor.modelo.Candidato;
import br.faculdade.acaistudy.servidor.modelo.EspacoLivre;
import br.faculdade.acaistudy.servidor.modelo.Preferencias;
import br.faculdade.acaistudy.servidor.modelo.SessaoAlocada;
import br.faculdade.acaistudy.servidor.modelo.Tarefa;
import br.faculdade.acaistudy.servidor.modelo.TarefaSemAlocacao;

import java.time.Duration;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Decide, a partir do ranking, qual tarefa vai em qual horário, sem repetir tempo nem sobrepor sessões.
 *
 * O ranking sozinho devolve, para cada espaço livre, uma lista de candidatas, e a mesma tarefa pode ser a
 * primeira de vários espaços. Esta classe resolve isso com um algoritmo guloso:
 *
 *   1. percorre os espaços em ordem cronológica;
 *   2. dentro de cada espaço, escolhe a melhor candidata (a mesma nota do ranking) entre as tarefas que
 *      ainda têm minutos pendentes, e reserva uma sessão para ela;
 *   3. desconta os minutos e repete no resto do espaço, até acabar o espaço ou as tarefas;
 *   4. passa ao próximo espaço.
 *
 * Preferências do usuário que entram aqui:
 *   - duracaoMinutos: tamanho máximo de cada sessão (uma tarefa grande vira várias sessões);
 *   - antifadiga: com ela ligada, há uma pausa de 10 minutos entre sessões seguidas no mesmo espaço; desligada,
 *     sessões seguidas da mesma tarefa são juntadas em uma só.
 *
 * É uma classe sem estado: pode ser usada por várias threads ao mesmo tempo.
 */
public final class AlocadoraDeSessoes
{
    public static final int PAUSA_ANTIFADIGA_MINUTOS = 10;

    // Proteção: um pedido nunca gera mais sessões que isto (a alocação para e marca "alocacaoTruncada").
    public static final int MAXIMO_DE_SESSOES = 2000;

    private static final int MINUTOS_MINIMOS_DO_ESPACO = 15;

    private AlocadoraDeSessoes () {}

    public static Alocacao alocar (PedidoDeRanking pedido)
    {
        Preferencias preferencias = pedido.preferencias ();
        Instant agora = pedido.agora ();
        int pausa = preferencias.antifadiga () ? PAUSA_ANTIFADIGA_MINUTOS : 0;

        // Tarefas que ainda pedem tempo (concluídas ficam de fora; id repetido vale só o primeiro).
        Map<String, Tarefa> ativas = new LinkedHashMap<String, Tarefa> ();
        for (Tarefa tarefa : pedido.tarefas ())
            if (!tarefa.concluida ())
                ativas.putIfAbsent (tarefa.id (), tarefa);

        Map<String, Integer> restante = new HashMap<String, Integer> ();
        Map<String, Integer> pedido_  = new HashMap<String, Integer> ();
        for (Tarefa tarefa : ativas.values ())
        {
            int necessarios = CalculadoraDeRanking.minutosNecessarios (tarefa, preferencias);
            restante.put (tarefa.id (), necessarios);
            pedido_.put (tarefa.id (), necessarios);
        }

        Set<String> foiCandidata = new HashSet<String> ();
        Comparator<Candidato> ordem = CalculadoraDeRanking.comparadorDeCandidatos (new ArrayList<Tarefa> (ativas.values ()));

        List<EspacoLivre> espacos = new ArrayList<EspacoLivre> (pedido.espacos ());
        espacos.sort (Comparator.comparing ((EspacoLivre espaco) -> espaco.inicio ().toInstant ()).thenComparing (EspacoLivre::id));

        List<SessaoAlocada> sessoes = new ArrayList<SessaoAlocada> ();
        Instant ocupadoAte = null;
        boolean truncada = false;

        for (EspacoLivre espaco : espacos)
        {
            if (truncada)
                break;

            OffsetDateTime cursor = espaco.inicio ();

            // Se espaços enviados se sobrepõem, nunca reserva o mesmo minuto duas vezes.
            if (ocupadoAte != null && ocupadoAte.isAfter (cursor.toInstant ()))
                cursor = ocupadoAte.atOffset (espaco.inicio ().getOffset ());

            int indiceDaUltima = -1; // última sessão reservada neste espaço

            for (;;)
            {
                int disponiveis = (int) Duration.between (cursor, espaco.fim ()).toMinutes ();

                if (disponiveis < MINUTOS_MINIMOS_DO_ESPACO)
                    break;

                if (sessoes.size () >= MAXIMO_DE_SESSOES)
                {
                    truncada = true;
                    break;
                }

                EspacoLivre aindaLivre = new EspacoLivre (espaco.id (), cursor, espaco.fim ());
                Candidato melhor = null;

                for (Tarefa tarefa : ativas.values ())
                {
                    int falta = restante.get (tarefa.id ());

                    if (falta <= 0)
                        continue;

                    Candidato candidato = CalculadoraDeRanking.avaliar (tarefa, aindaLivre, agora, preferencias,
                                                                         falta, preferencias.duracaoMinutos ());
                    if (candidato == null)
                        continue;

                    foiCandidata.add (tarefa.id ());

                    if (melhor == null || ordem.compare (candidato, melhor) < 0)
                        melhor = candidato;
                }

                if (melhor == null)
                    break; // ninguém serve para o que sobrou deste espaço

                int minutos = melhor.minutosNoEspaco ();
                int faltaDepois = restante.get (melhor.tarefaId ()) - minutos;
                restante.put (melhor.tarefaId (), faltaDepois);

                OffsetDateTime fimDaSessao = cursor.plusMinutes (minutos);
                SessaoAlocada ultima = indiceDaUltima >= 0 ? sessoes.get (indiceDaUltima) : null;

                if (pausa == 0 && ultima != null && ultima.tarefaId ().equals (melhor.tarefaId ())
                    && ultima.fim ().toInstant ().equals (cursor.toInstant ()))
                    sessoes.set (indiceDaUltima, ultima.estendida (minutos, faltaDepois));
                else
                {
                    sessoes.add (new SessaoAlocada (espaco.id (), melhor.tarefaId (), cursor, fimDaSessao, minutos, faltaDepois,
                                                    melhor.nota (), melhor.urgencia (), melhor.importancia (), melhor.encaixe ()));
                    indiceDaUltima = sessoes.size () - 1;
                }

                ocupadoAte = fimDaSessao.toInstant ();
                cursor = fimDaSessao.plusMinutes (pausa);
            }
        }

        return new Alocacao (sessoes, tarefasSemAlocacao (ativas, restante, pedido_, foiCandidata, espacos.isEmpty ()), truncada);
    }

    // Tarefas que ainda têm minutos pendentes no fim, com o motivo.
    private static List<TarefaSemAlocacao> tarefasSemAlocacao (Map<String, Tarefa> ativas, Map<String, Integer> restante,
                                                               Map<String, Integer> pedidos, Set<String> foiCandidata,
                                                               boolean semEspacos)
    {
        List<TarefaSemAlocacao> sem = new ArrayList<TarefaSemAlocacao> ();

        for (Tarefa tarefa : ativas.values ())
        {
            int falta = restante.get (tarefa.id ());

            if (falta <= 0)
                continue;

            String motivo;
            if (falta < pedidos.get (tarefa.id ()))
                motivo = "alocacao_parcial";
            else if (semEspacos)
                motivo = "sem_espacos";
            else if (foiCandidata.contains (tarefa.id ()))
                motivo = "espacos_insuficientes";
            else
                motivo = "nenhum_espaco_antes_do_prazo";

            sem.add (new TarefaSemAlocacao (tarefa.id (), motivo, falta));
        }

        return sem;
    }
}
