/**
 * servicos/serializacaoJava.js — leitura e escrita do formato de serialização de objetos do Java.
 *
 * O servidor de ranking (Java) conversa por ObjectOutputStream e ObjectInputStream, como o Fazedor de
 * Continhas da disciplina. O Node não tem as classes Java, então este arquivo escreve e lê o fluxo de bytes
 * diretamente, seguindo a "Java Object Serialization Specification" (capítulo 6, "Object Serialization
 * Stream Protocol"). Só cobre o que o servidor usa: objetos comuns, ArrayList, String, Integer, Long,
 * Double e Boolean.
 *
 * Valores que o escritor aceita:
 *   null, string, objeto { _c: 'NomeDaClasse', ...campos }, array (vira ArrayList) e
 *   { _c: 'java.lang.Integer', valor: 5 } para os campos Integer que aceitam null.
 *
 * O leitor devolve: null, string, number (Integer, Long, Double), boolean, array (ArrayList) e
 *   { _c: 'NomeDaClasse', ...campos } para as demais classes.
 */

const TC_NULL = 0x70;
const TC_REFERENCE = 0x71;
const TC_CLASSDESC = 0x72;
const TC_OBJECT = 0x73;
const TC_STRING = 0x74;
const TC_ARRAY = 0x75;
const TC_BLOCKDATA = 0x77;
const TC_ENDBLOCKDATA = 0x78;
const TC_RESET = 0x79;
const TC_BLOCKDATALONG = 0x7a;
const TC_LONGSTRING = 0x7c;

const SC_WRITE_METHOD = 0x01;
const SC_SERIALIZABLE = 0x02;
const SC_EXTERNALIZABLE = 0x04;

const PRIMEIRO_HANDLE = 0x7e0000;
const MAGICO = 0xaced;
const VERSAO = 0x0005;

const STRING = 'Ljava/lang/String;';
const ARRAY_LIST = 'Ljava/util/ArrayList;';
const INTEGER = 'Ljava/lang/Integer;';

/**
 * As classes que o Node escreve. Cada uma precisa do mesmo serialVersionUID e dos mesmos campos da
 * classe Java de mesmo nome (ver servidor/src/main/java). Os campos de um descritor vão ordenados: os
 * primitivos primeiro e depois os objetos, cada grupo por nome, como o Java faz.
 */
const CLASSES = {
  'java.lang.Number': { suid: -8742448824652078965n, flags: SC_SERIALIZABLE, campos: [], super: null },
  'java.lang.Integer': { suid: 1360826667806852920n, flags: SC_SERIALIZABLE, campos: [['value', 'I']], super: 'java.lang.Number' },
  'java.util.ArrayList': { suid: 8683452581122892189n, flags: SC_SERIALIZABLE | SC_WRITE_METHOD, campos: [['size', 'I']], super: null },
  Comunicado: { suid: 1n, flags: SC_SERIALIZABLE, campos: [], super: null },
  PedidoParaSair: { suid: 1n, flags: SC_SERIALIZABLE, campos: [], super: 'Comunicado' },
  PedidoDeRanking: {
    suid: 1n,
    flags: SC_SERIALIZABLE,
    super: 'Comunicado',
    campos: [['agora', 'LDataHora;'], ['preferencias', 'LPreferencias;'], ['espacos', ARRAY_LIST], ['tarefas', ARRAY_LIST], ['limite', 'I'], ['alocar', 'Z']],
  },
  PedidoDeMetas: {
    suid: 1n,
    flags: SC_SERIALIZABLE,
    super: 'Comunicado',
    campos: [['agora', 'LDataHora;'], ['metas', ARRAY_LIST], ['quantidadeDeMarcos', 'I']],
  },
  DataHora: { suid: 1n, flags: SC_SERIALIZABLE, super: null, campos: [['segundos', 'J'], ['nanos', 'I'], ['deslocamento', 'I']] },
  Preferencias: {
    suid: 1n,
    flags: SC_SERIALIZABLE,
    super: null,
    campos: [['janelaFoco', STRING], ['focoMatinal', 'Z'], ['duracaoMinutos', 'I'], ['antifadiga', 'Z']],
  },
  EspacoLivre: { suid: 1n, flags: SC_SERIALIZABLE, super: null, campos: [['id', STRING], ['inicio', 'LDataHora;'], ['fim', 'LDataHora;']] },
  Tarefa: {
    suid: 1n,
    flags: SC_SERIALIZABLE,
    super: null,
    campos: [
      ['id', STRING], ['titulo', STRING], ['categoria', STRING], ['tipo', STRING], ['prioridade', 'I'], ['prazo', 'LDataHora;'],
      ['minutosEstimados', INTEGER], ['dificuldade', INTEGER], ['peso', INTEGER], ['situacao', STRING],
    ],
  },
  Meta: {
    suid: 1n,
    flags: SC_SERIALIZABLE,
    super: null,
    campos: [['id', STRING], ['titulo', STRING], ['tipo', STRING], ['prioridade', STRING], ['progresso', 'I'], ['prazo', 'LDataHora;']],
  },
};

