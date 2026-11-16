import java.util.*;

public class Alocacao
{
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

    @Override
    public String toString ()
    {
        return "{\"sessoes\":" + EscritorDeJson.lista (this.sessoes) +
               ",\"semAlocacao\":" + EscritorDeJson.lista (this.semAlocacao) +
               ",\"truncada\":" + this.truncada + "}";
    }
}
