package br.faculdade.acaistudy.servidor;

import br.faculdade.acaistudy.servidor.comunicado.PedidoParaSair;
import br.faculdade.acaistudy.servidor.json.Campos;
import br.faculdade.acaistudy.servidor.json.Json;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Cliente de console para testar o servidor (equivalente ao Cliente do Fazedor de Continhas).
 *
 * Uso: java ...Cliente ARQUIVO.json [HOST [PORTA]] [--json]
 *      java ...Cliente OLA|DATA|HORA [HOST [PORTA]]      (comandos de texto simples)
 * Lê um PedidoDeRanking de um arquivo, envia ao servidor e mostra o ranking de cada espaço.
 * Com --json, mostra a resposta bruta. O backend Node usa o mesmo protocolo (ver README).
 */
public class Cliente
{
    public static final String HOST_PADRAO  = "localhost";
    public static final int    PORTA_PADRAO = 3000;

    public static void main (String[] args)
    {
        boolean bruto = false;
        java.util.ArrayList<String> posicionais = new java.util.ArrayList<String> ();

        for (String arg : args)
            if (arg.equals ("--json"))
                bruto = true;
            else
                posicionais.add (arg);

        if (posicionais.isEmpty () || posicionais.size () > 3)
        {
            System.err.println ("Uso esperado: java Cliente ARQUIVO.json [HOST [PORTA]] [--json]\n");
            return;
        }

        // Comando de texto (OLA, DATA, HORA): envia a palavra e mostra a resposta, como no CLIENTE.java dos exemplos.
        if (ComandosDeTexto.responder (posicionais.get (0), java.time.Clock.systemUTC ()) != null)
        {
            comandoDeTexto (posicionais);
            return;
        }

        Map<String, Object> pedido;

        try
        {
            pedido = Campos.comoObjeto (Json.ler (Files.readString (Paths.get (posicionais.get (0)), StandardCharsets.UTF_8)), "pedido");
        }
        catch (Exception erro)
        {
            System.err.println ("Nao foi possivel ler o arquivo: " + erro.getMessage () + "\n");
            return;
        }

        try (Socket conexao = new Socket (posicionais.size () > 1 ? posicionais.get (1) : HOST_PADRAO,
                                          posicionais.size () > 2 ? Integer.parseInt (posicionais.get (2)) : PORTA_PADRAO))
        {
            PrintWriter transmissor = new PrintWriter (new OutputStreamWriter (conexao.getOutputStream (), StandardCharsets.UTF_8), true);
            BufferedReader receptor = new BufferedReader (new InputStreamReader (conexao.getInputStream (), StandardCharsets.UTF_8));

            transmissor.println (Json.escrever (pedido));
            String resposta = receptor.readLine ();

            if (resposta == null)
            {
                System.err.println ("O servidor fechou a conexao sem responder.\n");
                return;
            }

            if (bruto)
                System.out.println (resposta);
            else
                mostrar (Campos.comoObjeto (Json.ler (resposta), "resposta"), pedido);

            transmissor.println (new PedidoParaSair ().paraJson ());
        }
        catch (Exception erro)
        {
            System.err.println ("Indique o servidor e a porta corretos! (" + erro.getMessage () + ")\n");
        }
    }

    // Alocação decidida pelo servidor (quando o pedido traz "alocar": true).
    private static void mostrarAlocacao (Map<String, Object> resposta, Map<String, String> titulos) throws Exception
    {
        System.out.println ("Alocacao sugerida:");

        @SuppressWarnings ("unchecked")
        List<Object> sessoes = (List<Object>) resposta.get ("alocacao");

        if (sessoes.isEmpty ())
            System.out.println ("   (nenhuma sessao)");

        for (Object s : sessoes)
        {
            Map<String, Object> sessao = Campos.comoObjeto (s, "sessao");
            System.out.printf ("   %s ate %s  %-36s %d min  (faltam %d min)%n",
                               sessao.get ("inicio"), sessao.get ("fim"),
                               titulos.get (String.valueOf (sessao.get ("tarefaId"))),
                               ((Double) sessao.get ("minutos")).intValue (),
                               ((Double) sessao.get ("minutosRestantes")).intValue ());
        }

        @SuppressWarnings ("unchecked")
        List<Object> pendentes = (List<Object>) resposta.get ("semAlocacao");

        for (Object p : pendentes)
        {
            Map<String, Object> pendente = Campos.comoObjeto (p, "pendente");
            System.out.println ("   ! " + titulos.get (String.valueOf (pendente.get ("tarefaId"))) + ": " + pendente.get ("motivo")
                                + " (faltam " + ((Double) pendente.get ("minutosRestantes")).intValue () + " min)");
        }

        if (Boolean.TRUE.equals (resposta.get ("alocacaoTruncada")))
            System.out.println ("   (alocacao truncada no limite de sessoes)");

        System.out.println ();
    }

