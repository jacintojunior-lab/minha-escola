import { aplicarFaviconDinamico } from "./utils/favicon.js"

// =========================
// ESTADO
// =========================

const state = {
  alunos: [],
  turmaSelecionada: "todos",
  situacaoSelecionada: "todos"
}

const STORAGE_KEY = "filtros_alunos"

function salvarFiltros(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    turma: state.turmaSelecionada,
    situacao: state.situacaoSelecionada
  }))
}

function carregarFiltros(){
  const dados = localStorage.getItem(STORAGE_KEY)
  return dados ? JSON.parse(dados) : null
}


// =========================
// PEGAR TURMA DA URL
// =========================

const params = new URLSearchParams(window.location.search)
const turmaURL = params.get("turma")

// =========================
// ELEMENTOS
// =========================

const containerAtalhos = document.getElementById("atalhosTurmas")
const listaAlunos = document.getElementById("listaAlunos")

// =========================
// LOCAL STORAGE
// =========================
import { getAlunos } from "../services/alunosService.js"

// =========================
// AGRUPAR POR TURMA
// =========================

function agruparPorTurma(alunos){

return alunos.reduce((acc, aluno) => {

const turma = (aluno.turma || "Sem turma").trim()

if(!acc[turma]){
acc[turma] = []
}

acc[turma].push(aluno)

return acc

}, {})

}

// =========================
// CRIAR BOTÕES DE TURMA
// =========================

function criarAtalhosTurmas(){

const alunos = state.alunos

containerAtalhos.innerHTML = ""

if(alunos.length === 0){
containerAtalhos.innerHTML = `<p>Nenhum aluno cadastrado.</p>`
return
}

// BOTÃO TODOS
const btnTodos = document.createElement("button")

btnTodos.className = "btn-sec"

if(state.turmaSelecionada === "todos"){
  btnTodos.classList.add("ativo")
}

btnTodos.innerHTML = `TODOS <span class="contador-turma">${alunos.length}</span>`

btnTodos.onclick = () => {
state.turmaSelecionada = "todos"
aplicarFiltros()
marcarAtivo(btnTodos)
}

containerAtalhos.appendChild(btnTodos)

// POR TURMA
const turmas = agruparPorTurma(alunos)

Object.keys(turmas).sort().forEach(turma => {

  const botao = document.createElement("button")
  botao.className = "btn-sec"

  botao.innerHTML = `
  ${turma}
  <span class="contador-turma">${turmas[turma].length}</span>
  `

  if(state.turmaSelecionada === turma){
    botao.classList.add("ativo")
  }

  botao.onclick = () => {
    state.turmaSelecionada = turma
    aplicarFiltros()
    marcarAtivo(botao)
  }

  containerAtalhos.appendChild(botao)

})

}

// =========================
// MARCAR BOTÃO ATIVO
// =========================

function marcarAtivo(botao){
containerAtalhos.querySelectorAll("button")
.forEach(b => b.classList.remove("ativo"))

botao.classList.add("ativo")
}

// =========================
// FORMATAR DATA
// =========================

function formatarData(data){

if(!data) return ""

const partes = data.split("-")
if(partes.length !== 3) return data

const [ano, mes, dia] = partes

const nascimento = new Date(ano, mes - 1, dia)
const hoje = new Date()

let idade = hoje.getFullYear() - nascimento.getFullYear()

if(
hoje.getMonth() < (mes - 1) ||
(hoje.getMonth() === (mes - 1) && hoje.getDate() < dia)
){
idade--
}

return `${dia}/${mes}/${ano} (${idade} anos)`
}

// =========================
// COR DA SITUAÇÃO
// =========================

function corSituacao(situacao){

switch(situacao){

case "Ativo":
return '<span class="status status-ativo">Ativo</span>'

case "Inativo":
return '<span class="status status-inativo">Inativo</span>'

case "Transferido":
return '<span class="status status-transferido">Transferido</span>'

case "Concluído":
return '<span class="status status-concluido">Concluído</span>'

case "Desistente":
return '<span class="status status-desistente">Desistente</span>'

case "Retido":
return '<span class="status status-retido">Retido</span>'

case "Não comparecimento":
return '<span class="status status-nao">Não comparecimento</span>'

default:
return '<span class="status status-ativo">Ativo</span>'

}

}

// =========================
// LISTAR ALUNOS
// =========================

