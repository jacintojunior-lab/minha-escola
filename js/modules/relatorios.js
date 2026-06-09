// =========================
// RELATÓRIOS – jsPDF (SEM LOGO)
// =========================

const { jsPDF } = window.jspdf;

// =========================
// ELEMENTOS
// =========================

import { getAlunos } from "../services/alunosService.js"
import { getTurmas } from "../services/turmasService.js"
import { getData } from "../core/storage.js"
import { filtrarAtivosComTurma, alunoAtivo } from "./utils/filtros.js"
import { aplicarFaviconDinamico } from "./utils/favicon.js"

const state = {
  alunos: [],
  turmas: [],
  turmaSelecionada: ""
}

// =========================
// GERAR RELATÓRIOS
// =========================

function gerarRelatorioPDF({
  titulo = "",
  colunas = [],
  dados = [],
  agrupado = false,
  orientacao = "p"
}){

  const doc = new jsPDF(orientacao, "mm", "a4")

  // =========================
  // AGRUPADO POR TURMA
  // =========================
  if(agrupado){

    const grupos = agruparPorTurma(dados)
    const turmasOrdenadas = Object.keys(grupos).sort()

    turmasOrdenadas.forEach((turma, index) => {

      const lista = grupos[turma]

      lista.sort((a,b)=>
        (a.nome || "").localeCompare(b.nome || "", "pt-BR")
      )

      if(index !== 0){
        doc.addPage()
      }

      // título
      doc.setFontSize(14)
      doc.text(titulo, 14, 15)

      // turma
      doc.setFontSize(12)
      doc.text(`Turma: ${turma}`, 14, 25)

      const linhas = lista.map(a => colunas.map(col => col.render(a)))

      doc.autoTable({
        startY: 30,
        head: [colunas.map(c => c.label)],
        body: linhas,
        styles: { fontSize: 9 }
      })

    })

  }else{

    // =========================
    // SEM AGRUPAMENTO
    // =========================

    dados.sort((a,b)=>
      (a.nome || "").localeCompare(b.nome || "", "pt-BR")
    )

    doc.setFontSize(14)
    doc.text(titulo, 14, 15)

    const linhas = dados.map(a => colunas.map(col => col.render(a)))

    doc.autoTable({
      startY: 25,
      head: [colunas.map(c => c.label)],
      body: linhas,
      styles: { fontSize: 9 }
    })
  }

  return doc
}

function init(){

  state.alunos = getAlunos()
  state.turmas = getTurmas()

  carregarTurmas()

  bindEventos()
}

const selectTurma = document.getElementById("turmaSelecionada");

function agruparPorTurma(lista){

  const grupos = {}

  lista.forEach(a => {
    if(!grupos[a.turma]){
      grupos[a.turma] = []
    }
    grupos[a.turma].push(a)
  })

  return grupos
}

function bindEventos(){

  document.getElementById("btnPDFGeral")
    .addEventListener("click", gerarPDFGeral)

  document.getElementById("btnPDFTurma")
    .addEventListener("click", gerarPDFPorTurma)

  document.getElementById("btnExcel")
    .addEventListener("click", gerarExcel)

  document.getElementById("btnSaude")
    .addEventListener("click", gerarRelatorioSaude)

  document.getElementById("btnCarometroGeral")
    .addEventListener("click", gerarCarometroGeralPDF)

  document.getElementById("btnCarometroTurma")
    .addEventListener("click", gerarCarometroPorTurmaPDF)

  document.getElementById("btnRGAEOLINEP")
    .addEventListener("click", gerarRelatorioRGAEOLINEP)

  document.getElementById("btnRGAEOLINEPTurma")
    .addEventListener("click", gerarRelatorioRGAEOLINEPTurma)

  document.getElementById("btnListaTelefonica")
    .addEventListener("click", gerarListaTelefonica)

  document.getElementById("btnListaTelefonicaTurma")
    .addEventListener("click", gerarListaTelefonicaPorTurma)

}

// =========================
// CARREGAR TURMAS
// =========================
function carregarTurmas() {

    const turmas = state.turmas

    // 🔥 apenas turmas ativas (se tiver campo status)
    const turmasAtivas = turmas.filter(t => (t.status || "Ativa") === "Ativa")

    // 🔥 ordenar (1A, 1B, 2A...)
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
    selectTurma.innerHTML = '<option value="">Selecione uma turma</option>'

    // adicionar opções
    turmasAtivas.forEach(turma => {
        const opt = document.createElement("option")
        opt.value = turma.nome
        opt.textContent = turma.nome
        selectTurma.appendChild(opt)
    })
}

