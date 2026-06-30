import { aplicarFaviconDinamico } from "./utils/favicon.js"
import { getTurmasAtivas } from "../services/turmasService.js"

// =========================
// ELEMENTOS
// =========================

const state = {
  alunos: [],
  filtro: "",
  alunoEditando: null
}

const form = document.getElementById("formAluno");
const listaAlunos = document.getElementById("listaAlunos");
const campoBusca = document.getElementById("buscaAluno");

// Modal
const modal = document.getElementById("modalEditar");
const formEditar = document.getElementById("formEditar");
const editarNome = document.getElementById("editarNome");
const editarMatricula = document.getElementById("editarMatricula");
const editarTurma = document.getElementById("editarTurma");

// =========================
// LOCAL STORAGE
// =========================

import { getAlunos, salvarAlunos } from "../services/alunosService.js"

// =========================
// CADASTRAR ALUNO
// =========================
form.addEventListener("submit", e => {
  e.preventDefault()

  const nome = document.getElementById("nome").value.trim()
  const matricula = document.getElementById("matricula").value.trim()
  const turma = document.getElementById("turma").value.trim()

  if (!nome || !matricula || !turma) {
    alert("Preencha todos os campos.")
    return
  }

  if (state.alunos.some(a => a.matricula === matricula)) {
    alert("Já existe um aluno com essa matrícula.")
    return
  }

  state.alunos.push({ nome, matricula, turma })
  salvarAlunos(state.alunos)

  form.reset()
  renderAlunos()
})

function renderAlunos(){

  const lista = listaAlunos
  lista.innerHTML = ""

  const filtrados = state.alunos.filter(a =>
    a.nome.toLowerCase().includes(state.filtro) ||
    a.matricula.toLowerCase().includes(state.filtro)
  )

  if (filtrados.length === 0) {
    lista.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center;">
          Nenhum aluno encontrado.
        </td>
      </tr>`
    return
  }

  filtrados.forEach(aluno => {

    const tr = document.createElement("tr")

    tr.innerHTML = `
      <td>${aluno.nome}</td>
      <td>${aluno.matricula}</td>
      <td>${aluno.turma}</td>
      <td class="acoes-aluno">
        <div class="acoes-grupo">

          <button class="btn-acao btn-editar" title="Editar">
            <i class="fa-solid fa-pen"></i>
          </button>

          <button class="btn-acao btn-visualizar" title="Visualizar">
            <i class="fa-solid fa-eye"></i>
          </button>

          <button class="btn-acao btn-excluir" title="Excluir">
            <i class="fa-solid fa-trash"></i>
          </button>

      </div>
      </td>
    `

    // eventos (🔥 sem onclick)
    
    
    tr.querySelector(".btn-editar")
      .addEventListener("click", () => abrirModal(aluno.matricula))

    tr.querySelector(".btn-visualizar")
    .addEventListener("click", () => {
      window.location.href = `aluno.html?rga=${aluno.matricula}`
    })

    tr.querySelector(".btn-excluir")
      .addEventListener("click", () => excluirAluno(aluno.matricula))

    lista.appendChild(tr)
  })
}

// =========================
// BUSCAR ALUNO
// =========================
campoBusca.addEventListener("input", e => {
  state.filtro = e.target.value.toLowerCase()
  renderAlunos()
})

// =========================
// EDITAR ALUNO (MODAL)
// =========================
function abrirModal(matricula){

  const aluno = state.alunos.find(a => a.matricula === matricula)

  editarNome.value = aluno.nome
  editarMatricula.value = aluno.matricula
  editarTurma.value = aluno.turma

  state.alunoEditando = matricula

  modal.classList.add("ativo")
  document.body.classList.add("modal-aberto")
}

formEditar.addEventListener("submit", e => {
  e.preventDefault()

  const index = state.alunos.findIndex(a => a.matricula === state.alunoEditando)

    state.alunos[index] = {
    nome: editarNome.value.trim(),
    matricula: editarMatricula.value.trim(),
    turma: editarTurma.value.trim()
    }

  salvarAlunos(state.alunos)

  fecharModal()
  renderAlunos()
})

// =========================
// EXCLUIR
// =========================
function excluirAluno(matricula){

  if (!confirm("Deseja excluir este aluno?")) return

  state.alunos = state.alunos.filter(a => a.matricula !== matricula)

  salvarAlunos(state.alunos)
  renderAlunos()
}

// =========================
// MODAL
// =========================
function fecharModal() {
    modal.classList.remove("ativo");
    document.body.classList.remove("modal-aberto");
    state.alunoEditando = null;
}

modal.addEventListener("click", e => {
    if (e.target === modal) fecharModal();
});

document.addEventListener("keydown", e => {
    if (e.key === "Escape" && modal.classList.contains("ativo")) {
        fecharModal();
    }
});

// =========================
// CARREGAR INFORMAÇÕES
// =========================
function carregarTurmas(){

  const turmas = getTurmasAtivas()
    .sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR", { numeric: true })
    )

  const selectCadastro = document.getElementById("turma")
  const selectEditar = document.getElementById("editarTurma")

  selectCadastro.innerHTML =
    `<option value="">Selecione a turma</option>`

  selectEditar.innerHTML =
    `<option value="">Selecione a turma</option>`

  turmas.forEach(turma => {

    const opt1 = document.createElement("option")
    opt1.value = turma.nome
    opt1.textContent = turma.nome
    selectCadastro.appendChild(opt1)

    const opt2 = document.createElement("option")
    opt2.value = turma.nome
    opt2.textContent = turma.nome
    selectEditar.appendChild(opt2)

  })

}

// =========================
// INICIALIZAÇÃO
// =========================
document.addEventListener("DOMContentLoaded", () => {

  aplicarFaviconDinamico()
  state.alunos = getAlunos()
  carregarTurmas()
  renderAlunos()

})

window.fecharModal = fecharModal