// ============================================
// DOC READER SERVICE
// Diário Oficial da Cidade de São Paulo
//
// Estrutura oficial utilizada:
//
// {
//   edicao: [
//     {
//       veiculo,
//       orgao,
//       unidade,
//       serie,
//       processo,
//       documento,
//       link,
//       conteudo
//     }
//   ]
// }
// ============================================


// ============================================
// NORMALIZAÇÃO DE TEXTO
// ============================================

export function normalizarTexto(valor = ""){
  return String(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}


// ============================================
// NORMALIZAÇÃO DO RF
// ============================================

export function normalizarRF(valor = ""){
  return String(valor)
    .replace(/\D/g, "")
    .trim()
}


// ============================================
// CONVERTER HTML DO DOC EM TEXTO
// ============================================

export function htmlParaTexto(html = ""){

  if(!html){
    return ""
  }

  try{

    const parser = new DOMParser()

    const documento = parser.parseFromString(
      String(html),
      "text/html"
    )

    return (documento.body?.textContent || "")
      .replace(/\u00A0/g, " ")
      .replace(/\r/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/\n\s*\n+/g, "\n")
      .trim()

  }catch(erro){

    console.warn(
      "Não foi possível converter o HTML da publicação:",
      erro
    )

    // fallback
    return String(html)
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/\s+/g, " ")
      .trim()
  }
}


// ============================================
// VALIDAR ESTRUTURA DO JSON
// ============================================

export function validarEstruturaDoc(json){

  if(!json || typeof json !== "object"){

    return {
      valido: false,
      mensagem: "O arquivo não contém um objeto JSON válido."
    }
  }

  if(!Array.isArray(json.edicao)){

    return {
      valido: false,
      mensagem:
        'O arquivo não possui a estrutura esperada do DOC: "edicao".'
    }
  }

  return {
    valido: true,
    mensagem: "",
    quantidade: json.edicao.length
  }
}


// ============================================
// TRANSFORMAR EDIÇÃO EM PUBLICAÇÕES
// ============================================

export function transformarJsonEmRegistros(json){

  const validacao = validarEstruturaDoc(json)

  if(!validacao.valido){
    throw new Error(validacao.mensagem)
  }

  return json.edicao.map((publicacao, index) => {

    const conteudoHtml =
      typeof publicacao.conteudo === "string"
        ? publicacao.conteudo
        : ""

    const conteudoTexto =
      htmlParaTexto(conteudoHtml)

    return {

      id:
        publicacao.documento ||
        `doc-${index}`,

      indice: index,

      veiculo:
        publicacao.veiculo || "",

      orgao:
        publicacao.orgao || "",

      unidade:
        publicacao.unidade || "",

      serie:
        publicacao.serie || "",

      processo:
        publicacao.processo || "",

      documento:
        publicacao.documento || "",

      link:
        publicacao.link || "",

      conteudoHtml,

      conteudoTexto,

      conteudoNormalizado:
        normalizarTexto(conteudoTexto)
    }
  })
}


// ============================================
// CRIAR TRECHO DA PUBLICAÇÃO
// ============================================

function criarTrecho(
  texto,
  termo,
  tamanhoAntes = 180,
  tamanhoDepois = 350
){

  if(!texto){
    return ""
  }

  const textoOriginal =
    String(texto)
      .replace(/\s+/g, " ")
      .trim()

  const termoNormalizado =
    normalizarTexto(termo)

  const palavrasTermo =
    termoNormalizado
      .split(" ")
      .filter(Boolean)

  if(palavrasTermo.length === 0){
    return textoOriginal.slice(
      0,
      tamanhoAntes + tamanhoDepois
    )
  }

  /*
   * Procuramos inicialmente pela primeira palavra
   * significativa do termo para conseguir preservar
   * os índices do texto original.
   */

  const primeiraPalavra =
    palavrasTermo.find(p => p.length >= 4) ||
    palavrasTermo[0]

  const textoBusca =
    normalizarTexto(textoOriginal)

  let posicao =
    textoBusca.indexOf(primeiraPalavra)

  if(posicao < 0){
    posicao = 0
  }

  const inicio =
    Math.max(
      0,
      posicao - tamanhoAntes
    )

  const fim =
    Math.min(
      textoOriginal.length,
      posicao + tamanhoDepois
    )

  let trecho =
    textoOriginal
      .slice(inicio, fim)
      .trim()

  if(inicio > 0){
    trecho = `...${trecho}`
  }

  if(fim < textoOriginal.length){
    trecho = `${trecho}...`
  }

  return trecho
}