const PRIMITIVOS = 'BCDFIJSZ';
const ehPrimitivo = (assinatura) => assinatura.length === 1 && PRIMITIVOS.includes(assinatura);

// Primitivos antes dos objetos, e cada grupo por nome (a ordem do ObjectStreamClass do Java).
function camposOrdenados(campos) {
  return [...campos].sort((a, b) => {
    const pa = ehPrimitivo(a[1]);
    const pb = ehPrimitivo(b[1]);
    if (pa !== pb) return pa ? -1 : 1;
    return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0;
  });
}

// ---------------------------------------------------------------------------------------------- escrita

function utfModificado(texto) {
  const bytes = [];
  for (let i = 0; i < texto.length; i++) {
    const c = texto.charCodeAt(i);
    if (c >= 0x01 && c <= 0x7f) bytes.push(c);
    else if (c <= 0x7ff) bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    else bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
  }
  return Buffer.from(bytes);
}

export class EscritorJava {
  constructor() {
    this.partes = [];
    this.proximoHandle = 0;
    this.descritores = new Map(); // nome da classe -> handle
    this.tiposEscritos = new Map(); // "Ljava/lang/String;" -> handle
  }

  byte(valor) {
    this.partes.push(Buffer.from([valor & 0xff]));
  }

  u16(valor) {
    const b = Buffer.alloc(2);
    b.writeUInt16BE(valor);
    this.partes.push(b);
  }

  i32(valor) {
    const b = Buffer.alloc(4);
    b.writeInt32BE(valor);
    this.partes.push(b);
  }

  i64(valor) {
    const b = Buffer.alloc(8);
    b.writeBigInt64BE(BigInt(valor));
    this.partes.push(b);
  }

  utf(texto) {
    const bytes = utfModificado(texto);
    if (bytes.length > 0xffff) throw new Error('Texto grande demais para o fluxo de objetos.');
    this.u16(bytes.length);
    this.partes.push(bytes);
  }

  cabecalho() {
    this.u16(MAGICO);
    this.u16(VERSAO);
  }

  buffer() {
    return Buffer.concat(this.partes);
  }

  referencia(handle) {
    this.byte(TC_REFERENCE);
    this.i32(PRIMEIRO_HANDLE + handle);
  }

  texto(valor) {
    const bytes = utfModificado(valor);
    if (bytes.length <= 0xffff) {
      this.byte(TC_STRING);
      this.proximoHandle++;
      this.u16(bytes.length);
    } else {
      this.byte(TC_LONGSTRING);
      this.proximoHandle++;
      this.i64(bytes.length);
    }
    this.partes.push(bytes);
  }

  tipoDeCampo(assinatura) {
    if (this.tiposEscritos.has(assinatura)) {
      this.referencia(this.tiposEscritos.get(assinatura));
      return;
    }
    this.tiposEscritos.set(assinatura, this.proximoHandle);
    this.texto(assinatura);
  }

  descritor(nome) {
    const classe = CLASSES[nome];
    if (!classe) throw new Error(`Classe desconhecida para o fluxo de objetos: ${nome}`);

    if (this.descritores.has(nome)) {
      this.referencia(this.descritores.get(nome));
      return;
    }

    this.byte(TC_CLASSDESC);
    this.utf(nome);
    this.i64(classe.suid);
    this.descritores.set(nome, this.proximoHandle++);
    this.byte(classe.flags);

    const campos = camposOrdenados(classe.campos);
    this.u16(campos.length);
    for (const [campo, assinatura] of campos) {
      this.byte(assinatura.charCodeAt(0));
      this.utf(campo);
      if (!ehPrimitivo(assinatura)) this.tipoDeCampo(assinatura);
    }

    this.byte(TC_ENDBLOCKDATA); // anotações da classe: nenhuma

    if (classe.super) this.descritor(classe.super);
    else this.byte(TC_NULL);
  }

  // Uma classe e as suas superclasses, da mais distante para a própria.
  cadeia(nome) {
    const ret = [];
    for (let atual = nome; atual; atual = CLASSES[atual].super) ret.unshift(atual);
    return ret;
  }

