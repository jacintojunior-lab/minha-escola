import { getData } from "../core/storage.js"
import { getFuncionarios } from "../services/funcionariosService.js"
import { analisarDoc, normalizarTexto } from "../services/docReaderService.js"
import { aplicarFaviconDinamico } from "./utils/favicon.js"
import * as pdfjsLib
  from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs"

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs"

const state = {
  funcionarios: [],
  escola: {},
  arquivoJson: null,
  arquivoPdf: null,
  pdfUrl: null,
  resultados: [],
  resumo: null
}

const el = {}

function init(){
  mapearElementos()

  state.funcionarios = getFuncionarios() || []

  const escola = getData("escola")
  state.escola = Array.isArray(escola) ? {} : (escola || {})

  aplicarFaviconDinamico()
  preencherDataAtual()
  renderBase()
  bindEventos()
  atualizarBotaoAnalisar()
}

function mapearElementos(){
  el.totalFuncionarios = document.getElementById("totalFuncionarios")
  el.nomeEscolaResumo = document.getElementById("nomeEscolaResumo")

  el.dataEdicao = document.getElementById("dataEdicao")
  el.arquivoJson = document.getElementById("arquivoJson")
  el.arquivoPdf = document.getElementById("arquivoPdf")
  el.nomeArquivoJson = document.getElementById("nomeArquivoJson")
  el.nomeArquivoPdf = document.getElementById("nomeArquivoPdf")
  el.btnAnalisarDoc = document.getElementById("btnAnalisarDoc")

  el.secaoProcessamento = document.getElementById("secaoProcessamento")
  el.textoProcessamento = document.getElementById("textoProcessamento")
  el.secaoResultados = document.getElementById("secaoResultados")

  el.resFuncionariosVerificados =
    document.getElementById("resFuncionariosVerificados")
  el.resFuncionariosEncontrados =
    document.getElementById("resFuncionariosEncontrados")
  el.resOcorrenciasEscola =
    document.getElementById("resOcorrenciasEscola")
  el.resTotalOcorrencias =
    document.getElementById("resTotalOcorrencias")

  el.subtituloResultados = document.getElementById("subtituloResultados")
  el.listaResultadosDoc = document.getElementById("listaResultadosDoc")
  el.resultadoVazioDoc = document.getElementById("resultadoVazioDoc")

  el.filtroResultados = document.getElementById("filtroResultados")
  el.filtroTipo = document.getElementById("filtroTipo")
}

function bindEventos(){
  el.arquivoJson.addEventListener("change", onSelecionarJson)
  el.arquivoPdf.addEventListener("change", onSelecionarPdf)
  el.btnAnalisarDoc.addEventListener("click", analisar)

  el.filtroResultados.addEventListener("input", renderResultados)
  el.filtroTipo.addEventListener("change", renderResultados)

  window.addEventListener("beforeunload", limparPdfUrl)
}

function preencherDataAtual(){
  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = String(hoje.getMonth() + 1).padStart(2, "0")
  const dia = String(hoje.getDate()).padStart(2, "0")

  el.dataEdicao.value = `${ano}-${mes}-${dia}`
}

function renderBase(){
  el.totalFuncionarios.textContent = state.funcionarios.length

  el.nomeEscolaResumo.textContent =
    state.escola.nome?.trim() || "Não configurada"
}

function onSelecionarJson(event){
  state.arquivoJson = event.target.files?.[0] || null

  el.nomeArquivoJson.textContent =
    state.arquivoJson?.name || "Selecionar arquivo de dados"

  atualizarBotaoAnalisar()
}

function onSelecionarPdf(event){
  limparPdfUrl()

  state.arquivoPdf = event.target.files?.[0] || null

  if(state.arquivoPdf){
    state.pdfUrl = URL.createObjectURL(state.arquivoPdf)
  }

  el.nomeArquivoPdf.textContent =
    state.arquivoPdf?.name || "Selecionar Diário Oficial em PDF"

  atualizarBotaoAnalisar()
}

