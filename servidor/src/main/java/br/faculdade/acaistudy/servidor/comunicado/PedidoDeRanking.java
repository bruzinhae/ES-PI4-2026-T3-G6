package br.faculdade.acaistudy.servidor.comunicado;

import br.faculdade.acaistudy.servidor.json.Campos;
import br.faculdade.acaistudy.servidor.modelo.EspacoLivre;
import br.faculdade.acaistudy.servidor.modelo.Preferencias;
import br.faculdade.acaistudy.servidor.modelo.Tarefa;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * O cliente envia os espaços livres da grade, as tarefas pendentes e as preferências do
 * usuário, e pede o ranking de candidatos para cada espaço. Contrato completo no README.
 */
public class PedidoDeRanking extends Comunicado
{
    public static final int MAXIMO_DE_ITENS = 2000;
    public static final int LIMITE_PADRAO   = 10;

    private final Instant           agora;
    private final Preferencias      preferencias;
    private final List<EspacoLivre> espacos;
    private final List<Tarefa>      tarefas;
    private final int               limite;

    public PedidoDeRanking (Instant agora, Preferencias preferencias, List<EspacoLivre> espacos,
                            List<Tarefa> tarefas, int limite) throws Exception
    {
        if (agora == null)
            throw new Exception ("Data atual ausente");
        if (preferencias == null)
            throw new Exception ("Preferências ausentes");
        if (espacos == null)
            throw new Exception ("Espaços ausentes");
        if (tarefas == null)
            throw new Exception ("Tarefas ausentes");
        if (limite < 1)
            throw new Exception ("Limite inválido");

        this.agora        = agora;
        this.preferencias = preferencias;
        this.espacos      = espacos;
        this.tarefas      = tarefas;
        this.limite       = limite;
    }

    public Instant agora ()                 { return this.agora; }
    public Preferencias preferencias ()     { return this.preferencias; }
    public List<EspacoLivre> espacos ()     { return this.espacos; }
    public List<Tarefa> tarefas ()          { return this.tarefas; }
    public int limite ()                    { return this.limite; }

    public String tipo ()
    {
        return "pedidoDeRanking";
    }

    protected Map<String, Object> campos ()
    {
        return Map.of (); // o servidor só recebe este comunicado; nunca o envia
    }

    static PedidoDeRanking deMapa (Map<String, Object> mapa) throws Exception
    {
        OffsetDateTime agora = Campos.dataHora (mapa, "agora", false);

        Preferencias preferencias = Preferencias.padrao ();
        if (mapa.get ("preferencias") != null)
        {
            Map<String, Object> p = Campos.comoObjeto (mapa.get ("preferencias"), "preferencias");
            String janela = Campos.texto (p, "janelaFoco", false, "manha");

            if (!janela.equals ("manha") && !janela.equals ("tarde") && !janela.equals ("noite"))
                throw new Exception ("\"janelaFoco\" deve ser manha, tarde ou noite");

            Integer duracao = Campos.inteiro (p, "duracaoMinutos", false, 10, 240);
            preferencias = new Preferencias (janela, Campos.logico (p, "focoMatinal", true), duracao == null ? 50 : duracao);
        }

        List<EspacoLivre> espacos = new ArrayList<EspacoLivre> ();
        for (Object item : Campos.lista (mapa, "espacos", MAXIMO_DE_ITENS))
        {
            Map<String, Object> e = Campos.comoObjeto (item, "espacos[]");
            OffsetDateTime inicio = Campos.dataHora (e, "inicio", true);
            OffsetDateTime fim    = Campos.dataHora (e, "fim", true);

            if (!fim.isAfter (inicio))
                throw new Exception ("Em \"espacos\", o \"fim\" deve ser depois do \"inicio\"");

            espacos.add (new EspacoLivre (Campos.texto (e, "id", true, null), inicio, fim));
        }

        List<Tarefa> tarefas = new ArrayList<Tarefa> ();
        for (Object item : Campos.lista (mapa, "tarefas", MAXIMO_DE_ITENS))
        {
            Map<String, Object> t = Campos.comoObjeto (item, "tarefas[]");
            OffsetDateTime prazo = Campos.dataHora (t, "prazo", false);

            Integer prioridade = Campos.inteiro (t, "prioridade", false, 1, 10);
            Integer dificuldade = null;
            Integer peso = null;

            if (t.get ("disciplina") != null)
            {
                Map<String, Object> d = Campos.comoObjeto (t.get ("disciplina"), "disciplina");
                dificuldade = Campos.inteiro (d, "dificuldade", false, 1, 5);
                peso        = Campos.inteiro (d, "peso", false, 1, 5);
            }

            tarefas.add (new Tarefa (Campos.texto (t, "id", true, null),
                                     Campos.texto (t, "titulo", false, ""),
                                     Campos.texto (t, "tipo", false, "outro"),
                                     prioridade == null ? 5 : prioridade,
                                     prazo == null ? null : prazo.toInstant (),
                                     Campos.inteiro (t, "minutosEstimados", false, 15, 1440),
                                     dificuldade,
                                     peso,
                                     Campos.texto (t, "situacao", false, "pendente")));
        }

        Integer limite = Campos.inteiro (mapa, "limite", false, 1, 100);

        return new PedidoDeRanking (agora == null ? Instant.now () : agora.toInstant (),
                                    preferencias, espacos, tarefas,
                                    limite == null ? LIMITE_PADRAO : limite);
    }
}
