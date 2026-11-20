// Guilherme Domingues de Sousa - 22013871
package comunicado;

import json.*;
import modelo.*;
import java.util.*;

// Resposta ao PedidoDeRanking: candidatos por espaco livre, tarefas sem espaco e,
// se foi pedida, a alocacao de sessoes.
public class Ranking extends Comunicado
{
    // candidatos de cada espaco livre
    private ArrayList<RankingDoEspaco> porEspaco;
    // tarefas que nao serviram a nenhum espaco
    private ArrayList<TarefaSemEspaco> semEspaco;
    private Alocacao                   alocacao; // null se o pedido nao pediu alocacao

    // Guarda o resultado ja calculado pela CalculadoraDeRanking
    public Ranking (ArrayList<RankingDoEspaco> porEspaco, ArrayList<TarefaSemEspaco> semEspaco,
                    Alocacao alocacao)
    {
        this.porEspaco = porEspaco;
        this.semEspaco = semEspaco;
        this.alocacao  = alocacao;
    }

    // Escreve a resposta em JSON, que e o que o Parceiro envia ao cliente
    @Override
    public String toString ()
    {
        return "{\"tipo\":\"ranking\",\"porEspaco\":" + EscritorDeJson.lista (this.porEspaco) +
               ",\"semEspaco\":" + EscritorDeJson.lista (this.semEspaco) +
               ",\"alocacao\":"  + this.alocacao + "}";
    }
}
