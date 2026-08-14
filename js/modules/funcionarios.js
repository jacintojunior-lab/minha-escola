import { getData, setData } from "../core/storage.js"
import { aplicarFaviconDinamico } from "./utils/favicon.js"

import {
  getFuncionarios,
  salvarFuncionarios,
  removerFuncionario,
  salvarOuAtualizarFuncionario
} from "../services/funcionariosService.js"

const state = {
  funcionarios: [],
  editandoRF: null
}

const rfInput = document.getElementById("rf")
const nomeFuncionario = document.getElementById("nomeFuncionario")
const cargoFuncionario = document.getElementById("cargoFuncionario")

// =========================
// INIT
// =========================

function init(){
  state.funcionarios = getFuncionarios()
  render()
  bindEventos()
}

// =========================
// EVENTOS
// =========================

function bindEventos(){

  document.getElementById("formFuncionario")
    .addEventListener("submit", onSubmit)

  document.getElementById("btnExportarCSV")
    ?.addEventListener("click", exportarCSV)

  document.getElementById("importarCSV")
    ?.addEventListener("change", importarCSV)

  document.getElementById("btnImportarCSV")
  ?.addEventListener("click", () => {
    document.getElementById("importarCSV").click()
  })
  
}

// =========================
// SALVAR
// =========================

function onSubmit(e){
  e.preventDefault()

  const funcionario = {
    rf: rf.value.trim(),
    nome: nomeFuncionario.value.trim(),
    cargo: cargoFuncionario.value.trim()
  }

    if(state.editandoRF !== null){
    salvarOuAtualizarFuncionario(funcionario)
    state.editandoRF = null
    }else{
    salvarOuAtualizarFuncionario(funcionario)
    }

  state.funcionarios = getFuncionarios()

  e.target.reset()
  render()
}

// =========================
// RENDER
// =========================

function render(){

  const tabela = document.getElementById("listaFuncionarios")
  tabela.innerHTML = ""

  const listaOrdenada = [...state.funcionarios].sort((a,b)=>
    a.rf.localeCompare(b.rf, undefined, { numeric:true })
  )

  const fragment = document.createDocumentFragment()

  listaOrdenada.forEach((f, index) => {

    const tr = document.createElement("tr")

    tr.innerHTML = `
      <td>${f.rf}</td>
      <td>${f.nome}</td>
      <td>${f.cargo}</td>
      <td class="acoes-funcionario"></td>
    `

    const tdAcoes = tr.querySelector(".acoes-funcionario")

    const container = document.createElement("div")
    container.className = "acoes-turma"

    // botão editar
    const btnEditar = document.createElement("button")
    btnEditar.className = "btn-acao btn-editar"
    btnEditar.innerHTML = `<i class="fa-solid fa-pen"></i>`
    btnEditar.title = "Editar"

    btnEditar.addEventListener("click", () => editar(f.rf))

    // botão excluir
    const btnExcluir = document.createElement("button")
    btnExcluir.className = "btn-acao btn-excluir"
    btnExcluir.innerHTML = `<i class="fa-solid fa-trash"></i>`
    btnExcluir.title = "Excluir"

    btnExcluir.addEventListener("click", () => remover(f.rf))

    container.appendChild(btnEditar)
    container.appendChild(btnExcluir)

    tdAcoes.appendChild(container)

    fragment.appendChild(tr)

  })

  tabela.appendChild(fragment)
}

// =========================
// EDITAR
// =========================

function editar(rf){

  const f = state.funcionarios.find(f => f.rf === rf)
  if(!f) return

  rfInput.value = f.rf
  nomeFuncionario.value = f.nome
  cargoFuncionario.value = f.cargo

  state.editandoRF = rf
}

// =========================
// REMOVER
// =========================

function remover(rf){

  if(!confirm("Tem certeza que deseja excluir este funcionário?")) return

  removerFuncionario(rf)

  state.funcionarios = getFuncionarios()
  render()
}

// =========================
// EXPORTAR CSV
// =========================

function exportarCSV(){

  if(state.funcionarios.length === 0){
    alert("Nenhum funcionário para exportar")
    return
  }

  let csv = "RF;Nome;Cargo\n"

  state.funcionarios.forEach(f => {
    csv += `${f.rf};${f.nome};${f.cargo}\n`
  })

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })

  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = "funcionarios.csv"
  link.click()
}

// =========================
// IMPORTAR CSV
// =========================

function importarCSV(e){

  const file = e.target.files[0]
  if(!file) return

  const reader = new FileReader()

  reader.onload = function(event){

    const linhas = event.target.result.split("\n")
    linhas.shift()

    let adicionados = 0
    let atualizados = 0

    linhas.forEach(linha => {

      if(!linha.trim()) return

      const [rf, nome, cargo] = linha.split(";")
      const rfLimpo = rf?.trim()

      if(!rfLimpo) return

      const index = state.funcionarios.findIndex(f => f.rf === rfLimpo)

      const novo = {
        rf: rfLimpo,
        nome: nome?.trim() || "",
        cargo: cargo?.trim() || ""
      }

      if(index !== -1){
        state.funcionarios[index] = novo
        atualizados++
      }else{
        state.funcionarios.push(novo)
        adicionados++
      }

    })

    setData("funcionarios", state.funcionarios)
    render()

    alert(`Importação concluída!\n\n${adicionados} adicionados\n${atualizados} atualizados`)
  }

  reader.readAsText(file)
}

document.addEventListener("DOMContentLoaded", init)

document.addEventListener("DOMContentLoaded", () => {

  aplicarFaviconDinamico()

})