// =========================
// PDF GERAL (UMA TURMA POR PÁGINA)
// =========================
function gerarPDFGeral(){

  const alunos = state.alunos
  const turmas = state.turmas

  const filtrados = filtrarAtivosComTurma(alunos, turmas)

  const doc = gerarRelatorioPDF({
    titulo: "Lista de Estudantes Ativos",
    dados: filtrados,
    agrupado: true,
    colunas: [
      { label: "RGA", render: a => a.matricula || "" },
      { label: "Nome", render: a => a.nome || "" },
      { label: "Nascimento", render: a => formatarData(a.nascimento) }
    ]
  })

  doc.save("lista-estudantes-por-turma.pdf")
}

// =========================
// PDF POR TURMA SELECIONADA
// =========================
function gerarPDFPorTurma(){

  const alunos = state.alunos

  state.turmaSelecionada = selectTurma.value

  if(!state.turmaSelecionada){
    alert("Selecione uma turma")
    return
  }

  const filtrados = alunos.filter(a =>
    a.turma === state.turmaSelecionada &&
    alunoAtivo(a)
  )

  const doc = gerarRelatorioPDF({
    titulo: `Lista de Estudantes - ${state.turmaSelecionada}`,
    dados: filtrados,
    agrupado: false,
    colunas: [
      { label: "RGA", render: a => a.matricula || "" },
      { label: "Nome", render: a => a.nome || "" },
      { label: "Nascimento", render: a => formatarData(a.nascimento) }
    ]
  })

  doc.save(`turma-${state.turmaSelecionada}.pdf`)
}

// =========================
// FUNÇÕES AUXILIARES PDF
// =========================
function cabecalhoPDF(doc, titulo) {
    doc.setFontSize(14);
    doc.text("EMEF Professor Noé Azevedo", 14, 20);

    doc.setFontSize(12);
    doc.text(titulo, 14, 28);
}

function tabelaPDF(doc, dados) {
    doc.autoTable({
        head: [["Nome", "Matrícula", "Turma"]],
        body: dados,
        startY: 35,
        styles: {
            fontSize: 10,
            cellPadding: 3
        },
        headStyles: {
            fillColor: [47, 50, 110],
            textColor: 255
        }
    });
}

function rodapePDF(doc) {
    const data = new Date().toLocaleDateString("pt-BR");
    doc.setFontSize(9);
    doc.text(
        `Documento emitido em ${data}`,
        14,
        doc.internal.pageSize.height - 10
    );
}

// =========================
// EXPORTAR EXCEL (CSV)
// =========================
function gerarExcel(){

const alunos = state.alunos

if(alunos.length === 0){
alert("Nenhum aluno cadastrado")
return
}

// converter para formato plano
const dados = alunos.map(a => ({

// ===== DADOS GERAIS =====
RGA: a.matricula || "",
Nome: a.nome || "",
Turma: a.turma || "",
Situação: a.situacao || "",

// ===== ESCOLAR =====
RA: a.ra || "",
EOL: a.eol || "",
INEP: a.inep || "",
"Ano Letivo": a.anoLetivo || "",

// ===== PESSOAIS =====
Nascimento: a.nascimento || "",
Sexo: a.sexo || "",
Cidade: a.cidade || "",
Estado: a.estado || "",
UF: a.uf || "",
País: a.pais || "",

// ===== DOCUMENTOS =====
CPF: a.cpf || "",
RG: a.rgNumero || "",
"NIS": a.nis || "",

// ===== FAMÍLIA =====
"Mãe": a.mae || "",
"Pai": a.pai || "",
"Responsável": a.responsavelNome || "",

// ===== CONTATO =====
"Telefone Responsável": a.telefoneResponsavel || "",
"Telefone Mãe": a.telefoneMae || "",
"Telefone Pai": a.telefonePai || "",
"Email Responsável": a.emailResponsavel || "",

// ===== ENDEREÇO =====
Rua: a.rua || "",
Número: a.numero || "",
Bairro: a.bairro || "",
Cidade_Endereco: a.cidadeEndereco || "",
Estado_Endereco: a.estadoEndereco || "",
CEP: a.cep || "",

// ===== SAÚDE =====
"SUS": a.cartaoSus || "",
"DVA": a.dvaEntregue || "",
"Próxima Vacina": a.proximaVacina || "",
"Problemas Saúde": a.problemasSaude || "",

// ===== TEG =====
"TEG Classificação": a.tegClassificado || "",
"TEG Motivo": a.tegMotivo || "",
"TEG Situação": a.tegSituacao || "",
"TEG Condutor": a.tegCondutor || ""

}))

// criar planilha
const ws = XLSX.utils.json_to_sheet(dados)

// criar workbook
const wb = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(wb, ws, "Alunos")

// baixar
XLSX.writeFile(wb, "alunos_completo.xlsx")

}