function atualizarBotaoAnalisar(){
  el.btnAnalisarDoc.disabled =
    !state.arquivoJson ||
    !state.arquivoPdf ||
    state.funcionarios.length === 0

  if(state.funcionarios.length === 0){
    el.btnAnalisarDoc.title =
      "Cadastre ao menos um funcionário antes de analisar o DOC."
  }else{
    el.btnAnalisarDoc.title = ""
  }
}

async function extrairTextoPdf(file){

  const buffer =
    await file.arrayBuffer()

  const pdf =
    await pdfjsLib
      .getDocument({
        data: buffer
      })
      .promise

  const paginas = []

  for(
    let numeroPagina = 1;
    numeroPagina <= pdf.numPages;
    numeroPagina++
  ){

    el.textoProcessamento.textContent =
      `Lendo PDF — página ${numeroPagina} de ${pdf.numPages}...`

    const pagina =
      await pdf.getPage(numeroPagina)

    const conteudo =
      await pagina.getTextContent()

    const texto =
      conteudo.items
        .map(item => item.str)
        .join(" ")

    paginas.push({
      pagina: numeroPagina,
      texto,
      textoNormalizado:
        normalizarTexto(texto),
      somenteNumeros:
        texto.replace(/\D/g, "")
    })
  }

  return paginas
}

function localizarPaginasResultados(
  resultados,
  paginasPdf
){

  return resultados.map(item => {

    const rf =
      String(item.rf || "")
        .replace(/\D/g, "")

    const nome =
      normalizarTexto(
        item.nome || ""
      )

    const paginasEncontradas = []

    paginasPdf.forEach(pagina => {

      const encontrouRF =
        rf.length >= 5 &&
        pagina.somenteNumeros.includes(rf)

      const encontrouNome =
        nome.length >= 5 &&
        pagina.textoNormalizado.includes(nome)

      if(
        encontrouRF ||
        encontrouNome
      ){
        paginasEncontradas.push(
          pagina.pagina
        )
      }
    })

    return {
      ...item,

      pagina:
        paginasEncontradas[0] || null,

      paginasPdf:
        paginasEncontradas
    }
  })
}

async function analisar(){
  if(!state.arquivoJson || !state.arquivoPdf) return

  mostrarProcessamento(true)
  el.secaoResultados.hidden = true

  try{
    el.textoProcessamento.textContent = "Lendo o arquivo JSON..."

    let textoJson = await state.arquivoJson.text()

    // Remove BOM, espaços e caracteres extras comuns
    textoJson = textoJson
    .replace(/^\uFEFF/, "")
    .trim()

    // O arquivo do DOC pode terminar com ";"
    if(textoJson.endsWith(";")){
    textoJson = textoJson.slice(0, -1).trim()
    }

    let json

    try{
    json = JSON.parse(textoJson)
    }catch(erro){
    console.error("Erro ao interpretar JSON:", erro)

    throw new Error(
        "Não foi possível interpretar o arquivo JSON do Diário Oficial."
    )
    }

    el.textoProcessamento.textContent =
      "Pesquisando funcionários e unidade escolar..."

    // Permite que a interface atualize antes da busca.
    await new Promise(resolve => setTimeout(resolve, 30))

    const analise = analisarDoc({
    json,
    funcionarios: state.funcionarios,
    nomeEscola: state.escola.nome || ""
    })

    el.textoProcessamento.textContent =
    "Localizando publicações no PDF..."

    const paginasPdf =
    await extrairTextoPdf(
        state.arquivoPdf
    )

    state.resultados =
    localizarPaginasResultados(
        analise.resultados,
        paginasPdf
    )

    state.resumo =
    analise.resumo

    renderResumo()
    renderResultados()

    const dataFormatada = formatarData(el.dataEdicao.value)

    el.subtituloResultados.textContent =
      `${dataFormatada ? `Edição de ${dataFormatada} • ` : ""}` +
      `${analise.registrosAnalisados.toLocaleString("pt-BR")} registros do JSON analisados.`

    el.secaoResultados.hidden = false

  }catch(erro){
    console.error(erro)
    alert(
      "Não foi possível analisar o arquivo.\n\n" +
      (erro?.message || "Erro desconhecido.")
    )
  }finally{
    mostrarProcessamento(false)
  }
}

