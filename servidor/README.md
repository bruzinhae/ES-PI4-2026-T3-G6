# Servidor de ranking (Java, socket)

Servidor da issue #34. Recebe os **espaços livres** da grade e as **tarefas pendentes** e devolve, para cada espaço, um **vetor de candidatos ordenado por prioridade**. Quem decide o que entra na grade (o backend Node, a Sofia ou o usuário) usa esse ranking.

A arquitetura segue o exemplo do professor, o *Fazedor de Continhas* (cliente-servidor com sockets e threads):

| Fazedor de Continhas | Aqui |
| --- | --- |
| `Servidor` (main, porta 3000, comando `desativar`) | `Servidor` |
| `AceitadoraDeConexao` (thread no `accept()`) | `AceitadoraDeConexao` |
| `SupervisoraDeConexao` (uma thread por cliente, `instanceof`) | `SupervisoraDeConexao` |
| `Parceiro` (socket + fluxos, `receba`, `espie`, `envie`, `adeus`) | `Parceiro` |
| `Teclado` | `Teclado` (a mesma classe do exemplo) |
| `Comunicado`, `PedidoDeOperacao`, `Resultado`, `PedidoParaSair`, `ComunicadoDeDesligamento` | `Comunicado`, `PedidoDeRanking`, `Ranking`, `PedidoDeMetas`, `PrioridadeDeMetas`, `PedidoParaSair`, `ComunicadoDeDesligamento`, `Erro` |
| `Cliente` (console, com menu) | `Cliente` |
| `TratadoraDeComunicadoDeDesligamento` | `TratadoraDeComunicadoDeDesligamento` |

Como no exemplo, **não há pacotes** (todas as classes ficam em `src/main/java`) e o código só usa o que foi ensinado nas aulas: `ArrayList`, `StringBuffer`, genéricos, interfaces e `@Override`. Não há `record`, lambdas, `Map`/`Set`, `Comparator`, `StringBuilder` nem `java.time`. Os modelos são classes comuns com `getX()` e seguem o molde das classes da disciplina: `Cloneable`, `toString`, `equals`, `hashCode`, `compareTo` (quando há ordem), construtor de cópia e `clone`.

As peças que substituem o que a biblioteca faria:

- `DataHora` guarda o instante e o fuso (por exemplo `2026-11-12T15:00:00-03:00`) e escreve o texto ISO-8601.
- `Ordenador` ordena uma `ArrayList` pelo `compareTo` dos elementos (merge sort, estável).
- `FiltroDeComunicados` é a única peça que o exemplo não tem: ler objetos de um fluxo pode executar código de classes inesperadas, então o servidor só aceita as classes dos comunicados e limita o tamanho do que lê.

