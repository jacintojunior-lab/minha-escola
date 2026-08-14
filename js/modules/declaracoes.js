import { getAlunos } from "../services/alunosService.js"
import { getTurmasAtivas } from "../services/turmasService.js"
import { getData } from "../core/storage.js"
import { aplicarFaviconDinamico } from "./utils/favicon.js"

const state = {
  alunos: [],
  turmas: [],
  funcionarios: [],
  turmaSelecionada: "",
  alunoSelecionado: null,
  modo: "lista",
  alunoTemp: null
}

const STORAGE_FUNCIONARIO = "declaracoes_funcionario"

function init(){
  state.alunos = getAlunos()
  state.turmas = getTurmasAtivas()
  state.funcionarios = getData("funcionarios")

  carregarTurmas()
  carregarFuncionarios()
  preencherTurmasManual() // 🔥 FALTAVA ISSO
  bindEventos()
}

// =========================
// NOVAS FUNÇÕES
// =========================

function onChangeTurma(){

  state.turmaSelecionada = document.getElementById("selectTurma").value

  const select = document.getElementById("selectAluno")

  select.innerHTML = `<option value="">Selecione o estudante</option>`

  const alunosFiltrados = state.alunos
    .filter(a =>
      a.turma === state.turmaSelecionada &&
      (a.situacao || "Ativo") === "Ativo"
    )
    .sort((a,b)=>a.nome.localeCompare(b.nome))

  alunosFiltrados.forEach(a => {
    const opt = document.createElement("option")
    opt.value = a.matricula
    opt.textContent = a.nome
    select.appendChild(opt)
  })
}

function bindEventos(){

  // =========================
  // TURMA
  // =========================
  document.getElementById("selectTurma")
    .addEventListener("change", onChangeTurma)

  // =========================
  // MODOS
  // =========================
  document.getElementById("btnLista")
    .addEventListener("click", () => definirModo("lista"))

  document.getElementById("btnRGA")
    .addEventListener("click", () => definirModo("rga"))

  document.getElementById("btnManual")
    .addEventListener("click", () => definirModo("manual"))

  // =========================
  // RGA
  // =========================
  document.getElementById("btnBuscarRGA")
    .addEventListener("click", buscarAlunoPorRGA)

  // =========================
  // MANUAL
  // =========================
  document.getElementById("manualTurma")
    .addEventListener("change", function(){

      const turmaSelecionada = this.value
      const turma = state.turmas.find(t => t.nome === turmaSelecionada)

      if(turma){
        document.getElementById("manualSerie").value = turma.serie

        document.getElementById("selectTurma").value = turma.nome
        document.getElementById("selectTurma")
          .dispatchEvent(new Event("change"))
      }

    })

  // =========================
  // CARDS
  // =========================
  document.getElementById("cardEscolaridade")
    .addEventListener("click", abrirDeclaracaoImpressao)

  document.getElementById("cardTransferencia")
    .addEventListener("click", abrirModalTransferenciaEscolar)

  // =========================
  // MODAL
  // =========================
  document.getElementById("btnConfirmarTransferencia")
    .addEventListener("click", confirmarTransferenciaEscolar)

  document.getElementById("btnCancelarTransferencia")
    .addEventListener("click", fecharModalTransferenciaEscolar)

  // =========================
  // SALVAR INFORMAÇÃO - FUNCIONÁRIO SELECIONADO
  // =========================
  document.getElementById("selectFuncionario")
  .addEventListener("change", function(){

    localStorage.setItem(
      STORAGE_FUNCIONARIO,
      this.value
    )

  })
}

function getAlunoSelecionado(){

  if(state.modo === "lista"){
    return state.alunos.find(a =>
      a.matricula === document.getElementById("selectAluno").value
    )
  }

  if(state.modo === "rga"){
    return state.alunoTemp
  }

  if(state.modo === "manual"){
    return {
      nome: document.getElementById("manualNome").value,
      nascimento: document.getElementById("manualNascimento").value,
      ra: document.getElementById("manualRA").value
    }
  }

  return null
}

// =========================
// CARREGAR TURMAS
// =========================

function carregarTurmas(){

  const select = document.getElementById("selectTurma")

  select.innerHTML = `<option value="">Selecione a turma</option>`

  state.turmas
    .sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR", { numeric: true })
    )
    .forEach(t => {

      const opt = document.createElement("option")
      opt.value = t.nome
      opt.textContent = t.nome

      select.appendChild(opt)

    })

}

// =========================
// CARREGAR FUNCIONÁRIOS
// =========================

function carregarFuncionarios(){

const funcionarios = state.funcionarios
const select = document.getElementById("selectFuncionario")

// 🔥 LIMPA ANTES DE PREENCHER
select.innerHTML = `<option value="">Selecione o responsável</option>`

funcionarios.forEach(f => {
const opt = document.createElement("option")
opt.value = f.rf
opt.textContent = `${f.nome} - ${f.cargo}`
select.appendChild(opt)
})

const funcionarioSalvo = localStorage.getItem(STORAGE_FUNCIONARIO)

if(funcionarioSalvo){
  select.value = funcionarioSalvo
}

}

// =========================
// UTIL
// =========================