function renderResumo(){
  if(!state.resumo) return

  el.resFuncionariosVerificados.textContent =
    state.resumo.funcionariosVerificados

  el.resFuncionariosEncontrados.textContent =
    state.resumo.funcionariosEncontrados

  el.resOcorrenciasEscola.textContent =
    state.resumo.ocorrenciasEscola

  el.resTotalOcorrencias.textContent =
    state.resumo.totalOcorrencias
}

function renderResultados(){
  const termo = normalizarTexto(el.filtroResultados.value)
  const tipo = el.filtroTipo.value

  let lista = [...state.resultados]

  if(tipo !== "todos"){
    lista = lista.filter(item => item.tipo === tipo)
  }

  if(termo){
    lista = lista.filter(item => {
      const texto = normalizarTexto(
        [
          item.nome,
          item.rf,
          item.cargo,
          item.orgao,
          item.unidade,
          item.serie,
          item.processo,
          item.documento,
          item.trecho
        ].join(" ")
      )

      return texto.includes(termo)
    })
  }

  el.listaResultadosDoc.innerHTML = ""
  el.resultadoVazioDoc.hidden = lista.length !== 0

  if(lista.length === 0){
    return
  }

  const fragment = document.createDocumentFragment()

  lista.forEach(item => {

    const card = document.createElement("article")
    card.className = "publicacao-doc"

    const confianca = dadosConfianca(item)

    card.innerHTML = `
      <div class="publicacao-topo">

        <div class="publicacao-identidade">

          <span class="badge-doc ${confianca.classe}">
            <i class="${confianca.icone}"></i>
            ${escapeHtml(confianca.texto)}
          </span>

          <h3>
            ${escapeHtml(item.nome || "Publicação")}
          </h3>

          <div class="meta-publicacao">

            ${
              item.rf
                ? `
                  <span>
                    <strong>RF:</strong>
                    ${escapeHtml(item.rf)}
                  </span>
                `
                : ""
            }

            ${
              item.cargo
                ? `
                  <span>
                    <strong>
                      ${item.tipo === "escola" ? "Tipo" : "Cargo"}:
                    </strong>
                    ${escapeHtml(item.cargo)}
                  </span>
                `
                : ""
            }

          </div>

        </div>

        <div class="acoes-publicacao-doc">

          ${
            item.link
              ? `
                <button
                  class="btn-link-oficial"
                  type="button"
                  title="Abrir esta publicação no site oficial do Diário Oficial">

                  <i class="fa-solid fa-globe"></i>

                  Publicação oficial
                </button>
              `
              : ""
          }

          <button
            class="btn-ver-pagina"
            type="button"
            ${!item.pagina ? "disabled" : ""}
            title="${
              item.pagina
                ? `Abrir o PDF na página ${item.pagina}`
                : "Página não localizada no PDF"
            }">

            <i class="fa-solid fa-file-pdf"></i>

            ${
              item.pagina
                ? `Ver página ${item.pagina}`
                : "Página não localizada"
            }

          </button>

          <button
            class="btn-baixar-pdf"
            type="button"
            title="Baixar o PDF completo desta edição">

            <i class="fa-solid fa-download"></i>

            Baixar PDF
          </button>

        </div>

      </div>

      <div class="dados-publicacao-doc">

        ${
            item.pagina
                ? `
                <div>
                    <span>Página no PDF</span>
                    <strong>${item.pagina}</strong>
                </div>
                `
                : ""
            }

        ${
          item.orgao
            ? `
              <div>
                <span>Órgão</span>
                <strong>${escapeHtml(item.orgao)}</strong>
              </div>
            `
            : ""
        }

        ${
          item.unidade
            ? `
              <div>
                <span>Unidade</span>
                <strong>${escapeHtml(item.unidade)}</strong>
              </div>
            `
            : ""
        }

        ${
          item.serie
            ? `
              <div>
                <span>Tipo de publicação</span>
                <strong>${escapeHtml(item.serie)}</strong>
              </div>
            `
            : ""
        }

        ${
          item.processo
            ? `
              <div>
                <span>Processo</span>
                <strong>${escapeHtml(item.processo)}</strong>
              </div>
            `
            : ""
        }

        ${
          item.documento
            ? `
              <div>
                <span>Documento</span>
                <strong>${escapeHtml(item.documento)}</strong>
              </div>
            `
            : ""
        }

      </div>

      <div class="trecho-publicacao">

        <i class="fa-solid fa-quote-left"></i>

        <p>
          ${escapeHtml(
            item.trecho || "Trecho não disponível."
          )}
        </p>

      </div>
    `

    const btnPagina =
      card.querySelector(".btn-ver-pagina")

    btnPagina?.addEventListener(
      "click",
      () => abrirPaginaPdf(item.pagina)
    )


    const btnDownload =
      card.querySelector(".btn-baixar-pdf")

    btnDownload?.addEventListener(
      "click",
      baixarPdf
    )


    const btnOficial =
      card.querySelector(".btn-link-oficial")

    btnOficial?.addEventListener(
      "click",
      () => abrirPublicacaoOficial(item.link)
    )

    fragment.appendChild(card)
  })

  el.listaResultadosDoc.appendChild(fragment)
}

