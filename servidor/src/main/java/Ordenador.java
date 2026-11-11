import java.util.*;

// Ordena uma lista usando o compareTo dos proprios elementos (merge sort, que mantem a ordem
// original dos elementos iguais). Devolve uma lista nova; a original nao muda.
public class Ordenador<X extends Comparable<X>>
{
    public ArrayList<X> ordene (ArrayList<X> lista)
    {
        X[] elemento = (X[]) new Comparable[lista.size()];
        for (int i=0; i<elemento.length; i++)
            elemento[i] = lista.get(i);

        X[] auxiliar = (X[]) new Comparable[elemento.length];
        this.ordene (elemento, auxiliar, 0, elemento.length);

        ArrayList<X> ret = new ArrayList<X> ();
        for (int i=0; i<elemento.length; i++)
            ret.add (elemento[i]);

        return ret;
    }

    // Ordena a parte do vetor que vai de inicio (inclusive) ate fim (exclusive).
    private void ordene (X[] elemento, X[] auxiliar, int inicio, int fim)
    {
        if (fim-inicio < 2)
            return;

        int meio = (inicio+fim)/2;

        this.ordene (elemento, auxiliar, inicio, meio);
        this.ordene (elemento, auxiliar, meio, fim);

        int esquerda = inicio;
        int direita  = meio;
        int destino  = inicio;

        while (esquerda<meio && direita<fim)
            if (elemento[direita].compareTo(elemento[esquerda]) < 0)
                auxiliar[destino++] = elemento[direita++];
            else
                auxiliar[destino++] = elemento[esquerda++];

        while (esquerda<meio)
            auxiliar[destino++] = elemento[esquerda++];

        while (direita<fim)
            auxiliar[destino++] = elemento[direita++];

        for (destino=inicio; destino<fim; destino++)
            elemento[destino] = auxiliar[destino];
    }
}