function listarAlunos(alunos){

  listaAlunos.innerHTML = ""

  if(alunos.length === 0){
    listaAlunos.innerHTML = `
    <tr>
      <td colspan="8" style="text-align:center;">
        Nenhum aluno encontrado.
      </td>
    </tr>`
    return
  }

  const fragment = document.createDocumentFragment()

  const listaOrdenada = alunos.slice().sort((a,b) =>
    (a.nome || "").localeCompare(b.nome || "")
  )

  listaOrdenada.forEach(aluno => {

    const tr = document.createElement("tr")

    tr.innerHTML = `
      <td>${aluno.matricula || ""}</td>
      <td>${aluno.nome || ""}</td>
      <td>${formatarData(aluno.nascimento)}</td>
      <td>${aluno.turma || "Sem turma"}</td>
      <td>${aluno.ra || aluno.RA || ""}</td>
      <td>${aluno.eol || aluno.EOL || ""}</td>
      <td>${aluno.inep || aluno.INEP || ""}</td>
      <td>${corSituacao(aluno.situacao)}</td>
      <td><button class="btn-acao btn-editar"><i class="fa-solid fa-pen"></i></button></td>
    `

    const btnEditar = tr.querySelector(".btn-editar")

    btnEditar.addEventListener("click", (e) => {
      e.stopPropagation() // 🔥 importante
      window.location.href = `aluno.html?rga=${aluno.matricula}`
    })

    fragment.appendChild(tr)
  })

  listaAlunos.appendChild(fragment)
}

// =========================
// FILTRO POR SITUAÇÃO
// =========================

function filtrarSituacao(situacao, el){
  state.situacaoSelecionada = situacao

  aplicarFiltros()

  document.querySelectorAll(".filtros-situacao button")
    .forEach(btn => btn.classList.remove("ativo"))

  el.classList.add("ativo")
}

// =========================
// CONTADORES
// =========================

function calcularResumoAlunos(alunos){

  return alunos.reduce((acc, a) => {

    const s = a.situacao || "Ativo"

    acc.todos++

    if(s === "Ativo") acc.ativo++
    if(s === "Inativo") acc.inativo++
    if(s === "Transferido") acc.transferido++
    if(s === "Concluído") acc.concluido++
    if(s === "Desistente") acc.desistente++
    if(s === "Retido") acc.retido++
    if(s === "Não comparecimento") acc.nao++

    return acc

  }, {
    todos: 0,
    ativo: 0,
    inativo: 0,
    transferido: 0,
    concluido: 0,
    desistente: 0,
    retido: 0,
    nao: 0
  })

}

function atualizarContadores(){

const contagem = calcularResumoAlunos(state.alunos)

document.getElementById("count-todos").textContent = `(${contagem.todos})`
document.getElementById("count-ativo").textContent = `(${contagem.ativo})`
document.getElementById("count-inativo").textContent = `(${contagem.inativo})`
document.getElementById("count-transferido").textContent = `(${contagem.transferido})`
document.getElementById("count-concluido").textContent = `(${contagem.concluido})`
document.getElementById("count-desistente").textContent = `(${contagem.desistente})`
document.getElementById("count-retido").textContent = `(${contagem.retido})`
document.getElementById("count-nao").textContent = `(${contagem.nao})`

}

// =========================
// APLICAR FILTROS
// =========================

function aplicarFiltros(){

  let filtrados = [...state.alunos]

  if(state.turmaSelecionada !== "todos"){
    filtrados = filtrados.filter(a =>
      (a.turma || "Sem turma") === state.turmaSelecionada
    )
  }

  if(state.situacaoSelecionada !== "todos"){
    filtrados = filtrados.filter(a =>
      (a.situacao || "Ativo") === state.situacaoSelecionada
    )
  }

  listarAlunos(filtrados)
  salvarFiltros()
}

// =========================
// INICIALIZAÇÃO
// =========================

document.addEventListener("DOMContentLoaded", () => {


  state.alunos = getAlunos() // 🔥 CARREGA UMA VEZ

  criarAtalhosTurmas()
  atualizarContadores()
  aplicarFaviconDinamico()

  const filtrosSalvos = carregarFiltros()

  // PRIORIDADE: URL > STORAGE
  if(turmaURL){
    state.turmaSelecionada = turmaURL
  } else if(filtrosSalvos?.turma){
    state.turmaSelecionada = filtrosSalvos.turma
  }

  if(filtrosSalvos?.situacao){
    state.situacaoSelecionada = filtrosSalvos.situacao
  }

  criarAtalhosTurmas()
  atualizarContadores()

  aplicarFiltros()

  document.querySelectorAll(".filtros-situacao button")
  .forEach(btn => {

    btn.addEventListener("click", () => {

      const tipo = btn.dataset.situacao

      filtrarSituacao(tipo, btn)

    })

  })

  document.querySelectorAll(".filtros-situacao button")
.forEach(btn => {
  if(btn.dataset.situacao === state.situacaoSelecionada){
    btn.classList.add("ativo")
  }
})
    
})