**Mesmo protocolo do Continhas:** os comunicados são **objetos Java serializados** (`ObjectOutputStream` e `ObjectInputStream`), e a `SupervisoraDeConexao` distingue os pedidos com `instanceof`. O backend em Node não tem as classes Java, então ele escreve e lê o fluxo de bytes da serialização por conta própria (`backend/src/servicos/serializacaoJava.js`). Para isso, cada classe que viaja declara `serialVersionUID = 1L`.

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
javac -d out src/main/java/*.java
java -cp out Servidor            # porta 3000, só localhost
java -cp out Servidor 3100       # outra porta
java -cp out Servidor 3100 0.0.0.0   # (cuidado) escutar em todas as interfaces
```

Para desativar, digite `desativar` no console. Os clientes conectados recebem um `comunicadoDeDesligamento`.

Para testar sem o Node, com o cliente de console (um menu, como o do Fazedor de Continhas):

```bash
java -cp out Cliente                  # localhost, porta 3000
java -cp out Cliente localhost 3100   # outra porta
```

As opções são `R` (pedido de ranking com alocação, montado com dados de exemplo; mostra o ranking e a alocação), `M` (pedido de metas, também de exemplo) e `T` (terminar). Se o servidor for desativado com o cliente aberto, a `TratadoraDeComunicadoDeDesligamento` avisa e encerra o cliente.

Os arquivos de `exemplos/` são corpos de exemplo para a rota `POST /api/ranking` da API Node (veja "Integração com a API Node"); o `Cliente` de console não os lê. A compilação e execução do servidor não dependem de Maven nem de bibliotecas externas.

## Testes automatizados

Os testes JUnit 5 cobrem partições intraclasse de `Tarefa` e `EspacoLivre` e os cenários normal e de erro do serviço `SupervisoraDeConexao`, usando uma conexão TCP local. Requerem Maven; execute na pasta `servidor/`:

```bash
mvn test
```

O relatório para a atividade de Teste OO está em [`RELATORIO-TESTES-OO.md`](RELATORIO-TESTES-OO.md).

## Protocolo

TCP, com os comunicados como **objetos Java serializados** (cabeçalho do fluxo, depois um objeto por mensagem). Pode-se mandar vários pedidos na mesma conexão ou abrir uma conexão por pedido. Limites: 8 MB de fluxo por conexão e só as classes dos comunicados (`FiltroDeComunicados`); conexão parada por mais de 5 minutos é encerrada. O servidor valida cada pedido depois de lê-lo (`valide()`, com as mesmas mensagens de antes) e responde com um `Erro` se algo estiver fora do intervalo.

Os blocos JSON abaixo mostram o **corpo da API Node** (`POST /api/ranking`) e a resposta que ela devolve; o backend transforma esse JSON nos comunicados (`PedidoDeRanking` e `PedidoDeMetas`) e converte a resposta (`Ranking` e `PrioridadeDeMetas`) de volta. As tabelas de campos valem para os dois lados.

| Comunicado | Sentido | Campos |
| --- | --- | --- |
| `PedidoDeRanking` | cliente → servidor | `agora`, `preferencias`, `espacos`, `tarefas`, `limite`, `alocar` |
| `Ranking` | servidor → cliente | `porEspaco`, `semEspaco` e, com `alocar`, a `Alocacao` |
| `PedidoDeMetas` | cliente → servidor | `agora`, `metas`, `quantidadeDeMarcos` |
| `PrioridadeDeMetas` | servidor → cliente | `ranking`, `foco`, `datasDosMarcos` |
| `PedidoParaSair` | cliente → servidor | Encerra a conexão. |
| `Erro` | servidor → cliente | `mensagem`. Pedido fora do intervalo ou falha no cálculo. A conexão continua aberta. |
| `ComunicadoDeDesligamento` | servidor → cliente | O comando `desativar` foi dado no servidor. |

Datas viajam como `DataHora` (segundos, nanossegundos e fuso). O Node converte o texto ISO-8601 em `DataHora` antes de enviar e de volta ao receber.

### `pedidoDeRanking` (cliente → servidor)

```json
{
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
| `preferencias.duracaoMinutos` | não | 10 a 240; usada quando a tarefa não tem estimativa e, na alocação, como tamanho de cada sessão (pode passar até 14 min para absorver um resto pequeno). Padrão 50. |
| `preferencias.antifadiga` | não | Só na alocação: `true` põe uma pausa de 10 min entre sessões seguidas; `false` junta sessões seguidas da mesma tarefa. Padrão `true`. |
| `alocar` | não | `true` pede, além do ranking, a **alocação** (ver "Alocação"). Padrão `false`: a resposta é exatamente a de antes. |
| `limite` | não | Máximo de candidatos por espaço (1 a 100). Padrão 10. |
| `espacos[].id`, `inicio`, `fim` | sim | `fim` depois de `inicio`; ISO-8601 com fuso. |
| `tarefas[].id` | sim | Devolvido no ranking como `tarefaId`. |
| `tarefas[].categoria` | não | `estudos` (padrão) ou `pessoal`. Qualquer outro valor é erro. Tarefa pessoal não depende da janela de foco no encaixe. |
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
- A mesma tarefa pode aparecer em vários espaços: o **ranking** só ordena os candidatos de cada espaço. Para decidir qual tarefa vai em qual espaço, sem repetir, peça a **alocação** (`"alocar": true`).
- `parcial: true` quando a tarefa precisa de mais minutos que o espaço; `minutosNoEspaco` é o que caberia ali.
- `semEspaco`: tarefas ativas que não são candidatas em nenhum espaço. Motivos: `sem_espacos` ou `nenhum_espaco_antes_do_prazo`.

### Alocação (`"alocar": true`)

O ranking sozinho pode indicar a mesma tarefa como primeira de vários espaços. Com `"alocar": true`, a resposta **mantém `porEspaco` e `semEspaco` exatamente como antes** e acrescenta a decisão final, sem tempo repetido nem sessões sobrepostas:

```json
{
  "tipo": "ranking",
  "porEspaco": [ ... ],
  "semEspaco": [ ... ],
  "alocacao": [
    {
      "espacoId": "e1",
      "tarefaId": "672006000000000000000002",
      "inicio": "2026-10-27T14:00:00-03:00",
      "fim": "2026-10-27T14:50:00-03:00",
      "minutos": 50,
      "minutosRestantes": 40,
      "nota": 0.78,
      "composicao": { "urgencia": 0.75, "importancia": 0.74, "encaixe": 0.93 }
    }
  ],
  "semAlocacao": [
    { "tarefaId": "672006000000000000000003", "motivo": "alocacao_parcial", "minutosRestantes": 150 }
  ]
}
```

- `alocacao`: sessões em **ordem cronológica**. `inicio` e `fim` saem no fuso do espaço. `minutosRestantes` é o que ainda falta da tarefa depois da sessão (0 = ficou completa).
- `semAlocacao`: tarefas que ficaram com minutos pendentes. Motivos: `sem_espacos`, `nenhum_espaco_antes_do_prazo` (nenhum espaço serve por causa do prazo), `espacos_insuficientes` (serviam, mas outras tarefas ficaram com o tempo) ou `alocacao_parcial` (alocou parte; veja `minutosRestantes`).
- `alocacaoTruncada: true` aparece se o pedido atingiu o limite de 2000 sessões.

**Como a alocação decide** (algoritmo guloso, em `AlocadoraDeSessoes.java`):
1. Percorre os espaços em ordem cronológica.
2. Em cada espaço, escolhe a melhor candidata (a mesma nota do ranking, calculada com os minutos que ainda faltam) e reserva uma sessão.
3. Desconta os minutos e repete no que sobrou do espaço, até acabar o espaço ou as tarefas.
4. Uma tarefa maior que `duracaoMinutos` vira várias sessões, em espaços diferentes se preciso. Se depois de uma sessão sobrassem menos de 15 min, a sessão absorve o resto (não há sessões minúsculas).
5. Com `antifadiga`, há 10 min de pausa entre sessões seguidas no mesmo espaço. Sem ela, sessões seguidas da mesma tarefa são juntadas em uma só.
6. Se os espaços enviados se sobrepõem, nenhum minuto é reservado duas vezes. A sessão sempre termina antes do prazo (tarefa atrasada pode ir em qualquer espaço).

Para ver no console: opção `R` do `Cliente` com `exemplos/pedido-semana-alocacao.json`.

### `pedidoDeMetas` (cliente → servidor) e `prioridadeDeMetas` (servidor → cliente)

Usado pela Sofia na tela de Metas: o servidor decide qual meta merece atenção primeiro e propõe datas para os marcos novos dela. O Gemini só escreve os textos.

```json
{
  "agora": "2026-11-11T15:00:00-03:00",
  "quantidadeDeMarcos": 3,
  "metas": [
    { "id": "m1", "tipo": "projeto", "prioridade": "alta", "progresso": 0, "prazo": "2026-12-15T23:59:00-03:00" }
  ]
}
```

| Campo | Obrigatório | Regra |
| --- | --- | --- |
| `agora` | não | ISO-8601 com fuso; as datas dos marcos usam o dia e o fuso dele. Padrão: hora do servidor em -03:00. |
| `quantidadeDeMarcos` | não | 1 a 5. Padrão 3. |
| `metas[].id` | sim | Devolvido no ranking como `metaId`. |
| `metas[].tipo` | não | `geral` (padrão), `disciplina`, `habito` ou `projeto`. |
| `metas[].prioridade` | não | `baixa`, `media` (padrão) ou `alta`. |
| `metas[].progresso` | não | 0 a 100. Padrão 0. |
| `metas[].prazo` | não | ISO-8601; ausente = sem prazo. |
| `metas[].situacao` | não | Só `ativa` (padrão) entra; as outras são ignoradas. |

```json
{
  "tipo": "prioridadeDeMetas",
  "ranking": [
    { "metaId": "m1", "nota": 0.55, "atrasada": false,
      "composicao": { "urgencia": 0, "lacuna": 1, "importancia": 1 } }
  ],
  "foco": "m1",
  "datasDosMarcos": ["2026-11-20", "2026-11-28", "2026-12-07"]
}
```

`ranking` vem da maior para a menor nota; `foco` é a primeira (ou `null` sem metas ativas). `datasDosMarcos` vale só para o foco e fica vazia se ele for hábito ou não tiver prazo.

```text
nota = 0,45 × urgência + 0,35 × lacuna + 0,20 × importância        (cada parte de 0 a 1)
```

| Parte | Peso | Cálculo |
| --- | --- | --- |
| **Urgência** | 45% | Sem prazo: 0,1. Prazo vencido: 1. Senão `1 − dias até o prazo / 14`, no mínimo 0. |
| **Lacuna** | 35% | `1 − progresso / 100`. |
| **Importância** | 20% | `baixa` 0,3, `media` 0,6, `alta` 1,0. |

Desempate: prazo mais cedo (sem prazo por último), prioridade maior, `id`. As datas dividem o caminho entre hoje e o prazo em partes iguais, em dias diferentes sempre que couber; meta atrasada recebe hoje. O código está em `CalculadoraDeMetas.java`.

## Critério de prioridade

```text
nota = 0,45 × urgência + 0,35 × importância + 0,20 × encaixe        (cada parte de 0 a 1)
```

| Parte | Peso | Cálculo |
| --- | --- | --- |
| **Urgência** | 45% | Sem prazo: 0,1. Atrasada ou sem folga: 1. Senão `1 − folga / 14 dias`, onde `folga = prazo − agora − esforço`. É medida a partir de **agora** (e não do espaço) para a nota não favorecer espaços tardios. |
| **Importância** | 35% | `prioridade / 10`, +0,10 se for `prova`, +0,05 se `trabalho`, +0,02 por ponto de `peso` da disciplina acima ou abaixo de 3. Máximo 1. |
| **Encaixe** | 20% | 60% tamanho: cabe inteira = `1 − 0,5 × sobra / espaço`; parcial = 0,4. 40% foco: tarefa difícil (prova, trabalho ou disciplina com dificuldade ≥ 4) vale 1,0 se o espaço começa na janela de foco e 0,4 fora; as demais, 0,7. Tarefa `pessoal` nunca é "difícil": sempre 0,7. |

Regras fixas, que não são pesos:

- Tarefa concluída nunca é candidata.
- A sessão precisa **terminar antes do prazo**. Tarefa já atrasada pode entrar em qualquer espaço.
- Espaços com menos de 15 minutos são ignorados.
- **Desempate:** nota maior, prazo mais cedo (sem prazo por último), prioridade maior, `id`.

Os pesos são constantes em `CalculadoraDeRanking.java`.

## Uso a partir do Node

O backend já traz o cliente pronto (`backend/src/servicos/clienteRanking.js`, com o codec de serialização em `serializacaoJava.js`):

```js
import { pedirRanking, pedirPrioridadeDeMetas } from './servicos/clienteRanking.js';

const ranking = await pedirRanking({ agora, espacos, tarefas, alocar: true });
const metas = await pedirPrioridadeDeMetas({ agora, metas: [...] });
```

Os pedidos são os mesmos JSON descritos acima (datas em ISO-8601 com fuso), e as respostas voltam como JSON. Os erros viram `ErroApi`: 400 para pedido inválido, 502 para falha no cálculo, 503 para servidor fora do ar e 504 para demora.

## Integração com a API Node

A API Node funciona como cliente do servidor e disponibiliza `POST /api/ranking` (autenticado). Envie
`espacos` e `tarefas`, com `agora`, `preferencias` e `limite` opcionais; o formato é o mesmo
do pedido de ranking descrito acima, sem o campo `tipo`.
A resposta da rota mantém o formato `{ "tipo": "ranking", "porEspaco": [...], "semEspaco": [...] }`.

Por padrão, a API conecta em `127.0.0.1:3000`, que corresponde à configuração padrão deste
servidor. No backend, configure `RANKING_HOST`, `RANKING_PORT` e `RANKING_TIMEOUT_MS` no `.env`
para alterar o destino e o tempo máximo de resposta. A rota não monta os espaços livres nem
consulta tarefas no banco: o chamador Node deve enviar esses dados no corpo da requisição.

## Limitações conhecidas

- A alocação é gulosa: boa para uma semana de estudo, mas não busca a combinação ótima entre todas as tarefas.
- A pausa antifadiga é fixa (10 min). As preferências `rigidez`, `repeticaoEspacada` e `ajusteDinamico` da tela de foco ainda não entram no cálculo.
- O servidor não guarda nada: persistir as sessões aceitas é função do backend.
- Os testes JUnit atuais (issue #37) cobrem o protocolo e os modelos; a alocação foi validada por scripts de protocolo e ainda não tem testes JUnit próprios.
