// Guilherme Domingues de Sousa - 22013871
package modelo;

import json.*;
import java.util.*;

// Candidatos de um espaco livre, do mais para o menos recomendado
public class RankingDoEspaco
{
    // id do espaco livre a que o ranking se refere
    private String               espacoId;
    private ArrayList<Candidato> candidatos; // do mais para o menos recomendado

    // Guarda o id do espaco e a lista ja ordenada
    public RankingDoEspaco (String espacoId, ArrayList<Candidato> candidatos)
    {
        this.espacoId   = espacoId;
        this.candidatos = candidatos;
    }

    // Escreve o objeto em JSON; o Parceiro envia esse texto ao cliente
    @Override
    public String toString ()
    {
        return "{\"espacoId\":" + EscritorDeJson.texto (this.espacoId) +
               ",\"candidatos\":" + EscritorDeJson.lista (this.candidatos) + "}";
    }
}
