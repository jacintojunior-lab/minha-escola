import { getAlunos } from "../services/alunosService.js"
import { aplicarFaviconDinamico } from "./utils/favicon.js"

// ELEMENTOS
const busca = document.getElementById("campoBuscaPais")
const filtroSituacao = document.getElementById("filtroTipoLista")
const tbody = document.getElementById("listaPais")

// =========================
// VERIFICAR SE É ATIVO
// =========================
function alunoAtivo(aluno){
  return (aluno.situacao || "Ativo") === "Ativo"
}

// =========================
// LISTAR
// =========================
function listar(){

  let alunos = getAlunos()

  // Filtro de situação
  if(filtroSituacao.value === "ativos"){
    alunos = alunos.filter(alunoAtivo)
  }

  const termo = (busca.value || "")
    .toLowerCase()
    .trim()

  // Busca
  alunos = alunos.filter(aluno => {

    const rga = String(
      aluno.matricula || aluno.rga || ""
    ).toLowerCase()

    const nome = (
      aluno.nome || ""
    ).toLowerCase()

    const mae = (
      aluno.mae || ""
    ).toLowerCase()

    const pai = (
      aluno.pai || ""
    ).toLowerCase()

    return (
      rga.includes(termo) ||
      nome.includes(termo) ||
      mae.includes(termo) ||
      pai.includes(termo)
    )

  })

  // Ordenar por nome
  alunos.sort((a, b) =>
    (a.nome || "").localeCompare(
      b.nome || "",
      "pt-BR"
    )
  )

  // Renderizar tabela
  tbody.innerHTML = ""

  alunos.forEach(aluno => {

    const tr = document.createElement("tr")

    tr.innerHTML = `
    <td>${aluno.matricula || aluno.rga || ""}</td>
    <td>${aluno.nome || ""}</td>
    <td>${aluno.turma || "-"}</td>
    <td>${aluno.mae || "-"}</td>
    <td>${aluno.pai || "-"}</td>
    <td>${aluno.situacao || "Ativo"}</td>
    <td>
        <button class="btn-acao btn-visualizar" title="Visualizar família">
        <i class="fa-solid fa-eye"></i>
        </button>
    </td>
    `

    tr.querySelector(".btn-visualizar")
      .addEventListener("click", () => {

        const rga =
          aluno.matricula || aluno.rga

        window.location.href =
          `aluno.html?rga=${rga}&aba=familia`

      })

    tbody.appendChild(tr)

  })

}

// =========================
// EVENTOS
// =========================
busca.addEventListener("input", listar)

filtroSituacao.addEventListener(
  "change",
  listar
)

const btnLimpar = document.getElementById("btnLimparPais")

if(btnLimpar){
  btnLimpar.addEventListener("click", () => {
    busca.value = ""
    filtroSituacao.value = "ativos"
    listar()
  })
}

// =========================
// INICIAR
// =========================
document.addEventListener(
  "DOMContentLoaded",
  () => {

    aplicarFaviconDinamico()

    listar()

  }
)