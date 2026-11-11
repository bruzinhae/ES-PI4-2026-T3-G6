package br.faculdade.acaistudy.servidor.modelo;

/**
 * Preferências de estudo do usuário (vêm da tela de Configurações).
 *
 * @param janelaFoco      "manha" (08:30–12:00), "tarde" (14:00–18:00) ou "noite" (19:00–22:30)
 * @param focoMatinal     false desliga a preferência por janela de pico
 * @param duracaoMinutos  duração de sessão preferida: usada quando a tarefa não tem estimativa e
 *                        como tamanho máximo de cada sessão na alocação
 * @param antifadiga      true coloca uma pausa entre sessões seguidas na alocação
 */
public record Preferencias (String janelaFoco, boolean focoMatinal, int duracaoMinutos, boolean antifadiga)
{
    // Compatível com quem ainda não informa a antifadiga (padrão: ligada).
    public Preferencias (String janelaFoco, boolean focoMatinal, int duracaoMinutos)
    {
        this (janelaFoco, focoMatinal, duracaoMinutos, true);
    }

    public static Preferencias padrao ()
    {
        return new Preferencias ("manha", true, 50, true);
    }
}