// =========================
// RELATÓRIO SAÚDE (PDF)
// =========================

function gerarRelatorioSaude(){

const alunos = state.alunos
const turmas = state.turmas

const nomesTurmas = turmas.map(t => t.nome)

// apenas ativos e com turma válida
const filtrados = filtrarAtivosComTurma(alunos, turmas)

// ordenar por turma + nome
filtrados.sort((a,b) => {
if(a.turma === b.turma){
return (a.nome || "").localeCompare(b.nome || "")
}
return (a.turma || "").localeCompare(b.turma || "")
})

const doc = new jsPDF()

doc.setFontSize(14)
doc.text("Relatório de DVAs entregues", 14, 15)

let posY = 20

// agrupar por turma
const grupos = agruparPorTurma(filtrados)

// gerar por turma
const turmasOrdenadas = Object.keys(grupos).sort()

turmasOrdenadas.forEach((turma, index) => {

const alunosTurma = grupos[turma]

// 👉 nova página (exceto a primeira)
if(index !== 0){
doc.addPage()
}

doc.setFontSize(14)
doc.text("Relatório de DVAs entregues", 14, 15)

doc.setFontSize(12)
doc.text(`Turma: ${turma}`, 14, 25)

const linhas = alunosTurma.map(a => [
a.nome || "",
formatarData(a.nascimento),
a.dvaEntregue || "-",
formatarData(a.proximaVacina)
])

doc.autoTable({
startY: 30,
head: [["Nome", "Nascimento", "DVA", "Próxima Vacina"]],
body: linhas,
styles: { fontSize: 9 }
})

})

doc.save("relatorio-dva-por-turma.pdf")

}

// =========================
// INICIALIZAÇÃO
// =========================
document.addEventListener("DOMContentLoaded", init);

document.addEventListener("DOMContentLoaded", () => {

  aplicarFaviconDinamico()

})

// =========================
// FORMATAR DATA
// =========================
function formatarData(data){
if(!data) return ""
const partes = data.split("-")
if(partes.length !== 3) return data
return `${partes[2]}/${partes[1]}/${partes[0]}`
}

// =========================
// DUAS LOGOS
// =========================
function desenharCabecalho(doc){

const dados = JSON.parse(localStorage.getItem("escola")) || {}

const pageWidth = doc.internal.pageSize.getWidth()

// =========================
// LOGO ESQUERDA
// =========================
if(dados.logoPrefeitura){
doc.addImage(dados.logoPrefeitura, "PNG", 10, 10, 25, 25)
}

// =========================
// LOGO DIREITA (mesma logo por enquanto)
// =========================
if(dados.logo){
doc.addImage(dados.logo, "PNG", pageWidth - 35, 10, 25, 25)
}

// =========================
// TEXTO CENTRAL
// =========================
doc.setFont("helvetica", "bold")
doc.setFontSize(12)

doc.text(dados.nome || "NOME DA ESCOLA", pageWidth / 2, 15, { align: "center" })

doc.setFont("helvetica", "normal")
doc.setFontSize(10)

doc.text(dados.endereco || "", pageWidth / 2, 20, { align: "center" })
doc.text(dados.cidade || "", pageWidth / 2, 25, { align: "center" })

let telefones = dados.telefone || ""

if(dados.telefone2){
telefones += " / " + dados.telefone2
}

doc.text(`Fone: ${telefones}`, pageWidth / 2, 30, { align: "center" })

doc.text(`E-mail: ${dados.email || ""}`, pageWidth / 2, 35, { align: "center" })

// linha separadora
doc.setLineWidth(0.5)
doc.line(10, 40, pageWidth - 10, 40)

}

