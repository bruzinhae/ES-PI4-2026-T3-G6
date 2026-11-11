import java.io.*;

// Um intervalo livre da grade, calculado pelo backend Node (grade da semana menos blocos
// fixos e sessoes ja marcadas).
public class EspacoLivre implements Comparable<EspacoLivre>, Serializable
{
    private static final long serialVersionUID = 1L;

    private String   id;
    private DataHora inicio;
    private DataHora fim;

    public EspacoLivre (String id, DataHora inicio, DataHora fim)
    {
        this.id     = id;
        this.inicio = inicio;
        this.fim    = fim;
    }

    public String getId ()
    {
        return this.id;
    }

    public DataHora getInicio ()
    {
        return this.inicio;
    }

    public DataHora getFim ()
    {
        return this.fim;
    }

    public int getMinutos ()
    {
        return (int) this.inicio.minutosAte (this.fim);
    }

    @Override
    public int compareTo (EspacoLivre esp)
    {
        // o que comeca primeiro vem antes; empate pelo id
        if (this.inicio.compareTo(esp.inicio)<0) return -666;
        if (this.inicio.compareTo(esp.inicio)>0) return  666;
        if (this.id.compareTo(esp.id)<0) return -666;
        if (this.id.compareTo(esp.id)>0) return  666;
        return 0;
    }

}
