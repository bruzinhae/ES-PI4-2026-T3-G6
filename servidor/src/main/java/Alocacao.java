import java.io.*;
import java.util.*;

public class Alocacao implements Serializable
{
    private static final long serialVersionUID = 1L;

    private ArrayList<SessaoAlocada>     sessoes;
    private ArrayList<TarefaSemAlocacao> semAlocacao;
    private boolean                      truncada; // parou no limite de sessoes por pedido

    public Alocacao (ArrayList<SessaoAlocada> sessoes, ArrayList<TarefaSemAlocacao> semAlocacao,
                     boolean truncada)
    {
        this.sessoes     = sessoes;
        this.semAlocacao = semAlocacao;
        this.truncada    = truncada;
    }
}