// ============================================
// RF DENTRO DE UMA PUBLICAÇÃO
// ============================================

function contemRF(
  conteudoTexto,
  rfFuncionario
){

  const rf =
    normalizarRF(rfFuncionario)

  if(rf.length < 5){
    return false
  }

  /*
   * O DOC publica RF de várias maneiras:
   *
   * 777.041.3
   * 698.007.4
   * 886973-1
   * 816.201.8/1
   * RF 623.308-2
   *
   * Removemos pontuação do conteúdo inteiro
   * para comparar somente os números.
   */

  const somenteNumeros =
    String(conteudoTexto)
      .replace(/\D/g, "")

  return somenteNumeros.includes(rf)
}


// ============================================
// NOME DENTRO DE UMA PUBLICAÇÃO
// ============================================

function contemNome(
  conteudoNormalizado,
  nomeFuncionario
){

  const nome =
    normalizarTexto(nomeFuncionario)

  if(nome.length < 5){
    return false
  }

  return conteudoNormalizado.includes(nome)
}


// ============================================
// BUSCAR UM FUNCIONÁRIO
// ============================================

function buscarFuncionario(
  funcionario,
  publicacoes
){

  const resultados = []

  const rf =
    normalizarRF(funcionario.rf)

  const nome =
    normalizarTexto(funcionario.nome)

  if(!rf && !nome){
    return resultados
  }

  publicacoes.forEach(publicacao => {

    const encontrouRF =
      contemRF(
        publicacao.conteudoTexto,
        funcionario.rf
      )

    const encontrouNome =
      contemNome(
        publicacao.conteudoNormalizado,
        funcionario.nome
      )

    if(
      !encontrouRF &&
      !encontrouNome
    ){
      return
    }


    // ========================================
    // CONFIANÇA DA CORRESPONDÊNCIA
    // ========================================

    let confianca = "provavel"

    if(
      encontrouRF &&
      encontrouNome
    ){

      confianca = "confirmada"

    }else if(encontrouRF){

      confianca = "rf"

    }else{

      confianca = "nome"
    }


    // ========================================
    // TERMO PARA CRIAR TRECHO
    // ========================================

    const termoTrecho =
      encontrouNome
        ? funcionario.nome
        : funcionario.rf


    resultados.push({

      tipo: "funcionario",

      chave:
        `funcionario:${rf || nome}:${publicacao.documento}`,

      rf:
        funcionario.rf || "",

      nome:
        funcionario.nome || "",

      cargo:
        funcionario.cargo || "",

      confianca,

      encontrouRF,

      encontrouNome,


      // ======================================
      // DADOS DA PUBLICAÇÃO
      // ======================================

      veiculo:
        publicacao.veiculo,

      orgao:
        publicacao.orgao,

      unidade:
        publicacao.unidade,

      serie:
        publicacao.serie,

      processo:
        publicacao.processo,

      documento:
        publicacao.documento,

      link:
        publicacao.link,


      // ======================================
      // PDF
      //
      // O JSON oficial analisado não possui
      // o número da página do PDF.
      // Será localizado posteriormente.
      // ======================================

      pagina: null,


      // ======================================
      // TRECHO
      // ======================================

      trecho:
        criarTrecho(
          publicacao.conteudoTexto,
          termoTrecho
        )
    })
  })

  return resultados
}


// ============================================
// BUSCAR ESCOLA
// ============================================

function buscarEscola(
  nomeEscola,
  publicacoes
){

  const resultados = []

  const escola =
    normalizarTexto(nomeEscola)

  if(escola.length < 5){
    return resultados
  }

  publicacoes.forEach(publicacao => {

    if(
      !publicacao
        .conteudoNormalizado
        .includes(escola)
    ){
      return
    }

    resultados.push({

      tipo: "escola",

      chave:
        `escola:${escola}:${publicacao.documento}`,

      rf: "",

      nome:
        nomeEscola,

      cargo:
        "Unidade escolar",

      confianca:
        "escola",

      encontrouRF:
        false,

      encontrouNome:
        true,


      // ======================================
      // DADOS DA PUBLICAÇÃO
      // ======================================

      veiculo:
        publicacao.veiculo,

      orgao:
        publicacao.orgao,

      unidade:
        publicacao.unidade,

      serie:
        publicacao.serie,

      processo:
        publicacao.processo,

      documento:
        publicacao.documento,

      link:
        publicacao.link,

      pagina:
        null,

      trecho:
        criarTrecho(
          publicacao.conteudoTexto,
          nomeEscola
        )
    })
  })

  return resultados
}


// ============================================
// REMOVER DUPLICIDADES
// ============================================

