/**
 * Preferencias de estudo do usuario (vem da tela de Configuracoes).
 *
 * janelaFoco      "manha" (08:30-12:00), "tarde" (14:00-18:00) ou "noite" (19:00-22:30)
 * focoMatinal     false desliga a preferencia por janela de pico
 * duracaoMinutos  duracao de sessao preferida: usada quando a tarefa nao tem estimativa e
 *                 como tamanho de cada sessao na alocacao (uma sessao pode passar ate 14 min
 *                 para absorver um resto pequeno demais para virar outra sessao)
 * antifadiga      true coloca uma pausa entre sessoes seguidas na alocacao
 */
public class Preferencias implements Cloneable
{
    private String  janelaFoco;
    private boolean focoMatinal;
    private int     duracaoMinutos;
    private boolean antifadiga;

    public Preferencias (String janelaFoco, boolean focoMatinal, int duracaoMinutos, boolean antifadiga) throws Exception
    {
        if (janelaFoco == null)
            throw new Exception ("JanelaFoco ausente");

        this.janelaFoco     = janelaFoco;
        this.focoMatinal    = focoMatinal;
        this.duracaoMinutos = duracaoMinutos;
        this.antifadiga     = antifadiga;
    }

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

    public static Preferencias padrao () throws Exception
    {
        return new Preferencias ("manha", true, 50, true);
    }

    @Override
    public String toString ()
    {
        return "janelaFoco....: " + this.janelaFoco + "\n" +
               "focoMatinal...: " + this.focoMatinal + "\n" +
               "duracaoMinutos: " + this.duracaoMinutos + "\n" +
               "antifadiga....: " + this.antifadiga;
    }

    @Override
    public boolean equals (Object obj)
    {
        if (obj == this) return true;
        if (obj == null) return false;

        if (obj.getClass () != this.getClass ()) return false;
        Preferencias outro = (Preferencias) obj;

        if (!this.janelaFoco.equals (outro.janelaFoco)) return false;
        if (this.focoMatinal != outro.focoMatinal) return false;
        if (this.duracaoMinutos != outro.duracaoMinutos) return false;
        if (this.antifadiga != outro.antifadiga) return false;

        return true;
    }

    @Override
    public int hashCode ()
    {
        int ret = 666;

        ret = ret * 7 + this.janelaFoco.hashCode ();
        ret = ret * 7 + ((Boolean) this.focoMatinal).hashCode ();
        ret = ret * 7 + ((Integer) this.duracaoMinutos).hashCode ();
        ret = ret * 7 + ((Boolean) this.antifadiga).hashCode ();

        if (ret < 0) ret = -ret;
        return ret;
    }

    // construtor de copia
    public Preferencias (Preferencias modelo) throws Exception
    {
        if (modelo == null)
            throw new Exception ("Modelo ausente");

        this.janelaFoco     = modelo.janelaFoco;
        this.focoMatinal    = modelo.focoMatinal;
        this.duracaoMinutos = modelo.duracaoMinutos;
        this.antifadiga     = modelo.antifadiga;
    }

    @Override
    public Object clone ()
    {
        Preferencias ret = null;

        try
        {
            ret = new Preferencias (this);
        }
        catch (Exception erro)
        {} // sei que nao vai dar erro

        return ret;
    }
}
