import java.io.*;
import java.util.*;

// Os candidatos de um espaco livre, do mais para o menos recomendado.
public class RankingDoEspaco implements Serializable
{
    private static final long serialVersionUID = 1L;

    private String               espacoId;
    private ArrayList<Candidato> candidatos;

    public RankingDoEspaco (String espacoId, ArrayList<Candidato> candidatos)
    {
        this.espacoId   = espacoId;
        this.candidatos = candidatos;
    }

    public String getEspacoId ()
    {
        return this.espacoId;
    }

}
