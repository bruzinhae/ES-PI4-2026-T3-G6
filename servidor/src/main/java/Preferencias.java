import java.io.*;

/**
 * Preferencias de estudo do usuario (vem da tela de Configuracoes).
 *
 * janelaFoco      "manha" (08:30-12:00), "tarde" (14:00-18:00) ou "noite" (19:00-22:30)
 * focoMatinal     false desliga a preferencia por janela de pico
 * duracaoMinutos  duracao de sessao preferida: usada quando a tarefa nao tem estimativa e
 *                 como tamanho de cada sessao na alocacao
 * antifadiga      true coloca uma pausa entre sessoes seguidas na alocacao
 */
public class Preferencias implements Serializable
{
    private static final long serialVersionUID = 1L;

    private String  janelaFoco;
    private boolean focoMatinal;
    private int     duracaoMinutos;
    private boolean antifadiga;

    public String getJanelaFoco ()
    {
        return this.janelaFoco;
    }

    public boolean getFocoMatinal ()
    {
        return this.focoMatinal;
    }

    public int getDuracaoMinutos ()
    {
        return this.duracaoMinutos;
    }

    public boolean getAntifadiga ()
    {
        return this.antifadiga;
    }

}
