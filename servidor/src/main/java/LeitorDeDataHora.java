/**
 * Percorre o texto de uma data com fuso da esquerda para a direita, conferindo cada parte.
 * Usada só por DataHora.ler.
 */
public class LeitorDeDataHora
{
    private static final int DESLOCAMENTO_MAXIMO = 18 * 3600;

    private String texto;
    private int    posicao = 0;

    LeitorDeDataHora (String texto)
    {
        this.texto = texto;
    }

    boolean proximoE (char c)
    {
        return this.posicao < this.texto.length () && this.texto.charAt (this.posicao) == c;
    }

    void espere (char c) throws Exception
    {
        if (!this.proximoE (c))
            throw new Exception ("Esperava '" + c + "'");

        this.posicao++;
    }

    // A letra (o T entre a data e a hora) pode vir em maiúscula ou minúscula.
    void espereLetra (char maiuscula) throws Exception
    {
        if (!this.proximoE (maiuscula) && !this.proximoE (Character.toLowerCase (maiuscula)))
            throw new Exception ("Esperava '" + maiuscula + "'");

        this.posicao++;
    }

    // Exatamente `quantidade` dígitos de 0 a 9.
    int digitos (int quantidade) throws Exception
    {
        int valor = 0;

        for (int i = 0; i < quantidade; i++)
        {
            if (this.posicao >= this.texto.length ())
                throw new Exception ("Faltam dígitos");

            char c = this.texto.charAt (this.posicao);

            if (c < '0' || c > '9')
                throw new Exception ("Esperava um dígito");

            valor = valor * 10 + (c - '0');
            this.posicao++;
        }

        return valor;
    }

    // De zero a nove dígitos depois do ponto; devolve os nanossegundos.
    int fracao () throws Exception
    {
        int valor = 0;
        int quantidade = 0;

        while (this.posicao < this.texto.length () && this.texto.charAt (this.posicao) >= '0' && this.texto.charAt (this.posicao) <= '9')
        {
            if (quantidade == 9)
                throw new Exception ("Fração grande demais");

            valor = valor * 10 + (this.texto.charAt (this.posicao) - '0');
            quantidade++;
            this.posicao++;
        }

        for (int i = quantidade; i < 9; i++)
            valor *= 10;

        return valor;
    }

    // Z, +HH, +HH:MM ou +HH:MM:SS, em segundos (no máximo 18 horas, para mais ou para menos).
    int deslocamento () throws Exception
    {
        if (this.proximoE ('Z') || this.proximoE ('z'))
        {
            this.posicao++;
            return 0;
        }

        int sinal;

        if (this.proximoE ('+'))
            sinal = 1;
        else if (this.proximoE ('-'))
            sinal = -1;
        else
            throw new Exception ("Falta o fuso");

        this.posicao++;

        int horas    = this.digitos (2);
        int minutos  = 0;
        int segundos = 0;

        if (this.proximoE (':'))
        {
            this.posicao++;
            minutos = this.digitos (2);

            if (this.proximoE (':'))
            {
                this.posicao++;
                segundos = this.digitos (2);
            }
        }

        if (minutos > 59 || segundos > 59)
            throw new Exception ("Fuso inexistente");

        int total = horas * 3600 + minutos * 60 + segundos;

        if (total > DESLOCAMENTO_MAXIMO)
            throw new Exception ("Fuso fora do limite");

        return sinal * total;
    }

    void espereFim () throws Exception
    {
        if (this.posicao != this.texto.length ())
            throw new Exception ("Sobrou texto");
    }
}