    private static void comandoDeTexto (java.util.List<String> posicionais)
    {
        try (Socket conexao = new Socket (posicionais.size () > 1 ? posicionais.get (1) : HOST_PADRAO,
                                          posicionais.size () > 2 ? Integer.parseInt (posicionais.get (2)) : PORTA_PADRAO))
        {
            PrintWriter transmissor = new PrintWriter (new OutputStreamWriter (conexao.getOutputStream (), StandardCharsets.UTF_8), true);
            BufferedReader receptor = new BufferedReader (new InputStreamReader (conexao.getInputStream (), StandardCharsets.UTF_8));

            transmissor.println (posicionais.get (0).toUpperCase ());
            System.out.println (receptor.readLine ());
            transmissor.println ("FIM");
        }
        catch (Exception erro)
        {
            System.err.println ("Indique o servidor e a porta corretos! (" + erro.getMessage () + ")\n");
        }
    }

    private static void mostrar (Map<String, Object> resposta, Map<String, Object> pedido) throws Exception
    {
        if ("erro".equals (resposta.get ("tipo")))
        {
            System.out.println ("ERRO do servidor: " + resposta.get ("mensagem"));
            return;
        }

        Map<String, String> titulos = new HashMap<String, String> ();
        for (Object t : Campos.lista (pedido, "tarefas", Integer.MAX_VALUE))
        {
            Map<String, Object> tarefa = Campos.comoObjeto (t, "tarefa");
            titulos.put (String.valueOf (tarefa.get ("id")), String.valueOf (tarefa.get ("titulo")));
        }

        Map<String, String> horarios = new HashMap<String, String> ();
        for (Object e : Campos.lista (pedido, "espacos", Integer.MAX_VALUE))
        {
            Map<String, Object> espaco = Campos.comoObjeto (e, "espaco");
            horarios.put (String.valueOf (espaco.get ("id")), espaco.get ("inicio") + " ate " + espaco.get ("fim"));
        }

        for (Object r : Campos.lista (resposta, "porEspaco", Integer.MAX_VALUE))
        {
            Map<String, Object> ranking = Campos.comoObjeto (r, "ranking");
            System.out.println ("Espaco " + ranking.get ("espacoId") + "  [" + horarios.get (String.valueOf (ranking.get ("espacoId"))) + "]");

            @SuppressWarnings ("unchecked")
            List<Object> candidatos = (List<Object>) ranking.get ("candidatos");

            if (candidatos.isEmpty ())
                System.out.println ("   (nenhum candidato)");

            int posicao = 1;
            for (Object c : candidatos)
            {
                Map<String, Object> candidato = Campos.comoObjeto (c, "candidato");
                Map<String, Object> comp = Campos.comoObjeto (candidato.get ("composicao"), "composicao");
                System.out.printf ("   %d. %-36s nota %.3f  (urg %.2f, imp %.2f, enc %.2f)  %d min%s%n",
                                   posicao++, titulos.get (String.valueOf (candidato.get ("tarefaId"))),
                                   (Double) candidato.get ("nota"), (Double) comp.get ("urgencia"),
                                   (Double) comp.get ("importancia"), (Double) comp.get ("encaixe"),
                                   ((Double) candidato.get ("minutosNoEspaco")).intValue (),
                                   Boolean.TRUE.equals (candidato.get ("parcial")) ? "  [parcial]" : "");
            }

            System.out.println ();
        }

        if (resposta.get ("alocacao") instanceof List)
            mostrarAlocacao (resposta, titulos);

        @SuppressWarnings ("unchecked")
        List<Object> sem = (List<Object>) resposta.get ("semEspaco");

        if (!sem.isEmpty ())
        {
            System.out.println ("Sem espaco:");
            for (Object s : sem)
            {
                Map<String, Object> item = Campos.comoObjeto (s, "tarefa");
                System.out.println ("   - " + titulos.get (String.valueOf (item.get ("tarefaId"))) + " (" + item.get ("motivo") + ")");
            }
        }
    }
}
