package br.faculdade.acaistudy.servidor.comunicado;

import br.faculdade.acaistudy.servidor.json.Campos;
import br.faculdade.acaistudy.servidor.json.Json;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Tudo o que trafega entre o servidor e o cliente (o backend Node) é um Comunicado.
 *
 * No exemplo do professor (Fazedor de Continhas) os comunicados são objetos Java
 * serializados. Aqui a hierarquia é a mesma (PedidoDeRanking, Ranking, PedidoDeMetas, PrioridadeDeMetas, PedidoParaSair,
 * ComunicadoDeDesligamento, Erro), mas cada comunicado viaja como UMA LINHA de JSON, porque
 * o Node não lê a serialização de objetos do Java. O campo "tipo" faz o papel do instanceof.
 */
public abstract class Comunicado
{
    public abstract String tipo ();

    protected abstract Map<String, Object> campos ();

    public final String paraJson ()
    {
        Map<String, Object> mapa = new LinkedHashMap<String, Object> ();
        mapa.put ("tipo", tipo ());
        mapa.putAll (campos ());
        return Json.escrever (mapa);
    }

    // Converte uma linha de JSON no comunicado correspondente. Só os tipos que o cliente envia.
    public static Comunicado deJson (String linha) throws Exception
    {
        Map<String, Object> mapa = Campos.comoObjeto (Json.ler (linha), "comunicado");
        String tipo = Campos.texto (mapa, "tipo", true, null);

        switch (tipo)
        {
            case "pedidoDeRanking":
                return PedidoDeRanking.deMapa (mapa);
            case "pedidoDeMetas":
                return PedidoDeMetas.deMapa (mapa);
            case "pedidoParaSair":
                return new PedidoParaSair ();
            default:
                throw new Exception ("Tipo de comunicado desconhecido: " + tipo);
        }
    }
}
