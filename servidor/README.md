# Servidor de ranking (Java, socket)

Servidor da issue #34. Recebe os **espaços livres** da grade e as **tarefas pendentes** e devolve, para cada espaço, um **vetor de candidatos ordenado por prioridade**. Quem decide o que entra na grade (o backend Node, a Sofia ou o usuário) usa esse ranking.

A arquitetura segue o exemplo do professor, o *Fazedor de Continhas* (cliente-servidor com sockets e threads):

| Fazedor de Continhas | Aqui |
| --- | --- |
| `Servidor` (main, porta 3000, comando `desativar`) | `Servidor` |
| `AceitadoraDeConexao` (thread no `accept()`) | `AceitadoraDeConexao` |
| `SupervisoraDeConexao` (uma thread por cliente, `instanceof`) | `SupervisoraDeConexao` |
| `Parceiro` (socket + fluxos) | `Parceiro` |
| `Comunicado`, `PedidoDeOperacao`, `Resultado`, `PedidoParaSair`, `ComunicadoDeDesligamento` | `Comunicado`, `PedidoDeRanking`, `Ranking`, `PedidoParaSair`, `ComunicadoDeDesligamento`, `Erro` |
| `Cliente` (console) | `Cliente` |

**Diferença:** os comunicados viajam como **uma linha de JSON** (e não como objetos Java serializados), porque o backend Node não lê a serialização do Java. O campo `"tipo"` faz o papel do `instanceof`. Não há bibliotecas externas (o JSON é lido por `json/Json.java`).

## Como o servidor se encaixa

```text
Front → API Node (autenticada) ──► Servidor Java (este)
                                    sem banco, sem estado, sem usuários
```

- O **Node** calcula os espaços livres (grade da semana menos blocos fixos e sessões já marcadas), junta as tarefas pendentes e as preferências do usuário e manda ao servidor.
- O servidor **não acessa o banco e não conhece usuário**, por isso não tem autenticação. Ele escuta **somente em localhost** por padrão; só o backend na mesma máquina (ou rede interna) deve chamá-lo.
- Cada pedido é independente: nada é guardado entre pedidos.

## Como compilar e rodar

Requer Java 17 (sem Maven e sem dependências). Na pasta `servidor/`:

```bash
javac -d out $(find src -name '*.java')
java -cp out br.faculdade.acaistudy.servidor.Servidor            # porta 3000, só localhost
java -cp out br.faculdade.acaistudy.servidor.Servidor 3100       # outra porta
java -cp out br.faculdade.acaistudy.servidor.Servidor 3100 0.0.0.0   # (cuidado) escutar em todas as interfaces
```

Para desativar, digite `desativar` no console. Os clientes conectados recebem um `comunicadoDeDesligamento`.

Para testar sem o Node, com o cliente de console (mostra o ranking em tabela):

```bash
java -cp out br.faculdade.acaistudy.servidor.Cliente exemplos/pedido-semana.json localhost 3000
java -cp out br.faculdade.acaistudy.servidor.Cliente exemplos/pedido-semana.json localhost 3000 --json   # resposta bruta
```

`exemplos/pedido-semana.json` foi montado com as tarefas e disciplinas do dicionário de dados. O layout de pastas (`src/main/java/...`) já é o do Maven, para adicionar um `pom.xml` e o JUnit da #37 sem mover arquivos.

## Protocolo

TCP, texto UTF-8, **uma mensagem por linha** (termina em `\n`). Pode-se mandar vários pedidos na mesma conexão ou abrir uma conexão por pedido. Linhas em branco são ignoradas. Limites: 2 MB por linha, 2000 espaços e 2000 tarefas por pedido, conexão parada por mais de 5 minutos é encerrada.

### `pedidoDeRanking` (cliente → servidor)

```json
{
  "tipo": "pedidoDeRanking",
  "agora": "2026-10-27T09:00:00-03:00",
  "preferencias": { "janelaFoco": "tarde", "focoMatinal": true, "duracaoMinutos": 50 },
  "limite": 5,
  "espacos": [
    { "id": "e1", "inicio": "2026-10-27T14:00:00-03:00", "fim": "2026-10-27T16:00:00-03:00" }
  ],
  "tarefas": [
    {
      "id": "672006000000000000000001",
      "titulo": "Prova P2 de Cálculo II",
      "tipo": "prova",
      "prioridade": 9,
      "prazo": "2026-11-05T11:00:00Z",
      "minutosEstimados": 120,
      "situacao": "pendente",
      "disciplina": { "dificuldade": 4, "peso": 3 }
    }
  ]
}
```

| Campo | Obrigatório | Observação |
| --- | --- | --- |
| `agora` | não | ISO-8601 com fuso. Padrão: hora do servidor. Mandar sempre permite resultados reproduzíveis. |
| `preferencias.janelaFoco` | não | `manha` (08:30–12:00), `tarde` (14:00–18:00) ou `noite` (19:00–22:30). Padrão `manha`. |
| `preferencias.focoMatinal` | não | `false` ignora a janela de foco. Padrão `true`. |
| `preferencias.duracaoMinutos` | não | 10 a 240; usada quando a tarefa não tem estimativa. Padrão 50. |
| `limite` | não | Máximo de candidatos por espaço (1 a 100). Padrão 10. |
| `espacos[].id`, `inicio`, `fim` | sim | `fim` depois de `inicio`; ISO-8601 com fuso. |
| `tarefas[].id` | sim | Devolvido no ranking como `tarefaId`. |
| `tarefas[].tipo` | não | `prova`, `trabalho`, `exercicio`, `leitura` ou `outro` (padrão). |
| `tarefas[].prioridade` | não | 1 a 10, padrão 5. |
| `tarefas[].prazo` | não | `null` ou ausente = sem prazo. |
| `tarefas[].minutosEstimados` | não | 15 a 1440; `null` = usa `duracaoMinutos`. |
| `tarefas[].situacao` | não | `concluida` é ignorada. Padrão `pendente`. |
| `tarefas[].disciplina` | não | `dificuldade` e `peso`, de 1 a 5, cada um opcional. |

