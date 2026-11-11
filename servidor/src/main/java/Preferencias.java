import java.io.*;

public class Preferencias implements Serializable
{
    private static final long serialVersionUID = 1L;

    private String  janelaFoco;     // manha, tarde ou noite
    private boolean focoMatinal;    // false ignora a janela de foco
    private int     duracaoMinutos; // duracao de cada sessao
    private boolean antifadiga;     // pausa de 10 minutos entre sessoes seguidas

    public String getJanelaFoco ()
    {
        return this.janelaFoco;
    }

    public boolean isFocoMatinal ()
    {
        return this.focoMatinal;
    }

    public int getDuracaoMinutos ()
    {
        return this.duracaoMinutos;
    }

    public boolean isAntifadiga ()
    {
        return this.antifadiga;
    }
}