  objeto(valor) {
    if (valor === null || valor === undefined) {
      this.byte(TC_NULL);
      return;
    }
    if (typeof valor === 'string') {
      this.texto(valor);
      return;
    }
    if (typeof valor === 'number') {
      this.objeto({ _c: 'java.lang.Integer', value: valor });
      return;
    }
    if (Array.isArray(valor)) {
      this.arrayList(valor);
      return;
    }
    if (typeof valor !== 'object' || !valor._c) throw new Error('Valor que o fluxo de objetos não sabe escrever.');

    this.byte(TC_OBJECT);
    this.descritor(valor._c);
    this.proximoHandle++; // o handle do próprio objeto

    for (const nome of this.cadeia(valor._c)) {
      for (const [campo, assinatura] of camposOrdenados(CLASSES[nome].campos).filter(([, a]) => ehPrimitivo(a))) {
        this.primitivo(assinatura, valor[campo], campo);
      }
      for (const [campo] of camposOrdenados(CLASSES[nome].campos).filter(([, a]) => !ehPrimitivo(a))) {
        this.objeto(valor[campo]);
      }
    }
  }

  primitivo(assinatura, valor, campo) {
    if (assinatura === 'I') this.i32(Number(valor));
    else if (assinatura === 'J') this.i64(valor);
    else if (assinatura === 'Z') this.byte(valor ? 1 : 0);
    else throw new Error(`Tipo primitivo sem suporte no campo ${campo}: ${assinatura}`);
  }

  arrayList(itens) {
    this.byte(TC_OBJECT);
    this.descritor('java.util.ArrayList');
    this.proximoHandle++;

    this.i32(itens.length); // campo "size"

    // dados escritos pelo writeObject do ArrayList: a capacidade (em um bloco de dados) e os elementos
    this.byte(TC_BLOCKDATA);
    this.byte(4);
    this.i32(itens.length);
    for (const item of itens) this.objeto(item);
    this.byte(TC_ENDBLOCKDATA);
  }
}

// ---------------------------------------------------------------------------------------------- leitura

export class FaltamBytes extends Error {}

function lerUtfModificado(buffer) {
  let ret = '';
  for (let i = 0; i < buffer.length; ) {
    const a = buffer[i];
    if (a < 0x80) {
      ret += String.fromCharCode(a);
      i += 1;
    } else if ((a & 0xe0) === 0xc0) {
      ret += String.fromCharCode(((a & 0x1f) << 6) | (buffer[i + 1] & 0x3f));
      i += 2;
    } else {
      ret += String.fromCharCode(((a & 0x0f) << 12) | ((buffer[i + 1] & 0x3f) << 6) | (buffer[i + 2] & 0x3f));
      i += 3;
    }
  }
  return ret;
}

export class LeitorJava {
  constructor(buffer, posicao = 0) {
    this.buffer = buffer;
    this.posicao = posicao;
    this.handles = [];
  }

  precisa(quantos) {
    if (this.posicao + quantos > this.buffer.length) throw new FaltamBytes();
  }

  byte() {
    this.precisa(1);
    return this.buffer[this.posicao++];
  }

  espie() {
    this.precisa(1);
    return this.buffer[this.posicao];
  }

  u16() {
    this.precisa(2);
    const v = this.buffer.readUInt16BE(this.posicao);
    this.posicao += 2;
    return v;
  }

  i32() {
    this.precisa(4);
    const v = this.buffer.readInt32BE(this.posicao);
    this.posicao += 4;
    return v;
  }

  i64() {
    this.precisa(8);
    const v = this.buffer.readBigInt64BE(this.posicao);
    this.posicao += 8;
    return v;
  }

  double() {
    this.precisa(8);
    const v = this.buffer.readDoubleBE(this.posicao);
    this.posicao += 8;
    return v;
  }

  bytes(quantos) {
    this.precisa(quantos);
    const v = this.buffer.subarray(this.posicao, this.posicao + quantos);
    this.posicao += quantos;
    return v;
  }

  utf() {
    return lerUtfModificado(this.bytes(this.u16()));
  }

  // Lê o cabeçalho do fluxo (0xACED 0x0005). Devolve false se ainda faltam bytes.
  cabecalho() {
    if (this.buffer.length - this.posicao < 4) return false;
    if (this.u16() !== MAGICO || this.u16() !== VERSAO) throw new Error('O servidor Java não respondeu com um fluxo de objetos.');
    return true;
  }

  novoHandle(valor) {
    this.handles.push(valor);
    return this.handles.length - 1;
  }

