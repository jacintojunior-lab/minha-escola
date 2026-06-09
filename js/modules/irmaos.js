import { getAlunos } from "../services/alunosService.js"
import { getTurmas } from "../services/turmasService.js"
import { aplicarFaviconDinamico } from "./utils/favicon.js"

const state = {
  alunos: [],
  turmas: [],
  turmaSelecionada: ""
}

function init(){

  state.alunos = getAlunos()
  state.turmas = getTurmas()

  carregarTurmas()

  const turmaSalva = localStorage.getItem("irmaosTurmaSelecionada")

  if(turmaSalva){
    selectTurma.value = turmaSalva
    state.turmaSelecionada = turmaSalva
    carregarLista()
  }

}

const selectTurma = document.getElementById("selectTurma");
const lista = document.getElementById("listaIrmaos");

// =====================
// CARREGAR TURMAS
// =====================
function carregarTurmas(){

  const turmasOrdenadas = state.turmas
    .sort((a, b) =>
      a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true })
    )

  selectTurma.innerHTML = '<option value="">Selecione a turma</option>'

  turmasOrdenadas.forEach(t => {

    const option = document.createElement("option")
    option.value = t.nome
    option.textContent = t.nome

    selectTurma.appendChild(option)
  })

}

selectTurma.addEventListener("change", () => {

  state.turmaSelecionada = selectTurma.value

  localStorage.setItem("irmaosTurmaSelecionada", state.turmaSelecionada)

  carregarLista()
})

// =====================
// BUSCAR IRMÃOS
// =====================
function encontrarIrmaos(aluno) {
  let irmaos = [];

  // 🔹 1. POR RGA (AGORA MATRÍCULA)
  for (let i = 1; i <= 5; i++) {
    const rga = aluno[`irmao${i}Rga`];

    if (rga) {
      const encontrado = state.alunos.find(a => a.matricula === rga);
      if (encontrado) {
        irmaos.push(encontrado);
      }
    }
  }

  // 🔹 2. POR MÃE (nome + CPF)
  if (aluno.mae || aluno.maeCpf) {
    const porMae = state.alunos.filter(a =>
      a.matricula !== aluno.matricula &&
      (
        (a.mae && a.mae === aluno.mae) ||
        (a.maeCpf && a.maeCpf === aluno.maeCpf)
      )
    );

    porMae.forEach(a => {
      if (!irmaos.some(i => i.matricula === a.matricula)) {
        irmaos.push(a);
      }
    });
  }

  return irmaos;
}

// =====================
// RENDERIZAR
// =====================
function mapearIrmaos(alunos){

  const mapa = {}

  alunos.forEach(aluno => {
    mapa[aluno.matricula] = encontrarIrmaos(aluno)
  })

  return mapa
}

function carregarLista() {
  const turma = state.turmaSelecionada

  lista.innerHTML = "";

  if (!turma) return;

  const alunosTurma = state.alunos
    .filter(a => 
    (a.turma || "").toString().trim().toLowerCase() === 
    (turma || "").toString().trim().toLowerCase()
    )
  .sort((a, b) =>
    a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })
  )

  const mapaIrmaos = mapearIrmaos(state.alunos)
  
  alunosTurma.forEach(aluno => {
    const irmaos = (mapaIrmaos[aluno.matricula] || [])
    .sort((a, b) =>
        a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })
    )

    if (irmaos.length > 0) {
      const div = document.createElement("div");
      div.className = "card-irmao";

      // Nome do aluno
        const nome = document.createElement("div")
        nome.className = "nome-aluno"
        nome.textContent = aluno.nome

        div.appendChild(nome)

        // Lista de irmãos
        irmaos.forEach(i => {

        const item = document.createElement("div")
        item.className = "irmao-item"

        const icon = document.createTextNode("👤 ")
        item.appendChild(icon)

        const link = document.createElement("a")
        link.href = `aluno.html?rga=${i.matricula}&aba=irmaos`
        link.className = "link-irmao"
        link.textContent = i.nome

        const turma = document.createElement("span")
        turma.className = "turma-irmao"

        turma.textContent = i.turma ? ` (${i.turma})` : ""

        item.appendChild(link)
        item.appendChild(turma)

        div.appendChild(item)
        });

      lista.appendChild(div);
    }
  });

  if (lista.children.length === 0) {
    lista.innerHTML = "<p>Nenhum irmão encontrado nesta turma.</p>";
  }
}

// =====================
// EVENTOS
// =====================

document.addEventListener("DOMContentLoaded", init)

document.addEventListener("DOMContentLoaded", () => {

  aplicarFaviconDinamico()
  
})