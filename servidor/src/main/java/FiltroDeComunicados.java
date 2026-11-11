import java.io.*;

public class FiltroDeComunicados implements ObjectInputFilter
{
    public static final long MAXIMO_DE_BYTES          = 8000000;
    public static final long MAXIMO_DE_REFERENCIAS    = 200000;
    public static final long MAXIMO_DE_PROFUNDIDADE   = 20;
    public static final long MAXIMO_DE_ITENS_DO_VETOR = 100000;

    private static String[] permitidas =
    {
        "Comunicado", "PedidoDeRanking", "PedidoDeMetas", "PedidoParaSair",
        "Tarefa", "Meta", "EspacoLivre", "Preferencias", "DataHora",
        "java.util.ArrayList", "[Ljava.lang.Object;", // o ArrayList confere um vetor ao ler
        "java.lang.Number", "java.lang.Integer" // Integer: so nos campos que aceitam null
    };

    public ObjectInputFilter.Status checkInput (ObjectInputFilter.FilterInfo info)
    {
        if (info.arrayLength() > MAXIMO_DE_ITENS_DO_VETOR || info.streamBytes() > MAXIMO_DE_BYTES ||
            info.references() > MAXIMO_DE_REFERENCIAS || info.depth() > MAXIMO_DE_PROFUNDIDADE)
            return ObjectInputFilter.Status.REJECTED;

        Class<?> classe = info.serialClass();

        if (classe == null)
            return ObjectInputFilter.Status.UNDECIDED; // texto ou referencia: sem classe

        for (int i=0; i<permitidas.length; i++)
            if (permitidas[i].equals(classe.getName()))
                return ObjectInputFilter.Status.ALLOWED;

        return ObjectInputFilter.Status.REJECTED;
    }
}
