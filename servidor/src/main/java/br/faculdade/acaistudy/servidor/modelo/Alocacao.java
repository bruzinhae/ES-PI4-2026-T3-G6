package br.faculdade.acaistudy.servidor.modelo;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Resultado da alocação: as sessões decididas (em ordem cronológica) e as tarefas que não coube tudo.
 *
 * @param truncada true se a alocação parou ao atingir o limite de sessões por pedido
 */
public record Alocacao (List<SessaoAlocada> sessoes, List<TarefaSemAlocacao> semAlocacao, boolean truncada)
{
    public Map<String, Object> paraMapa ()
    {
        List<Object> itens = new ArrayList<Object> ();
        for (SessaoAlocada sessao : this.sessoes)
            itens.add (sessao.paraMapa ());

        List<Object> sem = new ArrayList<Object> ();
        for (TarefaSemAlocacao tarefa : this.semAlocacao)
            sem.add (tarefa.paraMapa ());

        Map<String, Object> mapa = new LinkedHashMap<String, Object> ();
        mapa.put ("alocacao", itens);
        mapa.put ("semAlocacao", sem);
        if (this.truncada)
            mapa.put ("alocacaoTruncada", true);
        return mapa;
    }
}
