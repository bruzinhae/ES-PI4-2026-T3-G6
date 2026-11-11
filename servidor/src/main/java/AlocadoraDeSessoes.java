import java.util.ArrayList;

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
 *   - duracaoMinutos: tamanho de cada sessão (uma tarefa grande vira várias; uma sessão pode passar até 14 min
 *     quando o resto seria pequeno demais para virar outra);
 *   - antifadiga: com ela ligada, há uma pausa de 10 minutos entre sessões seguidas no mesmo espaço; desligada,
 *     sessões seguidas da mesma tarefa são juntadas em uma só.
 *
 * É uma classe sem estado: pode ser usada por várias threads ao mesmo tempo.
 */
public class AlocadoraDeSessoes
{
    public static final int PAUSA_ANTIFADIGA_MINUTOS = 10;

    // Proteção: um pedido nunca gera mais sessões que isto (a alocação para e marca "alocacaoTruncada").
    public static final int MAXIMO_DE_SESSOES = 2000;

    private static final int MINUTOS_MINIMOS_DO_ESPACO = 15;

    private AlocadoraDeSessoes () {}

    public static Alocacao alocar (PedidoDeRanking pedido) throws Exception
    {
        Preferencias preferencias = pedido.getPreferencias ();
        DataHora agora = pedido.getAgora ();
        int pausa = preferencias.getAntifadiga () ? PAUSA_ANTIFADIGA_MINUTOS : 0;

        // Tarefas que ainda pedem tempo (concluídas ficam de fora; id repetido vale só o primeiro).
        ArrayList<Tarefa> ativas = new ArrayList<Tarefa> ();
        for (Tarefa tarefa : pedido.getTarefas ())
            if (!tarefa.concluida () && AlocadoraDeSessoes.posicaoDoId (ativas, tarefa.getId ()) == -1)
                ativas.add (tarefa);

        int[] restante = new int [ativas.size ()];
        int[] pedidos  = new int [ativas.size ()];
        boolean[] foiCandidata = new boolean [ativas.size ()];

        for (int i = 0; i < ativas.size (); i++)
        {
            int necessarios = CalculadoraDeRanking.minutosNecessarios (ativas.get (i), preferencias);
            restante[i] = necessarios;
            pedidos[i]  = necessarios;
        }

        ArrayList<EspacoLivre> espacos = new ArrayList<EspacoLivre> (pedido.getEspacos ());
        Ordenador.ordene (espacos);

        ArrayList<SessaoAlocada> sessoes = new ArrayList<SessaoAlocada> ();
        DataHora ocupadoAte = null;
        boolean truncada = false;

        for (EspacoLivre espaco : espacos)
        {
            if (truncada)
                break;

            DataHora cursor = espaco.getInicio ();

            // Se espaços enviados se sobrepõem, nunca reserva o mesmo minuto duas vezes.
            if (ocupadoAte != null && ocupadoAte.depoisDe (cursor))
                cursor = ocupadoAte.noFusoDe (espaco.getInicio ());

            int indiceDaUltima = -1; // última sessão reservada neste espaço

            for (;;)
            {
                int disponiveis = (int) cursor.minutosAte (espaco.getFim ());

                if (disponiveis < MINUTOS_MINIMOS_DO_ESPACO)
                    break;

                if (sessoes.size () >= MAXIMO_DE_SESSOES)
                {
                    truncada = true;
                    break;
                }

                EspacoLivre aindaLivre = new EspacoLivre (espaco.getId (), cursor, espaco.getFim ());
                Candidato melhor = null;
                int indiceDaMelhor = -1;

                for (int i = 0; i < ativas.size (); i++)
                {
                    if (restante[i] <= 0)
                        continue;

                    Candidato candidato = CalculadoraDeRanking.avaliar (ativas.get (i), ativas.get (i), aindaLivre, agora, preferencias,
                                                                         restante[i], preferencias.getDuracaoMinutos ());
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
                    break; // ninguém serve para o que sobrou deste espaço

                int minutos = melhor.getMinutosNoEspaco ();
                int faltaDepois = restante[indiceDaMelhor] - minutos;
                restante[indiceDaMelhor] = faltaDepois;

                DataHora fimDaSessao = cursor.maisMinutos (minutos);
                SessaoAlocada ultima = indiceDaUltima >= 0 ? sessoes.get (indiceDaUltima) : null;

                if (pausa == 0 && ultima != null && ultima.getTarefaId ().equals (melhor.getTarefaId ())
                    && ultima.getFim ().mesmoInstante (cursor))
                    sessoes.set (indiceDaUltima, ultima.estendida (minutos, faltaDepois));
                else
                {
                    sessoes.add (new SessaoAlocada (espaco.getId (), melhor.getTarefaId (), cursor, fimDaSessao, minutos, faltaDepois,
                                                    melhor.getNota (), melhor.getUrgencia (), melhor.getImportancia (), melhor.getEncaixe ()));
                    indiceDaUltima = sessoes.size () - 1;
                }

                ocupadoAte = fimDaSessao;
                cursor = fimDaSessao.maisMinutos (pausa);
            }
        }

        return new Alocacao (sessoes, tarefasSemAlocacao (ativas, restante, pedidos, foiCandidata, espacos.size () == 0), truncada);
    }

    // A posição da primeira tarefa da lista com esse id, ou -1 se não há nenhuma.
    private static int posicaoDoId (ArrayList<Tarefa> tarefas, String id)
    {
        for (int i = 0; i < tarefas.size (); i++)
            if (tarefas.get (i).getId ().equals (id))
                return i;

        return -1;
    }

    // Tarefas que ainda têm minutos pendentes no fim, com o motivo.
    private static ArrayList<TarefaSemAlocacao> tarefasSemAlocacao (ArrayList<Tarefa> ativas, int[] restante, int[] pedidos,
                                                                    boolean[] foiCandidata, boolean semEspacos) throws Exception
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
