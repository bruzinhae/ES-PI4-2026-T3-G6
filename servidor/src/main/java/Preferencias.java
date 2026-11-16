public class Preferencias
{
    private String  janelaFoco;     // manha, tarde ou noite
    private boolean focoMatinal;    // false ignora a janela de foco
    private int     duracaoMinutos; // duracao de cada sessao
    private boolean antifadiga;     // pausa de 10 minutos entre sessoes seguidas

    public Preferencias (ObjetoJson json) throws Exception
    {
        this.janelaFoco     = json.getTexto   ("janelaFoco");
        this.focoMatinal    = json.getLogico  ("focoMatinal");
        this.duracaoMinutos = json.getInteiro ("duracaoMinutos");
        this.antifadiga     = json.getLogico  ("antifadiga");
    }

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
