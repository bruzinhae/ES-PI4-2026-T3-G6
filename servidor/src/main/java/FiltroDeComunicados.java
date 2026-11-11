import java.io.*;

/**
 * Decide quais classes podem ser lidas de um fluxo de objetos serializados. Ler objetos de um
 * fluxo qualquer pode executar código de classes que ninguém previu; por isso o servidor só aceita
 * os comunicados e as classes que eles carregam, além de limitar o tamanho e a profundidade.
 */
public class FiltroDeComunicados implements ObjectInputFilter
{
    public static final long MAXIMO_DE_BYTES      = 8000000;
    public static final long MAXIMO_DE_REFERENCIAS = 200000;
    public static final long MAXIMO_DE_PROFUNDIDADE = 20;
    public static final long MAXIMO_DE_ITENS_DO_VETOR = 100000;

    private static String[] permitidas =
    {
        "Comunicado", "PedidoDeRanking", "PedidoDeMetas", "PedidoParaSair",
        "Tarefa", "Meta", "EspacoLivre", "Preferencias", "DataHora",
        "java.util.ArrayList", "[Ljava.lang.Object;", // o ArrayList confere um vetor de Object ao ler
        "java.lang.Number", "java.lang.Integer", "java.lang.Long", "java.lang.Double", "java.lang.Boolean"
    };

    @Override
    public ObjectInputFilter.Status checkInput (ObjectInputFilter.FilterInfo info)
    {
        if (info.arrayLength() > MAXIMO_DE_ITENS_DO_VETOR || info.streamBytes() > MAXIMO_DE_BYTES || info.references() > MAXIMO_DE_REFERENCIAS || info.depth() > MAXIMO_DE_PROFUNDIDADE)
            return ObjectInputFilter.Status.REJECTED;

        Class<?> classe = info.serialClass();

        if (classe == null)
            return ObjectInputFilter.Status.UNDECIDED; // texto, numero ou referencia: nao ha classe para conferir

        for (int i=0; i<permitidas.length; i++)
            if (permitidas[i].equals(classe.getName()))
                return ObjectInputFilter.Status.ALLOWED;

        return ObjectInputFilter.Status.REJECTED;
    }
}
