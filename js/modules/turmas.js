import { getTurmas } from "../services/turmasService.js"
import { getAlunos } from "../services/alunosService.js"
import { getData, setData } from "../core/storage.js"
import { aplicarFaviconDinamico } from "./utils/favicon.js"

const state = {
  turmas: [],
  alunos: [],
  turmaEditando: null
}

function init(){
  state.turmas = getTurmas()
  state.alunos = getAlunos()

  renderTurmas()
  bindEventos()
}

// =========================
// CADASTRAR TURMA
// =========================

function bindEventos(){

  document.getElementById("formTurma")
    .addEventListener("submit", onSubmitTurma)

    document.querySelector("#modalTurma .btn-danger")
    .addEventListener("click", () => {

    if(!state.turmaEditando) return

    excluirTurmaConfirmacao(state.turmaEditando)
    fecharModalTurma()
  })

  document.querySelector("#modalTurma .btn-cancelar")
  .addEventListener("click", fecharModalTurma)

  document.getElementById("formEditarTurma")
  .addEventListener("submit", onSubmitEditarTurma)

  document.getElementById("btnExportarTurmas")
  .addEventListener("click", exportarTurmasCSV)

  document.getElementById("importarTurmasCSV")
    ?.addEventListener("change", importarTurmasCSV)

  document.getElementById("btnImportarTurmas")
  .addEventListener("click", () => {
    document.getElementById("importarTurmasCSV").click()
  })

}

function onSubmitTurma(e){

  e.preventDefault()

  const nova = {
    nome: nomeTurma.value.trim(),
    periodo: periodo.value,
    horario: horario.value,
    capacidade: parseInt(capacidade.value),
    serie: serie.value,
    tipoEnsino: tipoEnsino.value,
    status: statusTurma.value || "Ativa",
    anoLetivo: anoLetivoTurma.value || new Date().getFullYear(),
    professor: professorTurma.value.trim()
  }

  if(state.turmas.some(t => t.nome === nova.nome)){
    alert("Turma já existe")
    return
  }

  state.turmas.push(nova)
  setData("turmas", state.turmas)

  e.target.reset()

  renderTurmas()
}

function onSubmitEditarTurma(e){

  e.preventDefault()

  let turmas = getTurmas()

  const index = turmas.findIndex(t => t.nome === state.turmaEditando)

  if(index === -1) return

  turmas[index] = {
    nome: editNome.value.trim(),
    periodo: editPeriodo.value,
    horario: editHorario.value,
    capacidade: parseInt(editCapacidade.value),
    serie: editSerie.value,
    tipoEnsino: editTipoEnsino.value,
    status: editStatusTurma.value || "Ativa",
    anoLetivo: editAnoLetivoTurma.value || "",
    professor: editProfessorTurma.value.trim()
  }

  setData("turmas", turmas)
  state.turmas = turmas

  fecharModalTurma()
  renderTurmas()
}

// =========================
// STATUS DA TURMA
// =========================

function statusTurma(qtd, capacidade){

if(qtd >= capacidade){
return {texto:"Lotada", classe:"status-lotada"}
}

if(qtd >= capacidade * 0.8){
return {texto:"Quase cheia", classe:"status-quase"}
}

return {texto:"Disponível", classe:"status-ok"}

}

// =========================
// LISTAR
// =========================

function renderTurmas(){

  const container = document.getElementById("listaTurmas")
  container.innerHTML = ""

  const turmasOrdenadas = ordenarTurmas(state.turmas)
  const grupos = agruparPorPeriodo(turmasOrdenadas)

  Object.entries(grupos).forEach(([periodo, turmas]) => {

    if(!turmas.length) return

    const titulo = document.createElement("h3")
    titulo.className = "titulo-periodo"
    titulo.textContent = periodo

    const grid = document.createElement("div")
    grid.className = "grid-turmas"

    turmas.forEach(t => {
      grid.appendChild(criarCardTurma(t))
    })

    container.appendChild(titulo)
    container.appendChild(grid)

  })
}

function criarCardTurma(t){

  const qtd = state.alunos.filter(a => a.turma === t.nome).length
  const porcentagem = Math.min((qtd / t.capacidade) * 100, 100)

  const { texto, classe } = statusTurma(qtd, t.capacidade)

  const card = document.createElement("div")
  card.className = `turma-card ${classe}`

card.innerHTML = `
  <div class="topo-turma">
    <span class="nome-turma">${t.nome}</span>
    <span class="qtd">${qtd}/${t.capacidade}</span>
  </div>

  <div class="info-turma">
    ${t.periodo} • ${t.horario}
  </div>

  <div class="info-turma">
    ${t.status || "Ativa"} • Ano: ${t.anoLetivo || "-"}
  </div>

  <div class="info-turma">
    Prof.: ${t.professor || "-"}
  </div>

  <div class="barra">
    <div class="barra-preenchida" style="width:${porcentagem}%"></div>
  </div>

  <div class="rodape-turma">

    <div class="status-linha">
        <span class="status ${classe}">
        ${texto}
        </span>
    </div>

    <div class="acoes-turma">
        <button class="btn-acao visualizar" title="Visualizar turma">
        <i class="fa-solid fa-eye"></i>
        </button>

        <button class="btn-acao editar" title="Editar turma">
        <i class="fa-solid fa-pen"></i>
        </button>

        <button class="btn-acao excluir" title="Excluir turma">
        <i class="fa-solid fa-trash"></i>
        </button>
    </div>

    </div>
  </div>
`

// botão visualizar
card.querySelector(".visualizar")
  .addEventListener("click", (e) => {
    e.stopPropagation()
    visualizarTurma(t.nome)
  })

// botão editar
card.querySelector(".editar")
  .addEventListener("click", (e) => {
    e.stopPropagation()
    abrirModalEdicao(t)
  })

// botão excluir
card.querySelector(".excluir")
  .addEventListener("click", (e) => {
    e.stopPropagation()
    excluirTurmaConfirmacao(t.nome)
  })

  // 🔥 EVENTOS SEM onclick
  card.addEventListener("click", () => visualizarTurma(t.nome))

  return card
}

