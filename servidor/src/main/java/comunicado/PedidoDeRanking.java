// Guilherme Domingues de Sousa - 22013871
package comunicado;

import json.*;
import modelo.*;
import java.time.*;
import java.util.*;

// Pedido de ranking: horarios livres da semana, tarefas pendentes e preferencias
// do usuario. Se "alocar" for verdadeiro, o servidor tambem monta as sessoes.
public class PedidoDeRanking extends Comunicado
{
    // instante do pedido: base para prazos e urgencia
    private OffsetDateTime         agora;
    // preferencias de estudo do usuario
    private Preferencias           preferencias;
    // horarios livres da semana
    private ArrayList<EspacoLivre> espacos = new ArrayList<EspacoLivre> ();
    // tarefas pendentes
    private ArrayList<Tarefa>      tarefas = new ArrayList<Tarefa> ();
    private int                    limite; // maximo de candidatos por espaco
    private boolean                alocar; // pede tambem a alocacao

    // Le os campos do JSON; espacos e tarefas viram objetos do modelo
    public PedidoDeRanking (ObjetoJson json) throws Exception
    {
        this.agora        = json.getDataHora ("agora");
        this.preferencias = new Preferencias (json.getObjeto ("preferencias"));
        this.limite       = json.getInteiro ("limite");
        this.alocar       = json.getLogico ("alocar");

        for (ObjetoJson espaco : json.getObjetos ("espacos"))
            this.espacos.add (new EspacoLivre (espaco));

        for (ObjetoJson tarefa : json.getObjetos ("tarefas"))
            this.tarefas.add (new Tarefa (tarefa));
    }

    // Devolve agora
    public OffsetDateTime getAgora ()
    {
        return this.agora;
    }

    // Devolve preferencias
    public Preferencias getPreferencias ()
    {
        return this.preferencias;
    }

    // Devolve espacos
    public ArrayList<EspacoLivre> getEspacos ()
    {
        return this.espacos;
    }

    // Devolve tarefas
    public ArrayList<Tarefa> getTarefas ()
    {
        return this.tarefas;
    }

    // Devolve limite
    public int getLimite ()
    {
        return this.limite;
    }

    // Informa se alocar
    public boolean isAlocar ()
    {
        return this.alocar;
    }
}
