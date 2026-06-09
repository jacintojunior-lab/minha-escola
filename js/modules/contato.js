import { getAlunos } from "../services/alunosService.js"
import { getTurmas } from "../services/turmasService.js"
import { aplicarFaviconDinamico } from "./utils/favicon.js"

const state = {
  alunos: [],
  turmas: [],
  turmaSelecionada: "",
  alunoSelecionado: null
}

function init(){

  aplicarFaviconDinamico()

  state.alunos = getAlunos()
  state.turmas = getTurmas()

  carregarTurmas()
  bindEventos()

  const turmaSalva = localStorage.getItem("contato_turma")
  const alunoSalvo = localStorage.getItem("contato_aluno")

  if(turmaSalva){
    turmaSelect.value = turmaSalva
    state.turmaSelecionada = turmaSalva

    onChangeTurma()

    if(alunoSalvo){
      alunoSelect.value = alunoSalvo
      onChangeAluno()
    }
  }

}

const turmaSelect = document.getElementById("turmaSelect")
const alunoSelect = document.getElementById("alunoSelect")
const contatosDiv = document.getElementById("contatos")

// =========================
// CARREGAR TURMAS
// =========================
function carregarTurmas(){

  const turmas = state.turmas

  // 🔥 apenas turmas ativas
  const turmasAtivas = turmas.filter(t => (t.status || "Ativa") === "Ativa")

  // 🔥 ordenar corretamente (1A, 1B, 2A...)
  turmasAtivas.sort((a, b) => {

    const regex = /^(\d+)([A-Z])$/
    const matchA = a.nome.match(regex)
    const matchB = b.nome.match(regex)

    if(matchA && matchB){
      const numeroA = parseInt(matchA[1])
      const letraA = matchA[2]

      const numeroB = parseInt(matchB[1])
      const letraB = matchB[2]

      if(numeroA !== numeroB){
        return numeroA - numeroB
      }

      return letraA.localeCompare(letraB)
    }

    return a.nome.localeCompare(b.nome)
  })

  // limpar select
  turmaSelect.innerHTML = `<option value="">Selecione a turma</option>`

  // adicionar opções
  turmasAtivas.forEach(t => {
    const opt = document.createElement("option")
    opt.value = t.nome
    opt.textContent = t.nome
    turmaSelect.appendChild(opt)
  })
}

// =========================
// EVENTOS ORGANIZADOS
// =========================
function bindEventos(){

  turmaSelect.addEventListener("change", onChangeTurma)
  alunoSelect.addEventListener("change", onChangeAluno)

}

function onChangeTurma(){

  state.turmaSelecionada = turmaSelect.value

  contatosDiv.innerHTML = ""

  localStorage.setItem("contato_turma", state.turmaSelecionada)

  localStorage.removeItem("contato_aluno")

  alunoSelect.innerHTML = `<option value="">Selecione o aluno</option>`

  const alunosFiltrados = state.alunos
    .filter(a => a.turma === state.turmaSelecionada)
    .sort((a,b)=>a.nome.localeCompare(b.nome))

  alunosFiltrados.forEach(a => {

    const opt = document.createElement("option")
    opt.value = a.matricula
    opt.textContent = a.nome

    alunoSelect.appendChild(opt)

  })
}

function onChangeAluno(){

  const matricula = alunoSelect.value

  localStorage.setItem("contato_aluno", matricula)

  state.alunoSelecionado = state.alunos
    .find(a => a.matricula === matricula)

  if(!state.alunoSelecionado) return

  renderContatos(state.alunoSelecionado)
}

function renderContatos(aluno){

  contatosDiv.innerHTML = ""

  adicionarContato("Mãe", aluno.mae, aluno.telefoneMae)
  adicionarContato("Pai", aluno.pai, aluno.telefonePai)
  adicionarContato("Responsável", aluno.responsavelNome, aluno.telefoneResponsavel)

  adicionarContato(aluno.nomeRecado1, null, aluno.telefoneRecado1)
  adicionarContato(aluno.nomeRecado2, null, aluno.telefoneRecado2)

}

// =========================
// ADICIONAR CONTATO
// =========================

function adicionarContato(tipo, nome, numero){

  if(!numero) return

  const card = document.createElement("div")
  card.className = "contato-card"

  const info = document.createElement("div")
  info.className = "contato-info"

  const nomeDiv = document.createElement("div")
  nomeDiv.className = "contato-nome"
  
  let nomeExibido = ""

    if(nome){
    nomeExibido = `${primeiroNome(nome)} (${tipo})`
    }else{
    nomeExibido = tipo
    }

    nomeDiv.innerHTML = `<i class="fa-solid fa-user"></i> ${nomeExibido}`

  const telefoneDiv = document.createElement("div")
  telefoneDiv.className = "contato-telefone"

  const telFormatado = numero.replace(
    /(\d{2})(\d{5})(\d{4})/,
    "($1) $2-$3"
  )

  telefoneDiv.innerHTML = `<i class="fa-solid fa-phone"></i> ${telFormatado}`

  const link = document.createElement("a")
  link.className = "btn-whatsapp"
  link.target = "_blank"

  const numeroLimpo = numero.replace(/\D/g,"")
  link.href = `https://wa.me/55${numeroLimpo}`

  link.innerHTML = `<i class="fa-brands fa-whatsapp"></i> Conversar`

  info.appendChild(nomeDiv)
  info.appendChild(telefoneDiv)

  const acoes = document.createElement("div")
  acoes.className = "contato-acoes"

  // botão editar
  const btnEditar = document.createElement("a")
  btnEditar.className = "btn-sec"
  if(state.alunoSelecionado){
    btnEditar.href = `aluno.html?rga=${state.alunoSelecionado.matricula}&aba=contato`
  }
  btnEditar.innerHTML = `<i class="fa-solid fa-pen"></i>`

  acoes.appendChild(link) // Botão do WhatsApp
  acoes.appendChild(btnEditar) // Botão do Editar
  
  card.appendChild(info)
  card.appendChild(acoes)

  contatosDiv.appendChild(card)
}

// =========================
// INIT
// =========================
document.addEventListener("DOMContentLoaded", init)

function primeiroNome(nome){
if(!nome || typeof nome !== "string") return ""

return nome.trim().split(" ")[0]
}