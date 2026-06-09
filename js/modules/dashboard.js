import { getAlunos } from "../services/alunosService.js"
import { getTurmas } from "../services/turmasService.js"
import { aplicarFaviconDinamico } from "./utils/favicon.js"

const state = {
  alunos: [],
  resumo: {}
}

function carregarDashboard(){

state.alunos = getAlunos()
state.resumo = calcularResumo(state.alunos)

  atualizarKPIs()
  renderTurmas()
  renderPeriodos()
  renderTEG()
  renderAlertas()

}

function calcularResumo(alunos){

  return alunos.reduce((acc, a) => {

    const situacao = a.situacao || "Ativo"
    const teg = a.tegSituacao

    acc.total++

    if(situacao === "Ativo") acc.ativos++
    if(situacao === "Inativo") acc.inativos++
    if(situacao === "Transferido") acc.transferidos++

    if(teg === "Inscrito") acc.tegInscritos++
    if(teg === "Em análise" || teg === "Verificar"){
        acc.tegAnalise++
      }
    if(teg === "Cancelado") acc.tegCancelados++

    if(!a.turma) acc.semTurma++

    if(
      !a.telefoneResponsavel &&
      !a.telefoneMae &&
      !a.telefonePai
    ){
      acc.semTelefone++
    }

    return acc

  }, {
    total: 0,
    ativos: 0,
    inativos: 0,
    transferidos: 0,
    tegInscritos: 0,
    tegAnalise: 0,
    tegCancelados: 0,
    semTurma: 0,
    semTelefone: 0
  })

}

function atualizarKPIs(){

  const r = state.resumo

    document.getElementById("totalAlunos").textContent = r.total
    document.getElementById("totalAtivos").textContent = r.ativos
    document.getElementById("totalInativos").textContent = r.inativos
    document.getElementById("totalTransferidos").textContent = r.transferidos

}

function agruparTurmas(alunos){

  return alunos.reduce((acc, a) => {

    const t = a.turma || "Sem turma"

    acc[t] = (acc[t] || 0) + 1

    return acc

  }, {})

}

function renderTurmas(){

const turmas = agruparTurmas(state.alunos)

  const listaTurmas = document.getElementById("listaTurmas")
  listaTurmas.innerHTML = '<div class="grid-turmas"></div>'

  const grid = listaTurmas.querySelector(".grid-turmas")

  Object.keys(turmas)
    .sort()
    .forEach(t => {

      const div = document.createElement("div")
      div.className = "card-turma"

      div.innerHTML = `
        <div class="turma-nome">${t}</div>
        <div class="turma-total">${turmas[t]}</div>
        <div class="turma-label">alunos</div>
      `

      div.addEventListener("click", () => abrirTurma(t))

      grid.appendChild(div)
    })
}

function renderPeriodos(){

  const alunos = state.alunos

  const turmasConfig = getTurmas()

  const contagem = {
    "Manhã": 0,
    "Tarde": 0,
    "Integral": 0,
    "Noite": 0
  }

  const mapa = {}

  turmasConfig.forEach(t => {
    mapa[t.nome] = t.periodo
  })

  alunos.forEach(a => {
    const periodo = mapa[a.turma]
    if(contagem[periodo] !== undefined){
      contagem[periodo]++
    }
  })

  document.getElementById("periodoManha").textContent = contagem["Manhã"]
  document.getElementById("periodoTarde").textContent = contagem["Tarde"]
  document.getElementById("periodoIntegral").textContent = contagem["Integral"]
  document.getElementById("periodoNoite").textContent = contagem["Noite"]
}

function renderTEG(){

  const r = state.resumo

    document.getElementById("tegInscritos").textContent = r.tegInscritos
    document.getElementById("tegAnalise").textContent = r.tegAnalise
    document.getElementById("tegCancelados").textContent = r.tegCancelados

}

function renderAlertas(){

  const alunos = state.alunos

  const alertas = []

    const r = state.resumo

    if(r.semTelefone > 0){
    alertas.push(`${r.semTelefone} alunos sem telefone`)
    }

    if(r.semTurma > 0){
    alertas.push(`${r.semTurma} alunos sem turma`)
    }

  const lista = document.getElementById("listaAlertas")

  lista.innerHTML = ""

  if(alertas.length === 0){
    lista.innerHTML = "<li>Tudo certo 🎉</li>"
  }else{
    alertas.forEach(a => {
      const li = document.createElement("li")
        li.textContent = a
        lista.appendChild(li)
    })
  }
}

document.addEventListener("DOMContentLoaded", () => {
  aplicarFaviconDinamico()
  carregarDashboard()
})

function abrirTurma(turma){
  window.location.href = `alunos.html?turma=${encodeURIComponent(turma)}`
}

window.abrirTurma = abrirTurma