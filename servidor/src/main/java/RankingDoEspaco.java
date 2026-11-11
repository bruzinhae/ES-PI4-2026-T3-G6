import java.io.*;
import java.util.*;

public class RankingDoEspaco implements Serializable
{
    private static final long serialVersionUID = 1L;

    private String               espacoId;
    private ArrayList<Candidato> candidatos; // do mais para o menos recomendado

    public RankingDoEspaco (String espacoId, ArrayList<Candidato> candidatos)
    {
        this.espacoId   = espacoId;
        this.candidatos = candidatos;
    }
}
