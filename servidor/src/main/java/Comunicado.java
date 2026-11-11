import java.io.*;

/**
 * Tudo o que trafega entre o servidor e o cliente (o backend Node) é um Comunicado: um objeto Java
 * serializado, como no Fazedor de Continhas. Cada subclasse declara o seu serialVersionUID porque o
 * cliente em Node escreve e lê o fluxo de bytes da serialização sem ter as classes Java.
 */
public class Comunicado implements Serializable, Cloneable
{
    private static final long serialVersionUID = 1L;
}
