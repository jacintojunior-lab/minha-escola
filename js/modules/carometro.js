import { getAlunos, salvarAlunos } from "../services/alunosService.js"
import { getTurmasAtivas } from "../services/turmasService.js"
import { aplicarFaviconDinamico } from "./utils/favicon.js"
import { salvarFotoAluno, buscarFotoAluno, excluirFotoAluno } from "./utils/fotosDB.js"

const state = {
  alunos: [],
  turmas: [],
  turmaSelecionada: "",
  alunoSelecionado: null
}

const escola = JSON.parse(localStorage.getItem("escola")) || {}

const grid = document.getElementById("gridCarometro");
const filtroTurma = document.getElementById("filtroTurma");

// 🔹 SELECT

function carregarSelectTurmas(){

  filtroTurma.innerHTML = '<option value="">Selecionar turma</option>'

  state.turmas
  .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { numeric: true }))
  .forEach(turma => {
    const option = document.createElement("option")
    option.value = turma.nome
    option.textContent = turma.nome
    filtroTurma.appendChild(option)
  })

}

function init(){

  state.alunos = getAlunos()
  state.turmas = getTurmasAtivas()

  carregarSelectTurmas()

  const turmaSalva = localStorage.getItem("turmaSelecionada")

  if(turmaSalva){
    filtroTurma.value = turmaSalva
    state.turmaSelecionada = turmaSalva
  }

  renderCarometro()
}

// 🔹 FOTO PADRÃO
function getFotoPadrao(aluno) {

  if (aluno.sexo === "Feminino") {
    return escola.fotoFeminina || "assets/fallback-feminino.png";
  }

  return escola.fotoMasculina || "assets/fallback-masculino.png";
}
// 🔹 RENDER
async function renderCarometro() {

  const turmaSelecionada = filtroTurma.value
  grid.innerHTML = ""

  if (!turmaSelecionada) {
    grid.innerHTML = `<p class="mensagem-vazia">Selecione uma turma</p>`
    return
  }

  const filtrados = state.alunos.filter(a => {
    const turmaAluno = (a.turma || "").toLowerCase()
    const turmaSelecionadaFormatada = (turmaSelecionada || "").toLowerCase()
    const mesmaTurma = turmaAluno.includes(turmaSelecionadaFormatada)
    const ativo = !a.status || a.status.toLowerCase() === "ativo"
    return mesmaTurma && ativo
  })
  .sort((a, b) => a.nome.localeCompare(b.nome))

  for(const aluno of filtrados){

    const fotoIndexedDB = await buscarFotoAluno(aluno.matricula)
    const foto = fotoIndexedDB || aluno.foto || getFotoPadrao(aluno)

    const card = document.createElement("div")
    card.className = "card-aluno"

    const img = document.createElement("img")
    img.src = foto
    img.className = "foto-aluno"
    img.addEventListener("click", () => abrirZoomFoto(foto))

    const nome = document.createElement("div")
    nome.className = "nome-aluno"
    nome.textContent = aluno.nome

    const acoes = document.createElement("div")
    acoes.className = "acoes-aluno"

    const btnFoto = document.createElement("button")
    btnFoto.className = "btn-mini btn-foto"
    btnFoto.innerHTML = '<i class="fa-solid fa-camera"></i>'
    btnFoto.addEventListener("click", () => abrirModalFoto(aluno.matricula))

    const btnVer = document.createElement("button")
    btnVer.className = "btn-mini btn-ver"
    btnVer.innerHTML = '<i class="fa-solid fa-eye"></i>'
    btnVer.addEventListener("click", () => verAluno(aluno.matricula))

    acoes.appendChild(btnFoto)
    acoes.appendChild(btnVer)

    card.appendChild(img)
    card.appendChild(nome)
    card.appendChild(acoes)

    grid.appendChild(card)
  }
}

// 🔹 MODAL FOTO
async function abrirModalFoto(matricula) {
  state.alunoSelecionado = state.alunos.find(a => a.matricula === matricula)

  const modal = document.getElementById("modalFoto")
  modal.style.display = "flex"

  document.body.classList.add("modal-aberto")

  const preview = document.getElementById("previewFoto")

  const fotoIndexedDB = await buscarFotoAluno(matricula)

  preview.src =
    fotoIndexedDB ||
    state.alunoSelecionado.foto ||
    getFotoPadrao(state.alunoSelecionado)
}

function fecharModalFoto() {
  const modal = document.getElementById("modalFoto");
  modal.style.display = "none";

  document.body.classList.remove("modal-aberto");
}

const modal = document.getElementById("modalFoto");

modal.addEventListener("click", function (e) {
  if (e.target === modal) {
    fecharModalFoto();
  }
});

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    fecharModalFoto();
  }
});

