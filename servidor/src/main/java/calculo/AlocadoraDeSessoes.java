// Guilherme Domingues de Sousa - 22013871
package calculo;

import comunicado.*;
import modelo.*;
import java.time.*;
import java.util.*;

// Transforma os espacos livres e as tarefas pendentes em sessoes de estudo concretas.
// Algoritmo guloso: percorre os espacos em ordem de horario e, a cada vaga, escolhe
// a tarefa de maior nota (a mesma do ranking). Nao guarda estado entre pedidos.
public class AlocadoraDeSessoes
{
    // pausa entre sessoes seguidas quando a preferencia antifadiga esta ligada
    public static final int PAUSA_ANTIFADIGA_MINUTOS = 10;

    public static final int MAXIMO_DE_SESSOES = 2000; // por pedido; ao chegar aqui marca truncada

    // espaco menor que isso nao recebe sessao
    private static final int MINUTOS_MINIMOS_DO_ESPACO = 15;
    // limite de uma sessao quando duas seguidas da mesma tarefa sao juntadas
    private static final int DURACAO_MAXIMA_MINUTOS = 480;

    // Devolve a lista de sessoes alocadas e as tarefas que ficaram (total ou
    // parcialmente) sem horario, cada uma com o motivo.
    public static Alocacao alocar (PedidoDeRanking pedido)
    {
        Preferencias preferencias = pedido.getPreferencias ();
        OffsetDateTime agora = pedido.getAgora ();
        int duracao = preferencias.getDuracaoMinutos ();
        int pausa = preferencias.isAntifadiga () ? PAUSA_ANTIFADIGA_MINUTOS : 0;

        // so tarefas nao concluidas; id repetido vale apenas o primeiro
        ArrayList<Tarefa> ativas = new ArrayList<Tarefa> ();
        for (Tarefa tarefa : pedido.getTarefas ())
            if (!tarefa.concluida () &&
                AlocadoraDeSessoes.posicaoDoId (ativas, tarefa.getId ()) == -1)
                ativas.add (tarefa); // concluida fica de fora; id repetido vale so o primeiro

        // restante: minutos que ainda faltam; pedidos: minutos que a tarefa precisava no inicio
        int[] restante = new int [ativas.size ()];
        int[] pedidos  = new int [ativas.size ()];
        boolean[] foiCandidata = new boolean [ativas.size ()];

        for (int i = 0; i < ativas.size (); i++)
        {
            int necessarios =
            CalculadoraDeRanking.minutosNecessarios (ativas.get (i), preferencias);

            restante[i] = necessarios;
            pedidos[i]  = necessarios;
        }

        // ordena os espacos do mais cedo para o mais tarde (compareTo de EspacoLivre)
        ArrayList<EspacoLivre> espacos = new ArrayList<EspacoLivre> (pedido.getEspacos ());
        Collections.sort (espacos);

        ArrayList<SessaoAlocada> sessoes = new ArrayList<SessaoAlocada> ();
        // fim da ultima sessao: evita usar o mesmo horario em espacos que se sobrepoem
        OffsetDateTime ocupadoAte = null;
        boolean truncada = false;

        // para cada espaco, vai reservando sessoes enquanto couber alguma tarefa
        for (EspacoLivre espaco : espacos)
        {
            if (truncada)
                break;

            OffsetDateTime cursor = espaco.getInicio ();

            if (ocupadoAte != null && ocupadoAte.isAfter (cursor))
                cursor = ocupadoAte.withOffsetSameInstant (espaco.getInicio ().getOffset ()); // espacos que se sobrepoem

            int indiceDaUltima = -1; // ultima sessao reservada neste espaco

            for (;;)
            {
                int disponiveis = (int) Duration.between (cursor, espaco.getFim ()).toMinutes ();

                if (disponiveis < MINUTOS_MINIMOS_DO_ESPACO)
                    break;

                if (sessoes.size () >= MAXIMO_DE_SESSOES)
                {
                    truncada = true;
                    break;
                }

                EspacoLivre aindaLivre =
                new EspacoLivre (espaco.getId (), cursor, espaco.getFim ());

                // testa todas as tarefas que ainda faltam e fica com a de melhor nota
                Candidato melhor = null;
                int indiceDaMelhor = -1;

                for (int i = 0; i < ativas.size (); i++)
                {
                    if (restante[i] <= 0)
                        continue;

                    Tarefa tarefa = ativas.get (i);
                    Candidato candidato =
                    CalculadoraDeRanking.avaliar (tarefa, tarefa, aindaLivre, agora, preferencias,
                                                  restante[i], duracao);
                    if (candidato == null)
                        continue;

                    foiCandidata[i] = true;

                    if (melhor == null || candidato.compareTo (melhor) < 0)
                    {
                        melhor = candidato;
                        indiceDaMelhor = i;
                    }
                }

                if (melhor == null)
                    break; // ninguem serve para o que sobrou deste espaco

                int minutos = melhor.getMinutosNoEspaco ();
                int faltaDepois = restante[indiceDaMelhor] - minutos;
                restante[indiceDaMelhor] = faltaDepois;

                OffsetDateTime fimDaSessao = cursor.plusMinutes (minutos);
                SessaoAlocada ultima = indiceDaUltima >= 0 ? sessoes.get (indiceDaUltima) : null;

                // sem pausa, a sessao seguinte da mesma tarefa e juntada a anterior
                if (pausa == 0 && ultima != null && ultima.getFim ().isEqual (cursor)
                    && ultima.getTarefaId ().equals (melhor.getTarefaId ())
                    && ultima.getMinutos () + minutos <= DURACAO_MAXIMA_MINUTOS)
                {
                    sessoes.remove (indiceDaUltima); // a ultima sessao e sempre a ultima da lista
                    sessoes.add (ultima.estendida (minutos, faltaDepois));
                }
                else
                {
                    SessaoAlocada nova =
                    new SessaoAlocada (espaco.getId (), melhor.getTarefaId (), cursor, fimDaSessao,
                                       minutos, faltaDepois, melhor.getNota (),
                                       melhor.getUrgencia (), melhor.getImportancia (),
                                       melhor.getEncaixe ());

                    sessoes.add (nova);
                    indiceDaUltima = sessoes.size () - 1;
                }

                ocupadoAte = fimDaSessao;
                cursor = fimDaSessao.plusMinutes (pausa);
            }
        }

        ArrayList<TarefaSemAlocacao> sem =
        tarefasSemAlocacao (ativas, restante, pedidos, foiCandidata, espacos.size () == 0);

        return new Alocacao (sessoes, sem, truncada);
    }