function dadosConfianca(item){
  if(item.tipo === "escola"){
    return {
      texto: "Unidade escolar",
      classe: "badge-escola",
      icone: "fa-solid fa-school"
    }
  }

  if(item.confianca === "confirmada"){
    return {
      texto: "RF + nome encontrados",
      classe: "badge-confirmado",
      icone: "fa-solid fa-circle-check"
    }
  }

  if(item.confianca === "rf"){
    return {
      texto: "RF encontrado",
      classe: "badge-rf",
      icone: "fa-solid fa-id-card"
    }
  }

  return {
    texto: "Nome encontrado — conferir",
    classe: "badge-provavel",
    icone: "fa-solid fa-triangle-exclamation"
  }
}

function abrirPublicacaoOficial(link){

  if(!link){
    alert("Esta publicação não possui link oficial.")
    return
  }

  window.open(
    link,
    "_blank",
    "noopener,noreferrer"
  )
}

// ==========================================
// VER PÁGINA NO PDF
// ==========================================

function abrirPaginaPdf(pagina){

  if(!state.pdfUrl){
    alert(
      "Selecione o arquivo PDF da edição."
    )
    return
  }

  if(!pagina){
    alert(
      "Não foi possível localizar a página desta publicação no PDF."
    )
    return
  }

  const destino =
    `${state.pdfUrl}#page=${pagina}`

  window.open(
    destino,
    "_blank",
    "noopener,noreferrer"
  )
}


// ==========================================
// BAIXAR PDF COMPLETO
// ==========================================

function baixarPdf(){

  if(!state.arquivoPdf){
    alert(
      "Selecione o arquivo PDF da edição."
    )
    return
  }

  const url =
    URL.createObjectURL(
      state.arquivoPdf
    )

  const link =
    document.createElement("a")

  link.href = url

  link.download =
    state.arquivoPdf.name ||
    "diario-oficial.pdf"

  document.body.appendChild(link)

  link.click()

  link.remove()

  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 1000)
}

function mostrarProcessamento(ativo){
  el.secaoProcessamento.hidden = !ativo
  el.btnAnalisarDoc.disabled = ativo || !state.arquivoJson || !state.arquivoPdf

  if(!ativo){
    atualizarBotaoAnalisar()
  }
}

function limparPdfUrl(){
  if(state.pdfUrl){
    URL.revokeObjectURL(state.pdfUrl)
    state.pdfUrl = null
  }
}

function formatarData(valor){
  if(!valor) return ""

  const [ano, mes, dia] = valor.split("-")
  if(!ano || !mes || !dia) return ""

  return `${dia}/${mes}/${ano}`
}

function escapeHtml(valor = ""){
  return String(valor)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

document.addEventListener("DOMContentLoaded", init)