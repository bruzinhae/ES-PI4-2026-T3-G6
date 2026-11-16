import java.util.*;

public class RankingDoEspaco
{
    private String               espacoId;
    private ArrayList<Candidato> candidatos; // do mais para o menos recomendado

    public RankingDoEspaco (String espacoId, ArrayList<Candidato> candidatos)
    {
        this.espacoId   = espacoId;
        this.candidatos = candidatos;
    }

    @Override
    public String toString ()
    {
        return "{\"espacoId\":" + EscritorDeJson.texto (this.espacoId) +
               ",\"candidatos\":" + EscritorDeJson.lista (this.candidatos) + "}";
    }
}