  descritor() {
    const tag = this.byte();
    if (tag === TC_NULL) return null;
    if (tag === TC_REFERENCE) return this.handles[this.i32() - PRIMEIRO_HANDLE];
    if (tag !== TC_CLASSDESC) throw new Error(`Descritor de classe inesperado (0x${tag.toString(16)}).`);

    const desc = { nome: this.utf(), suid: this.i64(), campos: [], super: null, flags: 0 };
    this.novoHandle(desc);
    desc.flags = this.byte();

    const quantos = this.u16();
    for (let i = 0; i < quantos; i++) {
      const tipo = String.fromCharCode(this.byte());
      const nome = this.utf();
      if (tipo === 'L' || tipo === '[') this.objeto(); // o nome do tipo do campo (uma String)
      desc.campos.push({ nome, tipo });
    }

    this.anotacoes(); // anotações da classe: ignoradas
    desc.super = this.descritor();
    return desc;
  }

  // Lê os blocos de dados e objetos até o TC_ENDBLOCKDATA. Devolve { blocos, objetos }.
  anotacoes() {
    const ret = { blocos: [], objetos: [] };
    for (;;) {
      const tag = this.espie();
      if (tag === TC_ENDBLOCKDATA) {
        this.byte();
        return ret;
      }
      if (tag === TC_BLOCKDATA) {
        this.byte();
        ret.blocos.push(this.bytes(this.byte()));
      } else if (tag === TC_BLOCKDATALONG) {
        this.byte();
        ret.blocos.push(this.bytes(this.i32()));
      } else {
        ret.objetos.push(this.objeto());
      }
    }
  }

  objeto() {
    for (;;) {
      const tag = this.byte();

      if (tag === TC_RESET) {
        this.handles = [];
        continue;
      }
      if (tag === TC_NULL) return null;
      if (tag === TC_REFERENCE) {
        const indice = this.i32() - PRIMEIRO_HANDLE;
        if (indice < 0 || indice >= this.handles.length) throw new Error('Referência inválida no fluxo de objetos.');
        return this.handles[indice];
      }
      if (tag === TC_STRING) {
        const texto = this.utf();
        this.novoHandle(texto);
        return texto;
      }
      if (tag === TC_LONGSTRING) {
        const texto = lerUtfModificado(this.bytes(Number(this.i64())));
        this.novoHandle(texto);
        return texto;
      }
      if (tag === TC_OBJECT) return this.objetoComum();
      if (tag === TC_ARRAY) return this.vetor();

      throw new Error(`Marca inesperada no fluxo de objetos (0x${tag.toString(16)}).`);
    }
  }

  vetor() {
    const desc = this.descritor();
    const lista = [];
    const indice = this.novoHandle(lista);
    const quantos = this.i32();
    const tipo = desc.nome[1];
    for (let i = 0; i < quantos; i++) {
      if (tipo === 'L' || tipo === '[') lista.push(this.objeto());
      else throw new Error('Vetores de primitivos não são usados por este servidor.');
    }
    this.handles[indice] = lista;
    return lista;
  }

  objetoComum() {
    const desc = this.descritor();
    const ret = { _c: desc.nome };
    const indice = this.novoHandle(ret);

    const cadeia = [];
    for (let atual = desc; atual; atual = atual.super) cadeia.unshift(atual);

    let final = ret;
    for (const d of cadeia) {
      if (d.flags & SC_EXTERNALIZABLE) throw new Error('Classe Externalizable sem suporte.');

      for (const campo of d.campos) {
        if (ehPrimitivo(campo.tipo)) ret[campo.nome] = this.primitivo(campo.tipo);
      }
      for (const campo of d.campos) {
        if (!ehPrimitivo(campo.tipo)) ret[campo.nome] = this.objeto();
      }

      if (d.flags & SC_WRITE_METHOD) {
        const extra = this.anotacoes();
        if (d.nome === 'java.util.ArrayList') final = extra.objetos;
      }
    }

    if (desc.nome === 'java.lang.Integer' || desc.nome === 'java.lang.Long' || desc.nome === 'java.lang.Double' || desc.nome === 'java.lang.Boolean') {
      final = ret.value;
      if (typeof final === 'bigint') final = Number(final);
    }

    this.handles[indice] = final;
    return final;
  }

  primitivo(tipo) {
    if (tipo === 'I') return this.i32();
    if (tipo === 'J') return Number(this.i64());
    if (tipo === 'Z') return this.byte() !== 0;
    if (tipo === 'D') return this.double();
    if (tipo === 'B') return this.byte();
    if (tipo === 'S') return this.u16();
    if (tipo === 'C') return this.u16();
    if (tipo === 'F') {
      this.precisa(4);
      const v = this.buffer.readFloatBE(this.posicao);
      this.posicao += 4;
      return v;
    }
    throw new Error(`Tipo primitivo desconhecido: ${tipo}`);
  }
}

/** Escreve um cabeçalho de fluxo seguido dos comunicados (cada um um objeto). */
export function serializar(...comunicados) {
  const escritor = new EscritorJava();
  escritor.cabecalho();
  for (const comunicado of comunicados) escritor.objeto(comunicado);
  return escritor.buffer();
}
