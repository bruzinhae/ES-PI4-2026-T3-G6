// Guilherme Domingues de Sousa - 22013871
package modelo;

import json.*;
import java.util.*;

// Resultado da alocacao: sessoes reservadas, tarefas sem horario e se a lista foi
// cortada por chegar ao limite de sessoes por pedido
public class Alocacao
{
    // sessoes reservadas, em ordem
    private ArrayList<SessaoAlocada>     sessoes;
    // tarefas que ficaram sem horario (ou so com parte)
    private ArrayList<TarefaSemAlocacao> semAlocacao;
    private boolean                      truncada; // parou no limite de sessoes por pedido

    // Guarda o resultado ja calculado pela AlocadoraDeSessoes
    public Alocacao (ArrayList<SessaoAlocada> sessoes, ArrayList<TarefaSemAlocacao> semAlocacao,
                     boolean truncada)
    {
        this.sessoes     = sessoes;
        this.semAlocacao = semAlocacao;
        this.truncada    = truncada;
    }

    // Escreve o objeto em JSON; o Parceiro envia esse texto ao cliente
    @Override
    public String toString ()
    {
        return "{\"sessoes\":" + EscritorDeJson.lista (this.sessoes) +
               ",\"semAlocacao\":" + EscritorDeJson.lista (this.semAlocacao) +
               ",\"truncada\":" + this.truncada + "}";
    }
}
