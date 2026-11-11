import java.io.*;
import java.util.ArrayList;

/**
 * Resultado da alocacao: as sessoes decididas (em ordem cronologica) e as tarefas que nao couberam por inteiro.
 *
 * truncada true se a alocacao parou ao atingir o limite de sessoes por pedido
 */
public class Alocacao implements Serializable
{
    private static final long serialVersionUID = 1L;

    private ArrayList<SessaoAlocada>     sessoes;
    private ArrayList<TarefaSemAlocacao> semAlocacao;
    private boolean                      truncada;

    public Alocacao (ArrayList<SessaoAlocada> sessoes, ArrayList<TarefaSemAlocacao> semAlocacao, boolean truncada)
    {
        this.sessoes     = sessoes;
        this.semAlocacao = semAlocacao;
        this.truncada    = truncada;
    }

}