### `ranking` (servidor → cliente)

```json
{
  "tipo": "ranking",
  "porEspaco": [
    {
      "espacoId": "e1",
      "candidatos": [
        {
          "tarefaId": "672006000000000000000002",
          "nota": 0.78,
          "minutosNoEspaco": 90,
          "parcial": false,
          "composicao": { "urgencia": 0.75, "importancia": 0.74, "encaixe": 0.93 }
        }
      ]
    }
  ],
  "semEspaco": [
    { "tarefaId": "672006000000000000000003", "motivo": "nenhum_espaco_antes_do_prazo" }
  ]
}
```

- `porEspaco` tem **um item por espaço enviado, na mesma ordem**; `candidatos` vem da maior para a menor nota (vazio se ninguém serve).
- A mesma tarefa pode aparecer em vários espaços: o servidor **ranqueia, não aloca**. Escolher qual tarefa vai em qual espaço, sem repetir, é decisão de quem chama.
- `parcial: true` quando a tarefa precisa de mais minutos que o espaço; `minutosNoEspaco` é o que caberia ali.
- `semEspaco`: tarefas ativas que não são candidatas em nenhum espaço. Motivos: `sem_espacos` ou `nenhum_espaco_antes_do_prazo`.

### Outros comunicados

| Tipo | Sentido | Quando |
| --- | --- | --- |
| `pedidoParaSair` | cliente → servidor | Encerra a conexão (sem resposta). Fechar o socket também funciona. |
| `erro` (`{ "mensagem": "..." }`) | servidor → cliente | Pedido inválido (JSON quebrado, tipo desconhecido, campo fora do intervalo...). A conexão continua aberta, e uma mensagem grande demais fecha a conexão. |
| `comunicadoDeDesligamento` | servidor → cliente | O comando `desativar` foi dado no servidor. |

## Critério de prioridade

```text
nota = 0,45 × urgência + 0,35 × importância + 0,20 × encaixe        (cada parte de 0 a 1)
```

| Parte | Peso | Cálculo |
| --- | --- | --- |
| **Urgência** | 45% | Sem prazo: 0,1. Atrasada ou sem folga: 1. Senão `1 − folga / 14 dias`, onde `folga = prazo − agora − esforço`. É medida a partir de **agora** (e não do espaço) para a nota não favorecer espaços tardios. |
| **Importância** | 35% | `prioridade / 10`, +0,10 se for `prova`, +0,05 se `trabalho`, +0,02 por ponto de `peso` da disciplina acima ou abaixo de 3. Máximo 1. |
| **Encaixe** | 20% | 60% tamanho: cabe inteira = `1 − 0,5 × sobra / espaço`; parcial = 0,4. 40% foco: tarefa difícil (prova, trabalho ou disciplina com dificuldade ≥ 4) vale 1,0 se o espaço começa na janela de foco e 0,4 fora; as demais, 0,7. |

Regras fixas, que não são pesos:

- Tarefa concluída nunca é candidata.
- A sessão precisa **terminar antes do prazo**. Tarefa já atrasada pode entrar em qualquer espaço.
- Espaços com menos de 15 minutos são ignorados.
- **Desempate:** nota maior, prazo mais cedo (sem prazo por último), prioridade maior, `id`.

Os pesos são constantes em `ranking/CalculadoraDeRanking.java`.

## Uso a partir do Node

```js
import net from 'node:net';

function pedirRanking(pedido, porta = 3000) {
    return new Promise((resolve, reject) => {
        const socket = net.connect(porta, '127.0.0.1');
        let buffer = '';
        socket.setEncoding('utf8');
        socket.on('connect', () => socket.write(JSON.stringify({ tipo: 'pedidoDeRanking', ...pedido }) + '\n'));
        socket.on('data', (parte) => {
            buffer += parte;
            if (!buffer.includes('\n')) return;
            socket.end();
            const resposta = JSON.parse(buffer.split('\n')[0]);
            resposta.tipo === 'erro' ? reject(new Error(resposta.mensagem)) : resolve(resposta);
        });
        socket.on('error', reject);
    });
}
```

A integração com a API (rota, montagem dos espaços livres, tratamento do servidor fora do ar) é a issue #35/#36 e não faz parte desta entrega.

## Limitações conhecidas (versão inicial)

- Só ranqueia; não faz a alocação final nem evita sobreposição entre as sessões sugeridas.
- A preferência `antifadiga` (pausas) ainda não entra no cálculo.
- Tarefas maiores que o espaço aparecem como parciais, mas o servidor não controla o que sobra para outro espaço.
- Sem testes automatizados (JUnit) ainda: ficam para a issue #37.