// =========================
// CARÔMETRO GERAL (PDF)
// =========================
async function gerarCarometroGeralPDF(){

const alunos = state.alunos
const turmas = state.turmas
const escola = getData("escola")

const fotoMasculina = escola.fotoMasculina || ""
const fotoFeminina = escola.fotoFeminina || ""

// apenas turmas ativas
const turmasAtivas = turmas
  .filter(t => (t.status || "Ativa") === "Ativa")
  .map(t => t.nome)
  .sort()

// agrupar alunos por turma
const grupos = {}

alunos.forEach(a => {
  if(
    turmasAtivas.includes(a.turma) &&
    (a.situacao || "Ativo") === "Ativo"
  ){
    if(!grupos[a.turma]){
      grupos[a.turma] = []
    }
    grupos[a.turma].push(a)
  }
})

// 🔥 HORIZONTAL
const doc = new jsPDF("l", "mm", "a4")

let primeira = true

for(const turma of turmasAtivas){

  const lista = grupos[turma] || []
  if(lista.length === 0) continue

  // ordenar alunos
  lista.sort((a,b)=>
    (a.nome || "").localeCompare(b.nome || "", "pt-BR")
  )

  if(!primeira){
    doc.addPage()
  }
  primeira = false

  const pageWidth = doc.internal.pageSize.getWidth()

  // título
  doc.setFont("helvetica","bold")
  doc.setFontSize(16)
  doc.text(`Carômetro - Turma ${turma}`, pageWidth/2, 15, {align:"center"})

  let x = 10
  let y = 25

  const largura = 35
  const altura = 45

  let col = 0

 for (let i = 0; i < lista.length; i++) {

    const aluno = lista[i];

    let foto = aluno.foto

    if(!foto){
      foto = aluno.sexo === "Feminino"
        ? fotoFeminina
        : fotoMasculina
    }

    // =========================
// 🎨 FUNDO DO CARD (AMARELO)
// =========================
doc.setFillColor(255, 204, 0)
doc.rect(x, y, largura - 5, altura - 5, "F")

// =========================
// 📸 FUNDO DA FOTO (BRANCO)
// =========================
doc.setFillColor(255, 255, 255)
doc.rect(x + 3, y + 3, largura - 11, 25, "F")

// =========================
// 🖼️ FOTO
// =========================
try{
  doc.addImage(foto, "PNG", x + 3, y + 3, largura - 11, 25)
}catch(e){}

// =========================
// 🟨 FAIXA DO NOME
// =========================
doc.setFillColor(255, 204, 0)
doc.rect(x + 3, y + 28, largura - 11, 10, "F")

// =========================
// 🔤 NOME
// =========================
// =========================
// 🔤 NOME (AJUSTADO)
// =========================
doc.setFont("helvetica","bold")
doc.setFontSize(6.5) // 🔥 ligeiramente menor
doc.setTextColor(0, 51, 153)

const nome = (aluno.nome || "")

// 🔥 permite quebra automática mais controlada
doc.text(nome, x + (largura/2) - 2, y + 33, {
  align: "center",
  maxWidth: largura - 10, // 🔥 MAIS ESPAÇO
  lineHeightFactor: 1.1
})

    col++
    x += largura

    if(col === 8){ // 🔥 mais colunas (horizontal)
      col = 0
      x = 10
      y += altura
    }

    // nova página automática
    const limite = doc.internal.pageSize.getHeight() - 20;
    if (y > limite && i < lista.length - 1) {
    doc.addPage();
    y = 20;
    }
    
  }
}

doc.save("carometro-geral.pdf")
}

