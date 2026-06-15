import { getAlunos } from "../services/alunosService.js"
import { getTurmas } from "../services/turmasService.js"
import { alunoAtivo } from "./utils/filtros.js"
import { aplicarFaviconDinamico } from "./utils/favicon.js"


/* =========================
   ELEMENTOS
========================= */

const turmaFiltro = document.getElementById("turmaFiltro")
const motivoFiltro = document.getElementById("motivoFiltro")
const situacaoFiltro = document.getElementById("situacaoFiltro")
const busca = document.getElementById("buscaAluno")
const tabela = document.getElementById("listaTransporte")
const condutorFiltro = document.getElementById("condutorFiltro")
const STORAGE_KEY = "filtros_transporte"


/* =========================
   SALVAR FILTROS
========================= */

function salvarFiltros(){

  const filtros = {
    turma: turmaFiltro.value,
    condutor: condutorFiltro.value,
    motivo: motivoFiltro.value,
    situacao: situacaoFiltro.value,
    busca: busca.value
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(filtros)
  )
}

/* =========================
   CARREGAR FILTROS
========================= */

function carregarFiltros(){

  const dados = localStorage.getItem(STORAGE_KEY)

  if(!dados) return null

  const filtros = JSON.parse(dados)

  turmaFiltro.value = filtros.turma || ""
  motivoFiltro.value = filtros.motivo || ""
  situacaoFiltro.value = filtros.situacao || ""
  busca.value = filtros.busca || ""

  return filtros
}

/* =========================
   STATUS COLORIDO
========================= */

function statusTEG(situacao){

switch(situacao){

case "Inscrito":
return '<span class="status status-azul">Inscrito</span>'

case "Verificar":
return '<span class="status status-amarelo">Verificar</span>'

case "Cancelado":
return '<span class="status status-vermelho">Cancelado</span>'

case "Pré-inscrito":
return '<span class="status status-roxo">Pré-inscrito</span>'

case "Sem interesse":
return '<span class="status status-cinza">Sem interesse</span>'

case "Irregular":
return '<span class="status status-vermelho">Irregular</span>'

default:
return '<span class="status status-cinza">-</span>'

}

}

/* =========================
   CARREGAR TURMAS
========================= */

function carregarTurmas(){

  const turmas = getTurmas()

  const turmasAtivas = turmas
    .filter(t => (t.status || "Ativa") === "Ativa")
    .sort((a,b)=>a.nome.localeCompare(b.nome, 'pt-BR', { numeric:true }))

  turmaFiltro.innerHTML = `<option value="">Todas as turmas</option>`

  turmasAtivas.forEach(t => {
    const opt = document.createElement("option")
    opt.value = t.nome
    opt.textContent = t.nome
    turmaFiltro.appendChild(opt)
  })
}

/* =========================
   LISTAR ALUNOS
========================= */

function listar(){

const alunos = getAlunos()

const turma = turmaFiltro.value
const situacao = situacaoFiltro.value
const motivo = motivoFiltro.value
const termo = busca.value.toLowerCase()
const condutor = condutorFiltro.value

let filtrados = alunos.filter(a =>
  a.turma && alunoAtivo(a)
)

filtrados = filtrados.filter(a =>
  (!turma || a.turma === turma) &&
  (!situacao || (a.tegSituacao || "") === situacao) &&
  (!condutor || (a.tegCondutor || "") === condutor) &&
  (!motivo || (a.tegMotivo || "") === motivo) &&
  (!termo || (a.nome || "").toLowerCase().includes(termo))
)

// ordenar por nome
filtrados.sort((a,b)=>
(a.nome || "").localeCompare(b.nome || "")
)

tabela.innerHTML = ""

// vazio
if(filtrados.length === 0){
tabela.innerHTML = `
<tr>
<td colspan="6" style="text-align:center;">
Nenhum aluno encontrado
</td>
</tr>`
return
}

// renderizar
filtrados.forEach(a => {

const tr = document.createElement("tr")

tr.innerHTML = `
<td>${a.nome ?? ""}</td>
<td>${a.turma ?? ""}</td>
<td>${a.tegClassificado ?? "-"}</td>
<td>${a.tegMotivo ?? "-"}</td>
<td>${statusTEG(a.tegSituacao)}</td>
<td>${a.tegCondutor || "-"}</td>
<td>
<a href="aluno.html?rga=${a.matricula}&aba=teg" class="btn-sec">
Ver
</a>
</td>
`

tabela.appendChild(tr)

})

}

/* =========================
   EVENTOS
========================= */

turmaFiltro.addEventListener("change", () => {
  salvarFiltros()
  listar()
})

situacaoFiltro.addEventListener("change", () => {
  salvarFiltros()
  listar()
})

condutorFiltro.addEventListener("change", () => {
  salvarFiltros()
  listar()
})

motivoFiltro.addEventListener("change", () => {
  salvarFiltros()
  listar()
})

busca.addEventListener("input", () => {
  salvarFiltros()
  listar()
})

/* =========================
   INIT
========================= */

document.addEventListener("DOMContentLoaded", () => {

  aplicarFaviconDinamico()

  carregarTurmas()
  carregarCondutores()

  const filtros = carregarFiltros()

  if(filtros?.condutor){
    condutorFiltro.value = filtros.condutor
  }

  listar()
})

function carregarCondutores(){

  const alunos = getAlunos()

  const condutores = [
    ...new Set(
      alunos
        .map(a => (a.tegCondutor || "").trim())
        .filter(c => c !== "")
    )
  ].sort()

  condutorFiltro.innerHTML = `<option value="">Todos os condutores</option>`

  condutores.forEach(c => {
    const opt = document.createElement("option")
    opt.value = c
    opt.textContent = c
    condutorFiltro.appendChild(opt)
  })
}