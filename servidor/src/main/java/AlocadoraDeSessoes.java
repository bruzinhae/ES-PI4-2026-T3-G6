import java.util.*;

public class AlocadoraDeSessoes
{
    public static final int PAUSA_ANTIFADIGA_MINUTOS = 10;

    public static final int MAXIMO_DE_SESSOES = 2000; // por pedido; ao chegar aqui marca truncada

    private static final int MINUTOS_MINIMOS_DO_ESPACO = 15;

    public static Alocacao alocar (PedidoDeRanking pedido)
    {
        Preferencias preferencias = pedido.getPreferencias ();
        DataHora agora = pedido.getAgora ();
        int duracao = preferencias.getDuracaoMinutos ();
        int pausa = preferencias.isAntifadiga () ? PAUSA_ANTIFADIGA_MINUTOS : 0;

        ArrayList<Tarefa> ativas = new ArrayList<Tarefa> ();
        for (Tarefa tarefa : pedido.getTarefas ())
            if (!tarefa.concluida () &&
                AlocadoraDeSessoes.posicaoDoId (ativas, tarefa.getId ()) == -1)
                ativas.add (tarefa); // concluida fica de fora; id repetido vale so o primeiro

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

        ArrayList<EspacoLivre> espacos = new ArrayList<EspacoLivre> (pedido.getEspacos ());
        espacos = new Ordenador<EspacoLivre> ().ordene (espacos);

        ArrayList<SessaoAlocada> sessoes = new ArrayList<SessaoAlocada> ();
        DataHora ocupadoAte = null;
        boolean truncada = false;

        for (EspacoLivre espaco : espacos)
        {
            if (truncada)
                break;

            DataHora cursor = espaco.getInicio ();

            if (ocupadoAte != null && ocupadoAte.depoisDe (cursor))
                cursor = ocupadoAte.noFusoDe (espaco.getInicio ()); // espacos que se sobrepoem

            int indiceDaUltima = -1; // ultima sessao reservada neste espaco

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

                EspacoLivre aindaLivre =
                new EspacoLivre (espaco.getId (), cursor, espaco.getFim ());

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

                DataHora fimDaSessao = cursor.maisMinutos (minutos);
                SessaoAlocada ultima = indiceDaUltima >= 0 ? sessoes.get (indiceDaUltima) : null;

                if (pausa == 0 && ultima != null && ultima.getFim ().mesmoInstante (cursor)
                    && ultima.getTarefaId ().equals (melhor.getTarefaId ()))
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
                cursor = fimDaSessao.maisMinutos (pausa);
            }
        }

        ArrayList<TarefaSemAlocacao> sem =
        tarefasSemAlocacao (ativas, restante, pedidos, foiCandidata, espacos.size () == 0);

        return new Alocacao (sessoes, sem, truncada);
    }

    private static int posicaoDoId (ArrayList<Tarefa> tarefas, String id)
    {
        for (int i = 0; i < tarefas.size (); i++)
            if (tarefas.get (i).getId ().equals (id))
                return i;

        return -1;
    }

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