// =========================
// CARÔMETRO POR TURMA (PDF)
// =========================
async function gerarCarometroPorTurmaPDF(){

const alunos = state.alunos
const escola = JSON.parse(localStorage.getItem("escola")) || {}

state.turmaSelecionada = selectTurma.value

if(!state.turmaSelecionada){
  alert("Selecione uma turma")
  return
}

const fotoMasculina = escola.fotoMasculina || ""
const fotoFeminina = escola.fotoFeminina || ""

// filtrar alunos da turma
const lista = alunos.filter(a =>
  a.turma === state.turmaSelecionada &&
  (a.situacao || "Ativo") === "Ativo"
)

// ordenar
lista.sort((a,b)=>
  (a.nome || "").localeCompare(b.nome || "", "pt-BR")
)

const doc = new jsPDF("l", "mm", "a4")

const pageWidth = doc.internal.pageSize.getWidth()

// título
doc.setFont("helvetica","bold")
doc.setFontSize(16)
doc.text(`Carômetro - Turma ${state.turmaSelecionada}`, pageWidth/2, 15, {align:"center"})

let x = 10
let y = 25

const largura = 35
const altura = 45

let col = 0

for (let i = 0; i < lista.length; i++) {

  const aluno = lista[i]

  let foto = aluno.foto

  if(!foto){
    foto = aluno.sexo === "Feminino"
      ? fotoFeminina
      : fotoMasculina
  }

  // fundo
  doc.setFillColor(255, 204, 0)
  doc.rect(x, y, largura - 5, altura - 5, "F")

  // área foto
  doc.setFillColor(255, 255, 255)
  doc.rect(x + 3, y + 3, largura - 11, 25, "F")

  // imagem
  try{
    doc.addImage(foto, "PNG", x + 3, y + 3, largura - 11, 25)
  }catch(e){}

  // faixa nome
  doc.setFillColor(255, 204, 0)
  doc.rect(x + 3, y + 28, largura - 11, 12, "F")

  // nome
  doc.setFont("helvetica","bold")
  doc.setFontSize(6.5)
  doc.setTextColor(0, 51, 153)

  const nome = aluno.nome || ""

  doc.text(nome, x + (largura/2) - 2, y + 33, {
    align: "center",
    maxWidth: largura - 10,
    lineHeightFactor: 1.1
  })

  col++
  x += largura

  if(col === 8){
    col = 0
    x = 10
    y += altura
  }

  // quebra de página sem gerar folha em branco
  const limite = doc.internal.pageSize.getHeight() - 20;

  if (y > limite && i < lista.length - 1) {
    doc.addPage()
    y = 20
  }
}

doc.save(`carometro-${state.turmaSelecionada}.pdf`)
}


// =========================
// RGA - EOL - INEP (PDF)
// =========================

function gerarRelatorioRGAEOLINEP(){

  const alunos = state.alunos
  const turmas = state.turmas

  const filtrados = filtrarAtivosComTurma(alunos, turmas)

  const doc = gerarRelatorioPDF({
    titulo: "Relatório RGA / EOL / INEP",
    dados: filtrados,
    agrupado: true,
    orientacao: "l",
    colunas: [
      { label: "RGA", render: a => a.matricula || "" },
      { label: "Nome", render: a => a.nome || "" },
      { label: "Nascimento", render: a => formatarData(a.nascimento) },
      { label: "RA", render: a => a.ra || "" },
      { label: "EOL", render: a => a.eol || "" },
      { label: "INEP", render: a => a.inep || "" }
    ]
  })

  doc.save("relatorio-rga-eol-inep.pdf")
}

// =========================
// RGA - EOL - INEP - TURMA (PDF)
// =========================

function gerarRelatorioRGAEOLINEPTurma(){

  const alunos = state.alunos

  state.turmaSelecionada = selectTurma.value

  if(!state.turmaSelecionada){
    alert("Selecione uma turma")
    return
  }

  const filtrados = alunos.filter(a =>
    a.turma === state.turmaSelecionada &&
    alunoAtivo(a)
  )

  const doc = gerarRelatorioPDF({
    titulo: `Relatório RGA / EOL / INEP - ${state.turmaSelecionada}`,
    dados: filtrados,
    agrupado: false,
    orientacao: "l",
    colunas: [
      { label: "RGA", render: a => a.matricula || "" },
      { label: "Nome", render: a => a.nome || "" },
      { label: "Nascimento", render: a => formatarData(a.nascimento) },
      { label: "RA", render: a => a.ra || "" },
      { label: "EOL", render: a => a.eol || "" },
      { label: "INEP", render: a => a.inep || "" }
    ]
  })

  doc.save(`relatorio-rga-eol-inep-${state.turmaSelecionada}.pdf`)
}

// =========================
// LISTA TELEFÔNICA
// =========================

