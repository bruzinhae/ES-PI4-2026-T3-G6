// Guilherme Domingues de Sousa - 22013871
package modelo;

import json.*;

// Preferencias de estudo do usuario enviadas junto com o pedido de ranking
public class Preferencias
{
    private String  janelaFoco;     // manha, tarde ou noite
    private boolean focoMatinal;    // false ignora a janela de foco
    private int     duracaoMinutos; // duracao de cada sessao
    private boolean antifadiga;     // pausa de 10 minutos entre sessoes seguidas

    // Le os campos do JSON recebido
    public Preferencias (ObjetoJson json) throws Exception
    {
        this.janelaFoco     = json.getTexto   ("janelaFoco");
        this.focoMatinal    = json.getLogico  ("focoMatinal");
        this.duracaoMinutos = json.getInteiro ("duracaoMinutos");
        this.antifadiga     = json.getLogico  ("antifadiga");
    }

    // Devolve janela foco
    public String getJanelaFoco ()
    {
        return this.janelaFoco;
    }

    // Informa se foco matinal
    public boolean isFocoMatinal ()
    {
        return this.focoMatinal;
    }

    // Devolve duracao minutos
    public int getDuracaoMinutos ()
    {
        return this.duracaoMinutos;
    }

    // Informa se antifadiga
    public boolean isAntifadiga ()
    {
        return this.antifadiga;
    }
}