function abrirDeclaracaoImpressao(){

  let alunoFinal = null

  // 🔥 USANDO STATE CORRETO
  if(state.modo === "lista"){
    alunoFinal = state.alunos.find(a =>
      a.matricula === document.getElementById("selectAluno").value
    )
  }

  if(state.modo === "rga"){
    alunoFinal = state.alunoTemp
  }

  if(state.modo === "manual"){
    alunoFinal = {
      nome: document.getElementById("manualNome").value,
      nascimento: document.getElementById("manualNascimento").value,
      ra: document.getElementById("manualRA").value
    }
  }

  if(!alunoFinal){
    alert("Selecione um aluno")
    return
  }

  // 🔥 SALVA CORRETO
  localStorage.setItem("alunoDeclaracaoTemp", JSON.stringify(alunoFinal))

  const turma = document.getElementById("selectTurma").value
  const funcionario = document.getElementById("selectFuncionario").value

  if(!turma || !funcionario){
    alert("Selecione turma e responsável")
    return
  }

  const alunoId = document.getElementById("selectAluno").value

    const url = `declaracoes/declaracao-escolaridade.html?turma=${turma}&aluno=${alunoId}&funcionario=${funcionario}`

  window.open(url, "_blank")
}

// MODAL TRANSFERÊNCIA
function abrirModalTransferenciaEscolar(){
  const modal = document.getElementById("modalTransferenciaEscolar")

  modal.classList.add("ativo")
  document.body.classList.add("modal-aberto")
}

function fecharModalTransferenciaEscolar(){
  const modal = document.getElementById("modalTransferenciaEscolar")

  modal.classList.remove("ativo")
  document.body.classList.remove("modal-aberto")
}


window.addEventListener("click", function(e){

const modal = document.getElementById("modalTransferenciaEscolar")

// se clicar fora do conteúdo
if(e.target === modal){
fecharModalTransferenciaEscolar()
}

})

// Fechar modal com a tecla ESC
document.addEventListener("keydown", function(e){

  if(e.key !== "Escape") return

  const modal = document.getElementById("modalTransferenciaEscolar")

  if(modal.classList.contains("ativo")){
    fecharModalTransferenciaEscolar()
  }

})


// CONFIRMAR TRANSFERÊNCIA
function confirmarTransferenciaEscolar(){

const opcao = document.querySelector('input[name="historico"]:checked')

if(!opcao){
alert("Selecione uma opção")
return
}

const deveHistorico = opcao.value === "sim"

fecharModalTransferenciaEscolar()

abrirDeclaracaoTransferencia(deveHistorico)

}

// DEVE HISTÓRICO

function abrirDeclaracaoTransferencia(deveHistorico){

const turma = document.getElementById("selectTurma").value
const aluno = document.getElementById("selectAluno").value
const funcionario = document.getElementById("selectFuncionario").value

const url = `declaracoes/declaracao-transferencia.html?turma=${turma}&aluno=${aluno}&funcionario=${funcionario}&historico=${deveHistorico}`

window.open(url, "_blank")

}

window.abrirModalTransferenciaEscolar = abrirModalTransferenciaEscolar
window.fecharModalTransferenciaEscolar = fecharModalTransferenciaEscolar
window.confirmarTransferenciaEscolar = confirmarTransferenciaEscolar
window.abrirDeclaracaoImpressao = abrirDeclaracaoImpressao


function definirModo(modo){

  state.modo = modo

  // 🔥 BOTÕES (ativo visual)
  document.querySelectorAll(".modo-btn").forEach(btn =>
    btn.classList.remove("ativo")
  )

  if(modo === "lista"){
    document.getElementById("btnLista").classList.add("ativo")
  }

  if(modo === "rga"){
    document.getElementById("btnRGA").classList.add("ativo")
  }

  if(modo === "manual"){
    document.getElementById("btnManual").classList.add("ativo")
  }

  // 🔥 MOSTRAR / ESCONDER MODOS
  document.getElementById("modoRGA").style.display =
    modo === "rga" ? "block" : "none"

  document.getElementById("modoManual").style.display =
    modo === "manual" ? "block" : "none"

  // 🔥 RESET DE DADOS (importante)
  state.alunoTemp = null

  document.getElementById("selectAluno").value = ""

}

function buscarAlunoPorRGA(){

  const rga = document.getElementById("buscarRGA").value

  const alunos = state.alunos

  const aluno = alunos.find(a => a.rga === rga || a.matricula === rga)

  if(!aluno){
    alert("Aluno não encontrado")
    return
  }

  state.alunoTemp = aluno

    // 🔥 AUTO-PREENCHER TURMA
    document.getElementById("selectTurma").value = aluno.turma

    // 🔥 DISPARAR EVENTO para carregar alunos da turma
    document.getElementById("selectTurma").dispatchEvent(new Event("change"))

    // 🔥 AGUARDA carregar lista e seleciona aluno
    setTimeout(() => {
    document.getElementById("selectAluno").value = aluno.matricula
    }, 100)

    alert("Aluno encontrado: " + aluno.nome)
}


function preencherTurmasManual(){

  const turmas = getTurmasAtivas()
  const select = document.getElementById("manualTurma")

  select.innerHTML = `<option value="">Selecione a turma</option>`

  turmas
    .sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR", { numeric: true })
    )
    .forEach(t => {

      const opt = document.createElement("option")
      opt.value = t.nome
      opt.textContent = t.nome

      select.appendChild(opt)

    })

}

document.addEventListener("DOMContentLoaded", init)

document.addEventListener("DOMContentLoaded", () => {

  aplicarFaviconDinamico()
  
})