function gerarListaTelefonica(){

  const alunos = state.alunos
  const turmas = state.turmas

  // 🔥 apenas ativos com turma válida
  const filtrados = filtrarAtivosComTurma(alunos, turmas)

  // 🔥 agrupar por turma
  const grupos = agruparPorTurma(filtrados)

  const doc = new jsPDF("l", "mm", "a4") // 🔥 horizontal

  const turmasOrdenadas = Object.keys(grupos).sort()

  turmasOrdenadas.forEach((turma, index) => {

    const lista = grupos[turma]

    lista.sort((a,b)=>
      (a.nome || "").localeCompare(b.nome || "", "pt-BR")
    )

    if(index !== 0){
      doc.addPage()
    }

    // 🔹 título
    doc.setFontSize(14)
    doc.text("Lista Telefônica", 14, 15)

    doc.setFontSize(12)
    doc.text(`Turma: ${turma}`, 14, 22)

    // 🔹 colunas
    const colunas = [
      "Estudante",
      "Mãe",
      "Tel. Mãe",
      "Pai",
      "Tel. Pai",
      "Responsável",
      "Tel. Resp.",
      "Recado 1",
      "Recado 2"
    ]

    // 🔹 linhas
    const linhas = lista.map(a => [

      a.nome || "",

      primeiroNome(a.mae),
      formatarTelefone(a.telefoneMae),

      primeiroNome(a.pai),
      formatarTelefone(a.telefonePai),

      primeiroNome(a.responsavelNome),
      formatarTelefone(a.telefoneResponsavel),

      formatarTelefone(a.telefoneRecado1),
      formatarTelefone(a.telefoneRecado2)

    ])

    doc.autoTable({
      startY: 28,
      head: [colunas],
      body: linhas,
      styles: { fontSize: 8 },
      headStyles: {
        fillColor: [47, 50, 110],
        textColor: 255
      }
    })

  })

  doc.save("lista-telefonica.pdf")
}

function primeiroNome(nome){
  if(!nome) return ""
  return nome.trim().split(" ")[0]
}

function formatarTelefone(numero){
  if(!numero) return ""

  const limpo = numero.replace(/\D/g,"")

  if(limpo.length === 11){
    return `(${limpo.slice(0,2)}) ${limpo.slice(2,7)}-${limpo.slice(7)}`
  }

  if(limpo.length === 10){
    return `(${limpo.slice(0,2)}) ${limpo.slice(2,6)}-${limpo.slice(6)}`
  }

  return numero
}

// =========================
// LISTA TELEFÔNICA - POR TURMA
// =========================
function gerarListaTelefonicaPorTurma(){

  const alunos = state.alunos

  state.turmaSelecionada = selectTurma.value

  if(!state.turmaSelecionada){
    alert("Selecione uma turma")
    return
  }

  // 🔥 filtrar apenas a turma
  const lista = alunos.filter(a =>
    a.turma === state.turmaSelecionada &&
    alunoAtivo(a)
  )

  // ordenar
  lista.sort((a,b)=>
    (a.nome || "").localeCompare(b.nome || "", "pt-BR")
  )

  const doc = new jsPDF("l", "mm", "a4") // horizontal

  // título
  doc.setFontSize(14)
  doc.text("Lista Telefônica", 14, 15)

  doc.setFontSize(12)
  doc.text(`Turma: ${state.turmaSelecionada}`, 14, 22)

  const colunas = [
    "Estudante",
    "Mãe",
    "Tel. Mãe",
    "Pai",
    "Tel. Pai",
    "Responsável",
    "Tel. Resp.",
    "Recado 1",
    "Recado 2"
  ]

  const linhas = lista.map(a => [

    a.nome || "",

    primeiroNome(a.mae),
    formatarTelefone(a.telefoneMae),

    primeiroNome(a.pai),
    formatarTelefone(a.telefonePai),

    primeiroNome(a.responsavelNome),
    formatarTelefone(a.telefoneResponsavel),

    formatarTelefone(a.telefoneRecado1),
    formatarTelefone(a.telefoneRecado2)

  ])

  doc.autoTable({
    startY: 28,
    head: [colunas],
    body: linhas,
    styles: { fontSize: 8 },
    headStyles: {
      fillColor: [47, 50, 110],
      textColor: 255
    }
  })

  doc.save(`lista-telefonica-${state.turmaSelecionada}.pdf`)
}