function removerDuplicados(lista){

  const mapa = new Map()

  lista.forEach(item => {

    /*
     * Uma publicação é única pela combinação:
     *
     * tipo
     * funcionário/escola
     * documento oficial
     */

    const identificadorPessoa =
      item.tipo === "funcionario"
        ? normalizarRF(item.rf) ||
          normalizarTexto(item.nome)
        : normalizarTexto(item.nome)

    const chave = [
      item.tipo,
      identificadorPessoa,
      item.documento ||
        normalizarTexto(item.trecho)
          .slice(0, 100)
    ].join("|")

    if(!mapa.has(chave)){
      mapa.set(chave, item)
    }
  })

  return [...mapa.values()]
}


// ============================================
// ORDENAR RESULTADOS
// ============================================

function ordenarResultados(lista){

  return [...lista].sort((a, b) => {

    /*
     * Funcionários primeiro.
     */

    if(a.tipo !== b.tipo){

      if(a.tipo === "funcionario"){
        return -1
      }

      if(b.tipo === "funcionario"){
        return 1
      }
    }


    /*
     * Depois por nome.
     */

    const comparacaoNome =
      String(a.nome || "")
        .localeCompare(
          String(b.nome || ""),
          "pt-BR"
        )

    if(comparacaoNome !== 0){
      return comparacaoNome
    }


    /*
     * Depois pelo órgão.
     */

    const comparacaoOrgao =
      String(a.orgao || "")
        .localeCompare(
          String(b.orgao || ""),
          "pt-BR"
        )

    if(comparacaoOrgao !== 0){
      return comparacaoOrgao
    }


    /*
     * Finalmente pelo documento.
     */

    return String(
      a.documento || ""
    ).localeCompare(
      String(b.documento || "")
    )
  })
}


// ============================================
// FUNÇÃO PRINCIPAL
// ============================================

export function analisarDoc({

  json,

  funcionarios = [],

  nomeEscola = ""

}){

  // ==========================================
  // VALIDAR ARQUIVO
  // ==========================================

  const validacao =
    validarEstruturaDoc(json)

  if(!validacao.valido){
    throw new Error(
      validacao.mensagem
    )
  }


  // ==========================================
  // TRANSFORMAR PUBLICAÇÕES
  // ==========================================

  const publicacoes =
    transformarJsonEmRegistros(json)


  // ==========================================
  // BUSCAR
  // ==========================================

  const ocorrencias = []


  funcionarios.forEach(
    funcionario => {

      ocorrencias.push(
        ...buscarFuncionario(
          funcionario,
          publicacoes
        )
      )
    }
  )


  if(nomeEscola){

    ocorrencias.push(
      ...buscarEscola(
        nomeEscola,
        publicacoes
      )
    )
  }


  // ==========================================
  // REMOVER DUPLICIDADES
  // ==========================================

  const semDuplicados =
    removerDuplicados(
      ocorrencias
    )


  // ==========================================
  // ORDENAR
  // ==========================================

  const resultados =
    ordenarResultados(
      semDuplicados
    )


  // ==========================================
  // FUNCIONÁRIOS ENCONTRADOS
  // ==========================================

  const funcionariosEncontrados =
    new Set(

      resultados

        .filter(
          resultado =>
            resultado.tipo ===
            "funcionario"
        )

        .map(
          resultado =>
            normalizarRF(
              resultado.rf
            ) ||
            normalizarTexto(
              resultado.nome
            )
        )
    )


  // ==========================================
  // PUBLICAÇÕES COM RF
  // ==========================================

  const ocorrenciasPorRF =
    resultados.filter(
      resultado =>
        resultado.tipo === "funcionario" &&
        resultado.encontrouRF
    ).length


  // ==========================================
  // PUBLICAÇÕES CONFIRMADAS
  // ==========================================

  const ocorrenciasConfirmadas =
    resultados.filter(
      resultado =>
        resultado.tipo === "funcionario" &&
        resultado.confianca ===
          "confirmada"
    ).length


  // ==========================================
  // RESULTADO FINAL
  // ==========================================

  return {

    registrosAnalisados:
      publicacoes.length,

    publicacoes,

    resultados,

    resumo: {

      funcionariosVerificados:
        funcionarios.length,

      funcionariosEncontrados:
        funcionariosEncontrados.size,

      ocorrenciasEscola:
        resultados.filter(
          resultado =>
            resultado.tipo === "escola"
        ).length,

      totalOcorrencias:
        resultados.length,

      ocorrenciasPorRF,

      ocorrenciasConfirmadas
    }
  }
}