function agruparPorPeriodo(turmas){

  const grupos = {
    "Manhã": [],
    "Tarde": [],
    "Integral": [],
    "Noite": []
  }

  turmas.forEach(t => {
    if(grupos[t.periodo]){
      grupos[t.periodo].push(t)
    }
  })

  return grupos
}

function ordenarTurmas(lista){

  return [...lista].sort((a, b) => {

    const parseTurma = (nome) => {
      const match = nome.match(/^(\d+)([A-Z])$/)
      if(!match) return { numero: 999, letra: "Z" }

      return {
        numero: parseInt(match[1]),
        letra: match[2]
      }
    }

    const tA = parseTurma(a.nome)
    const tB = parseTurma(b.nome)

    // primeiro número (série)
    if(tA.numero !== tB.numero){
      return tA.numero - tB.numero
    }

    // depois letra
    return tA.letra.localeCompare(tB.letra)
  })
}

function abrirModalEdicao(t){

  state.turmaEditando = t.nome

  editNome.value = t.nome
  editPeriodo.value = t.periodo
  editHorario.value = t.horario
  editCapacidade.value = t.capacidade
  editSerie.value = t.serie || ""
  editTipoEnsino.value = t.tipoEnsino || ""
  editStatusTurma.value = t.status || "Ativa"
  editAnoLetivoTurma.value = t.anoLetivo || ""
  editProfessorTurma.value = t.professor || ""

  document.getElementById("modalTurma").classList.add("ativo")
  document.body.classList.add("modal-aberto")
}

function excluirTurmaConfirmacao(nome){

  if(!confirm("Deseja excluir essa turma?")) return

  state.turmas = state.turmas.filter(t => t.nome !== nome)
  setData("turmas", state.turmas)

  renderTurmas()
}

function fecharModalTurma(){
document.getElementById("modalTurma").classList.remove("ativo")
document.body.classList.remove("modal-aberto")
state.turmaEditando = null
}

document.getElementById("modalTurma").addEventListener("click", function(e){

// se clicar no fundo (fora do conteúdo)
if(e.target.id === "modalTurma"){
fecharModalTurma()
}

})

document.addEventListener("keydown", function(e){

if(e.key === "Escape"){
fecharModalTurma()
}

})


function visualizarTurma(nome){

window.location.href = `alunos.html?turma=${encodeURIComponent(nome)}`

}


// Exportar em CSV
function exportarTurmasCSV(){

const turmas = getTurmas()

if(turmas.length === 0){
alert("Nenhuma turma cadastrada")
return
}

// cabeçalho
let csv = "Nome;Série;TipoEnsino;Período;Horário;Capacidade;Status;AnoLetivo;Professor\n"

// dados
turmas.forEach(t => {
csv += `${t.nome};${t.serie || ""};${t.tipoEnsino || ""};${t.periodo};${t.horario};${t.capacidade};${t.status || "Ativa"};${t.anoLetivo || ""};${t.professor || ""}\n`
})

// download
const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })

const link = document.createElement("a")
link.href = URL.createObjectURL(blob)
link.download = "turmas.csv"

link.click()

}


// Importar em CSV
document.getElementById("importarTurmasCSV").addEventListener("change", function(e){

const file = e.target.files[0]

if(!file) return

const reader = new FileReader()

reader.onload = function(event){

const texto = event.target.result
const linhas = texto.split("\n")

// remover cabeçalho
linhas.shift()

let turmas = getTurmas()

let adicionadas = 0
let atualizadas = 0

linhas.forEach(linha => {

if(!linha.trim()) return

const [nome, serie, tipoEnsino, periodo, horario, capacidade, status, anoLetivo, professor] = linha.split(";")

const nomeLimpo = nome?.trim()
if(!nomeLimpo) return

const index = turmas.findIndex(t => t.nome === nomeLimpo)

const novaTurma = {
nome: nomeLimpo,
serie: serie?.trim() || "",
tipoEnsino: tipoEnsino?.trim() || "",
periodo: periodo?.trim() || "",
horario: horario?.trim() || "",
capacidade: parseInt(capacidade) || 0,
status: status?.trim() || "Ativa",
anoLetivo: anoLetivo?.trim() || "",
professor: professor?.trim() || ""
}

if(index !== -1){
turmas[index] = novaTurma
atualizadas++
}else{
turmas.push(novaTurma)
adicionadas++
}

})

setData("turmas", turmas)
state.turmas = turmas

renderTurmas()

alert(`Importação concluída!\n\n${adicionadas} adicionadas\n${atualizadas} atualizadas`)

}

reader.readAsText(file)

})

document.addEventListener("DOMContentLoaded", init)

document.addEventListener("DOMContentLoaded", () => {

  aplicarFaviconDinamico()

})