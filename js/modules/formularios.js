import { getAlunos } from "../services/alunosService.js"
import { getTurmas } from "../services/turmasService.js"
import { aplicarFaviconDinamico } from "./utils/favicon.js"

const selectTurma = document.getElementById("selectTurma")
const selectAluno = document.getElementById("selectAluno")
const selectTipoImpressao = document.getElementById("selectTipoImpressao")

const modalResponsavel = document.getElementById("modalResponsavel")
const opcoesResponsavel = document.getElementById("opcoesResponsavel")
const btnCancelarModal = document.getElementById("btnCancelarModal")

let alunos = []
let turmas = []
let formularioSelecionado = null

function alunoAtivo(aluno){
  return (aluno.situacao || "Ativo") === "Ativo"
}

function ordenarTurmas(lista){
  return [...lista].sort((a, b) =>
    (a.nome || "").localeCompare(
      b.nome || "",
      "pt-BR",
      { numeric: true }
    )
  )
}

function carregarTurmas(){

  selectTurma.innerHTML = `
    <option value="">Selecione a turma</option>
  `

  const turmasAtivas = ordenarTurmas(
    turmas.filter(t => (t.status || "Ativa") === "Ativa")
  )

  turmasAtivas.forEach(turma => {
    const option = document.createElement("option")
    option.value = turma.nome
    option.textContent = turma.nome
    selectTurma.appendChild(option)
  })
}

function carregarAlunosDaTurma(){

  const turma = selectTurma.value

  selectAluno.innerHTML = `
    <option value="">Selecione o estudante</option>
  `

  if(!turma) return

  const filtrados = alunos
    .filter(a =>
      alunoAtivo(a) &&
      (a.turma || "") === turma
    )
    .sort((a, b) =>
      (a.nome || "").localeCompare(
        b.nome || "",
        "pt-BR"
      )
    )

  filtrados.forEach(aluno => {
    const option = document.createElement("option")
    option.value = aluno.matricula
    option.textContent = aluno.nome
    selectAluno.appendChild(option)
  })
}

function abrirFormulario(formulario){

  formularioSelecionado = formulario

  const turma = selectTurma.value
  const rga = selectAluno.value

  if(selectTipoImpressao.value === "branco"){
    abrirFormularioBranco(formulario)
    return
  }

  if(!turma || !rga){
    alert("Selecione a turma e o estudante.")
    return
  }

  const aluno = alunos.find(a =>
    String(a.matricula) === String(rga)
  )

  if(!aluno){
    alert("Estudante não encontrado.")
    return
  }

  abrirModalResponsavel(aluno)
}

function abrirFormularioBranco(formulario){

  localStorage.removeItem("responsavelSelecionado")
  localStorage.removeItem("alunoDeclaracaoTemp")

  const url = `formularios/${formulario}.html?branco=1`

  window.open(url, "_blank")
}

function abrirModalResponsavel(aluno){

  opcoesResponsavel.innerHTML = ""

  const responsaveis = []

  if(aluno.mae){
    responsaveis.push({
      tipo: "Mãe",
      nome: aluno.mae,
      rg: aluno.maeRg || "",
      cpf: aluno.maeCpf || ""
    })
  }

  if(aluno.pai){
    responsaveis.push({
      tipo: "Pai",
      nome: aluno.pai,
      rg: aluno.paiRg || "",
      cpf: aluno.paiCpf || ""
    })
  }

  if(aluno.responsavelNome){
    responsaveis.push({
      tipo: "Responsável Legal",
      nome: aluno.responsavelNome,
      rg: aluno.responsavelRg || "",
      cpf: aluno.responsavelCpf || ""
    })
  }

  if(responsaveis.length === 0){
    alert("Este estudante não possui mãe, pai ou responsável legal cadastrado.")
    return
  }

  responsaveis.forEach(resp => {

    const btn = document.createElement("button")
    btn.type = "button"
    btn.className = "btn-sec"
    btn.innerHTML = `
      <i class="fa-solid fa-user"></i>
      ${resp.tipo}: ${resp.nome}
    `

    btn.addEventListener("click", () => {
      imprimirComResponsavel(aluno, resp)
    })

    opcoesResponsavel.appendChild(btn)
  })

  modalResponsavel.classList.add("ativo")
  document.body.classList.add("modal-aberto")
}

function fecharModal(){
  modalResponsavel.classList.remove("ativo")
  document.body.classList.remove("modal-aberto")
}

function imprimirComResponsavel(aluno, responsavel){

  localStorage.removeItem("alunoDeclaracaoTemp")

  localStorage.setItem(
    "responsavelSelecionado",
    JSON.stringify(responsavel)
  )

  const turma = encodeURIComponent(selectTurma.value)
  const rga = encodeURIComponent(aluno.matricula)

  const url =
    `formularios/${formularioSelecionado}.html?` +
    `turma=${turma}&aluno=${rga}`

  fecharModal()

  window.open(url, "_blank")
}

document.addEventListener("DOMContentLoaded", () => {

  aplicarFaviconDinamico()

  alunos = getAlunos()
  turmas = getTurmas()

  carregarTurmas()

  selectTurma.addEventListener(
    "change",
    carregarAlunosDaTurma
  )

  document.querySelectorAll("[data-formulario]")
    .forEach(card => {
      card.addEventListener("click", () => {
        abrirFormulario(card.dataset.formulario)
      })
    })

  btnCancelarModal.addEventListener(
    "click",
    fecharModal
  )

  document.querySelectorAll("[data-formulario-manual]").forEach(card => {
      card.addEventListener("click", () => {

          const arquivo = card.dataset.formularioManual;
          const tipo = card.dataset.tipo || "html";

          if (tipo === "pdf") {
              window.open(`formularios/${arquivo}.pdf`, "_blank");
          } else {
              window.open(`formularios/${arquivo}.html`, "_blank");
          }

      });
      
  });

})