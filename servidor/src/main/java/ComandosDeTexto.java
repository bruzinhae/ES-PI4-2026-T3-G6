/**
 * Comandos de texto simples, no estilo dos exemplos de servidor socket da disciplina
 * (cliente envia uma palavra, servidor responde uma linha): OLA, DATA, HORA e FIM.
 *
 * Servem para testar a conexão com qualquer cliente de console (inclusive o CLIENTE.java dos
 * exemplos) e como "teste de vida" do servidor. O trabalho de verdade continua sendo o
 * pedido de ranking em JSON. Esta classe não tem estado; o relógio (milissegundos e fuso) é recebido
 * por parâmetro para que os testes possam fixar a data e a hora.
 */
public class ComandosDeTexto
{
    private ComandosDeTexto () {}

    // true se a linha é o comando FIM (o cliente quer encerrar a conexão; não há resposta).
    public static boolean ehPedidoParaSair (String linha)
    {
        return linha != null && linha.trim ().toUpperCase ().equals ("FIM");
    }

    // Resposta (uma única linha) ao comando, ou null se a linha não é um comando de texto.
    public static String responder (String linha, long milissegundos, int deslocamento)
    {
        if (linha == null)
            return null;

        DataHora agora = DataHora.deMilissegundos (milissegundos, deslocamento);

        switch (linha.trim ().toUpperCase ())
        {
            case "OLA":
                return "EU SOU O SERVIDOR DE RANKING DO ACAISTUDY. COMO POSSO AJUDA-LO?";
            case "DATA":
                return "DATA:" + dataDeHoje (agora);
            case "HORA":
                return "HORA:" + horaDeAgora (agora);
            default:
                return null;
        }
    }

    // dd/MM/aaaa
    private static String dataDeHoje (DataHora agora)
    {
        String data = DataHora.textoDoDia (agora.getDiaLocal ()); // aaaa-MM-dd

        return data.substring (8, 10) + "/" + data.substring (5, 7) + "/" + data.substring (0, 4);
    }

    // HH:mm:ss
    private static String horaDeAgora (DataHora agora)
    {
        String texto = agora.toString (); // aaaa-MM-ddTHH:mm:ss...

        return texto.substring (11, 19);
    }
}