// 🔹 PREVIEW
document.getElementById("inputFoto").addEventListener("change", function () {

  const file = this.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    document.getElementById("previewFoto").src = e.target.result;
  };

  reader.readAsDataURL(file);
});

// 🔹 SALVAR FOTO
async function salvarFoto() {

  const preview = document.getElementById("previewFoto").src

  await salvarFotoAluno(state.alunoSelecionado.matricula, preview)

  delete state.alunoSelecionado.foto
  state.alunoSelecionado.fotoIndexedDB = true

  salvarAlunos(state.alunos)

  fecharModalFoto()
  renderCarometro()
}

// 🔹 EXCLUIR FOTO
async function excluirFoto(){

  if(!state.alunoSelecionado) return

  if(!confirm("Deseja remover a foto do aluno?")) return

  await excluirFotoAluno(state.alunoSelecionado.matricula)

  delete state.alunoSelecionado.foto
  delete state.alunoSelecionado.fotoIndexedDB

  salvarAlunos(state.alunos)

  const preview = document.getElementById("previewFoto")
  preview.src = getFotoPadrao(state.alunoSelecionado)

  renderCarometro()
  fecharModalFoto()
}

// 🔹 VER ALUNO
function verAluno(matricula) {
  const rga = String(matricula).trim();
  window.location.href = `aluno.html?rga=${rga}`;
}

// 🔹 EVENTO
filtroTurma.addEventListener("change", () => {
  localStorage.setItem("turmaSelecionada", filtroTurma.value);
  renderCarometro();
});

const inputFoto = document.getElementById("inputFoto");

if (inputFoto) {
  inputFoto.addEventListener("change", function () {

    const file = this.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {
      document.getElementById("previewFoto").src = e.target.result;
    };

    reader.readAsDataURL(file);
  });
}


// Imprimir carômetro

function imprimirCarometro() {
  window.print();
}

// Criar PDF

async function exportarPDF() {

  const turma = filtroTurma.value;

  if (!turma) {
    alert("Selecione uma turma primeiro");
    return;
  }

  const { jsPDF } = window.jspdf;

  const area = document.getElementById("gridCarometro");

  // 🔥 REMOVE dependência do título HTML
  document.body.classList.add("pdf-mode");

  await new Promise(resolve => setTimeout(resolve, 300));

  // aguarda imagens
  await Promise.all(
    Array.from(area.querySelectorAll("img")).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        img.onload = img.onerror = resolve;
      });
    })
  );

  const canvas = await html2canvas(area, {
    scale: 2,
    useCORS: true,
    allowTaint: true
  });

  const imgData = canvas.toDataURL("image/jpeg", 1.0);

  const pdf = new jsPDF("l", "mm", "a4");

  const pageWidth = 297;
  const pageHeight = 210;

  const margin = 10;

  // 🔥 TÍTULO DIRETO NO PDF
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text(`Carômetro - Turma ${turma}`, pageWidth / 2, 15, {
    align: "center"
  });

  // espaço abaixo do título
  const contentTop = 25;

  const imgWidth = pageWidth - (margin * 2);
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = contentTop;

  // primeira página
  pdf.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight);
  heightLeft -= (pageHeight - contentTop);

  // páginas extras
  while (heightLeft > 0) {

    position = heightLeft - imgHeight + contentTop;

    pdf.addPage();

    pdf.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight);

    heightLeft -= pageHeight;
  }

  pdf.save(`carometro-${turma}.pdf`);

  document.body.classList.remove("pdf-mode");
}

// =========================
// ZOOM FOTO
// =========================
function abrirZoomFoto(src){

  const modal = document.getElementById("modalZoomFoto")
  const img = document.getElementById("imgZoomFoto")

  if(!src) return

  img.src = src

  modal.classList.add("ativo")

  // 🔥 BLOQUEIA SCROLL
  document.body.classList.add("zoom-aberto")
}

function fecharZoomFoto(){
  document.getElementById("modalZoomFoto").classList.remove("ativo")

  // 🔥 LIBERA SCROLL
  document.body.classList.remove("zoom-aberto")
}

// clique fora
document.getElementById("modalZoomFoto").addEventListener("click", fecharZoomFoto)

// ESC
document.addEventListener("keydown", function(e){
  if(e.key === "Escape"){
    fecharZoomFoto()
  }
})

document.addEventListener("DOMContentLoaded", init)

document.addEventListener("DOMContentLoaded", () => {

  aplicarFaviconDinamico()
  
})

document.getElementById("btnSalvarFoto")
  .addEventListener("click", salvarFoto)

document.getElementById("btnExcluirFoto")
  .addEventListener("click", excluirFoto)

document.getElementById("btnFecharModal")
  .addEventListener("click", fecharModalFoto)

document.getElementById("btnImprimir")
  .addEventListener("click", imprimirCarometro)

document.getElementById("btnPDF")
  .addEventListener("click", exportarPDF)