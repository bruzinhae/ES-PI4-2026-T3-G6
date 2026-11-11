import java.util.ArrayList;

/** Os candidatos de um espaco livre, do mais para o menos recomendado. */
public class RankingDoEspaco implements Cloneable
{
    private String               espacoId;
    private ArrayList<Candidato> candidatos;

    public RankingDoEspaco (String espacoId, ArrayList<Candidato> candidatos) throws Exception
    {
        if (espacoId == null)
            throw new Exception ("EspacoId ausente");
        if (candidatos == null)
            throw new Exception ("Candidatos ausente");

        this.espacoId   = espacoId;
        this.candidatos = candidatos;
    }

    public String getEspacoId ()
    {
        return this.espacoId;
    }

    public ArrayList<Candidato> getCandidatos ()
    {
        return this.candidatos;
    }

    public Objeto paraObjeto ()
    {
        ArrayList<Object> itens = new ArrayList<Object> ();
        for (Candidato candidato : this.candidatos)
            itens.add (candidato.paraObjeto ());

        Objeto ret = new Objeto ();
        ret.guarde ("espacoId", this.espacoId);
        ret.guarde ("candidatos", itens);
        return ret;
    }

    @Override
    public String toString ()
    {
        return "espacoId..: " + this.espacoId + "\n" +
               "candidatos: " + this.candidatos;
    }

    @Override
    public boolean equals (Object obj)
    {
        if (obj == this) return true;
        if (obj == null) return false;

        if (obj.getClass () != this.getClass ()) return false;
        RankingDoEspaco outro = (RankingDoEspaco) obj;

        if (!this.espacoId.equals (outro.espacoId)) return false;
        if (!this.candidatos.equals (outro.candidatos)) return false;

        return true;
    }

    @Override
    public int hashCode ()
    {
        int ret = 666;

        ret = ret * 7 + this.espacoId.hashCode ();
        ret = ret * 7 + this.candidatos.hashCode ();

        if (ret < 0) ret = -ret;
        return ret;
    }

    // construtor de copia
    public RankingDoEspaco (RankingDoEspaco modelo) throws Exception
    {
        if (modelo == null)
            throw new Exception ("Modelo ausente");

        this.espacoId   = modelo.espacoId;
        this.candidatos = new ArrayList<Candidato> (modelo.candidatos);
    }

    @Override
    public Object clone ()
    {
        RankingDoEspaco ret = null;

        try
        {
            ret = new RankingDoEspaco (this);
        }
        catch (Exception erro)
        {} // sei que nao vai dar erro

        return ret;
    }
}