    // Posicao da primeira tarefa com esse id, ou -1 se nao existe
    private static int posicaoDoId (ArrayList<Tarefa> tarefas, String id)
    {
        for (int i = 0; i < tarefas.size (); i++)
            if (tarefas.get (i).getId ().equals (id))
                return i;

        return -1;
    }

    // Lista as tarefas que ainda tem minutos faltando e diz por que:
    // alocacao_parcial, sem_espacos, espacos_insuficientes ou nenhum_espaco_antes_do_prazo.
    private static ArrayList<TarefaSemAlocacao> tarefasSemAlocacao
    (ArrayList<Tarefa> ativas, int[] restante, int[] pedidos,
     boolean[] foiCandidata, boolean semEspacos)
    {
        ArrayList<TarefaSemAlocacao> sem = new ArrayList<TarefaSemAlocacao> ();

        for (int i = 0; i < ativas.size (); i++)
        {
            if (restante[i] <= 0)
                continue;

            String motivo;
            if (restante[i] < pedidos[i])
                motivo = "alocacao_parcial";
            else if (semEspacos)
                motivo = "sem_espacos";
            else if (foiCandidata[i])
                motivo = "espacos_insuficientes";
            else
                motivo = "nenhum_espaco_antes_do_prazo";

            sem.add (new TarefaSemAlocacao (ativas.get (i).getId (), motivo, restante[i]));
        }

        return sem;
    }
}
