package br.faculdade.acaistudy.servidor;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Comandos de texto simples, no estilo dos exemplos de servidor socket da disciplina
 * (cliente envia uma palavra, servidor responde uma linha): OLA, DATA, HORA e FIM.
 *
 * Servem para testar a conexão com qualquer cliente de console (inclusive o CLIENTE.java dos
 * exemplos) e como "teste de vida" do servidor. O trabalho de verdade continua sendo o
 * PedidoDeRanking em JSON. Esta classe não tem estado; o relógio é recebido por parâmetro para
 * que os testes possam fixar a data e a hora.
 */
public final class ComandosDeTexto
{
    private static final DateTimeFormatter FORMATO_DE_DATA = DateTimeFormatter.ofPattern ("dd/MM/yyyy");
    private static final DateTimeFormatter FORMATO_DE_HORA = DateTimeFormatter.ofPattern ("HH:mm:ss");

    private ComandosDeTexto () {}

    // true se a linha é o comando FIM (o cliente quer encerrar a conexão; não há resposta).
    public static boolean ehPedidoParaSair (String linha)
    {
        return linha != null && linha.trim ().equalsIgnoreCase ("FIM");
    }

    // Resposta (uma única linha) ao comando, ou null se a linha não é um comando de texto.
    public static String responder (String linha, Clock relogio)
    {
        if (linha == null || relogio == null)
            return null;

        switch (linha.trim ().toUpperCase ())
        {
            case "OLA":
                return "EU SOU O SERVIDOR DE RANKING DO ACAISTUDY. COMO POSSO AJUDA-LO?";
            case "DATA":
                return "DATA:" + LocalDateTime.now (relogio).format (FORMATO_DE_DATA);
            case "HORA":
                return "HORA:" + LocalDateTime.now (relogio).format (FORMATO_DE_HORA);
            default:
                return null;
        }
    }
}
