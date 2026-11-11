import java.util.ArrayList;

/**
 * Ordena uma lista usando o compareTo dos próprios elementos (merge sort, que mantém a ordem
 * original dos elementos iguais).
 */
public class Ordenador
{
    public static <X extends Comparable<X>> void ordene (ArrayList<X> lista)
    {
        if (lista.size () < 2)
            return;

        ArrayList<X> auxiliar = new ArrayList<X> (lista);
        Ordenador.ordene (lista, auxiliar, 0, lista.size ());
    }

    // Ordena a parte da lista que vai de inicio (inclusive) até fim (exclusive).
    private static <X extends Comparable<X>> void ordene (ArrayList<X> lista, ArrayList<X> auxiliar, int inicio, int fim)
    {
        if (fim - inicio < 2)
            return;

        int meio = (inicio + fim) / 2;

        Ordenador.ordene (lista, auxiliar, inicio, meio);
        Ordenador.ordene (lista, auxiliar, meio, fim);

        int esquerda = inicio;
        int direita  = meio;
        int destino  = inicio;

        while (esquerda < meio && direita < fim)
            if (lista.get (direita).compareTo (lista.get (esquerda)) < 0)
                auxiliar.set (destino++, lista.get (direita++));
            else
                auxiliar.set (destino++, lista.get (esquerda++));

        while (esquerda < meio)
            auxiliar.set (destino++, lista.get (esquerda++));

        while (direita < fim)
            auxiliar.set (destino++, lista.get (direita++));

        for (destino = inicio; destino < fim; destino++)
            lista.set (destino, auxiliar.get (destino));
    }
}
