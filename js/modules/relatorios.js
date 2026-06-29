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
import { buscarFotoAluno } from "./utils/fotosDB.js"

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
  carregarPeriodoPresenca()

  bindEventos()
}

const selectTurma = document.getElementById("turmaSelecionada");
const selectMesPresenca = document.getElementById("mesPresenca")
const selectAnoPresenca = document.getElementById("anoPresenca")

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

  document.getElementById("btnSaidaGeral")
  .addEventListener("click", gerarRelatorioSaida)

  document.getElementById("btnSaidaTurma")
    .addEventListener("click", gerarRelatorioSaidaPorTurma)

  document.getElementById("btnPresencaFund1")
  .addEventListener("click", () => gerarListasPresenca("fund1"))

  document.getElementById("btnPresencaFund2")
    .addEventListener("click", () => gerarListasPresenca("fund2"))

  document.getElementById("btnPresencaTurma")
    .addEventListener("click", gerarListaPresencaTurma)

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

function carregarPeriodoPresenca(){

  if(!selectMesPresenca || !selectAnoPresenca) return

  const hoje = new Date()
  const mesAtual = hoje.toLocaleString("pt-BR", { month:"long" }).toUpperCase()
  const anoAtual = hoje.getFullYear()

  const mesSalvo = localStorage.getItem("presencaMes") || mesAtual
  const anoSalvo = localStorage.getItem("presencaAno") || String(anoAtual)

  selectMesPresenca.value = mesSalvo

  selectAnoPresenca.innerHTML = ""

  for(let ano = anoAtual - 1; ano <= anoAtual + 2; ano++){
    const opt = document.createElement("option")
    opt.value = String(ano)
    opt.textContent = String(ano)
    selectAnoPresenca.appendChild(opt)
  }

  selectAnoPresenca.value = anoSalvo

  selectMesPresenca.addEventListener("change", () => {
    localStorage.setItem("presencaMes", selectMesPresenca.value)
  })

  selectAnoPresenca.addEventListener("change", () => {
    localStorage.setItem("presencaAno", selectAnoPresenca.value)
  })
}

function obterPeriodoPresenca(){
  return {
    mes: localStorage.getItem("presencaMes") || "JANEIRO",
    ano: localStorage.getItem("presencaAno") || String(new Date().getFullYear())
  }
}

function numeroMesPresenca(mes){
  const meses = {
    JANEIRO:0,
    FEVEREIRO:1,
    MARÇO:2,
    ABRIL:3,
    MAIO:4,
    JUNHO:5,
    JULHO:6,
    AGOSTO:7,
    SETEMBRO:8,
    OUTUBRO:9,
    NOVEMBRO:10,
    DEZEMBRO:11
  }

  return meses[mes] ?? 0
}

function quantidadeDiasMesPresenca(mes, ano){
  const numeroMes = numeroMesPresenca(mes)
  return new Date(Number(ano), numeroMes + 1, 0).getDate()
}

function diasFimDeSemanaPresenca(mes, ano){
  const numeroMes = numeroMesPresenca(mes)
  const dias = []

  for(let dia = 1; dia <= 31; dia++){
    const data = new Date(Number(ano), numeroMes, dia)

    if(data.getMonth() !== numeroMes) continue

    const semana = data.getDay()

    if(semana === 0 || semana === 6){
      dias.push(dia)
    }
  }

  return dias
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

    let foto = await buscarFotoAluno(aluno.matricula)

    if(!foto){
      foto = aluno.foto
    }

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

  let foto = await buscarFotoAluno(aluno.matricula)

  if(!foto){
    foto = aluno.foto
  }

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

// =========================
// ATORIZADOS SAIDA - COMPLETO
// =========================

function pessoasAutorizadas(aluno){
  const pessoas = []

  for(let i = 1; i <= 10; i++){
    const nome = aluno[`pessoaAutorizada${i}`]
    if(nome){
      pessoas.push(nome)
    }
  }

  return pessoas.join(" / ")
}

function gerarRelatorioSaida(){

  const filtrados = filtrarAtivosComTurma(state.alunos, state.turmas)
  const grupos = agruparPorTurma(filtrados)

  const doc = new jsPDF("l", "mm", "a4")
  const turmasOrdenadas = Object.keys(grupos).sort()

  turmasOrdenadas.forEach((turma, index) => {

    const lista = grupos[turma].sort((a,b)=>
      (a.nome || "").localeCompare(b.nome || "", "pt-BR")
    )

    if(index !== 0) doc.addPage()

    const linhas = lista.map(a => [
      a.nome || "",
      pessoasAutorizadas(a)
    ])

    doc.autoTable({
      startY: 10,
      head: [[`TURMA ${turma}`, "PESSOAS AUTORIZADAS"]],
      body: linhas,
      margin: { left: 8, right: 8 },
      tableWidth: "auto",
      pageBreak: "auto",
      rowPageBreak: "avoid",
      styles: {
      fontSize: 7,
      cellPadding: 1.2,
      overflow: "linebreak",
      valign: "middle"
    },
    headStyles: {
      fillColor: [47, 50, 110],
      textColor: 255,
      fontSize: 9,
      halign: "center",
      valign: "middle"
    },
    columnStyles: {
      0: {
        cellWidth: 63,
        fontStyle: "bold"
      },
      1: {
        cellWidth: 218
      }
    }
    })
  })

  doc.save("relatorio-saida-por-turma.pdf")
}

// =========================
// ATORIZADOS SAIDA - POR TURMA
// =========================

function gerarRelatorioSaidaPorTurma(){

  state.turmaSelecionada = selectTurma.value

  if(!state.turmaSelecionada){
    alert("Selecione uma turma")
    return
  }

  const lista = state.alunos
    .filter(a =>
      a.turma === state.turmaSelecionada &&
      alunoAtivo(a)
    )
    .sort((a,b)=>
      (a.nome || "").localeCompare(b.nome || "", "pt-BR")
    )

  const doc = new jsPDF("l", "mm", "a4")

  const linhas = lista.map(a => [
    a.nome || "",
    pessoasAutorizadas(a)
  ])

  doc.autoTable({
    startY: 10,
    head: [[`TURMA ${state.turmaSelecionada}`, "PESSOAS AUTORIZADAS"]],
    body: linhas,
    margin: { left: 8, right: 8 },
    tableWidth: "auto",
    pageBreak: "auto",
    rowPageBreak: "avoid",
    styles: {
      fontSize: 7,
      cellPadding: 1.2,
      overflow: "linebreak",
      valign: "middle"
    },
    headStyles: {
      fillColor: [47, 50, 110],
      textColor: 255,
      fontSize: 9,
      halign: "center",
      valign: "middle"
    },
    columnStyles: {
      0: {
        cellWidth: 63,
        fontStyle: "bold"
      },
      1: {
        cellWidth: 218
      }
    }
  })

  doc.save(`relatorio-saida-${state.turmaSelecionada}.pdf`)
}

// =========================
// LISTA DE PRESENÇAS
// =========================

function etapaDaTurma(turma){
  const numero = parseInt(String(turma).match(/\d+/)?.[0] || 0)

  if(numero >= 1 && numero <= 5) return "fund1"
  if(numero >= 6 && numero <= 9) return "fund2"

  return ""
}

function gerarListasPresenca(etapa){

  const turmasEtapa = state.turmas
    .filter(t =>
      (t.status || "Ativa") === "Ativa" &&
      etapaDaTurma(t.nome) === etapa
    )
    .map(t => t.nome)
    .sort((a,b) => a.localeCompare(b, "pt-BR", { numeric:true }))

  const orientacao = etapa === "fund1" ? "l" : "p"
  const doc = new jsPDF(orientacao, "mm", "a4")

  let primeira = true

  turmasEtapa.forEach(turma => {

    const lista = state.alunos
      .filter(a => a.turma === turma && alunoAtivo(a))
      .sort((a,b) => (a.nome || "").localeCompare(b.nome || "", "pt-BR"))

    if(lista.length === 0) return

    if(!primeira){
      doc.addPage("a4", orientacao)
    }

    primeira = false

    if(etapa === "fund1"){
      desenharListaFund1(doc, turma, lista)
    }else{
      desenharListaFund2(doc, turma, lista)
    }
  })

  doc.save(
    etapa === "fund1"
      ? "listas-presenca-fund1.pdf"
      : "listas-presenca-fund2.pdf"
  )
}

function gerarListaPresencaTurma(){

  const turma = selectTurma.value

  if(!turma){
    alert("Selecione uma turma")
    return
  }

  const etapa = etapaDaTurma(turma)

  if(!etapa){
    alert("Não foi possível identificar se a turma é Fundamental I ou II.")
    return
  }

  const lista = state.alunos
    .filter(a => a.turma === turma && alunoAtivo(a))
    .sort((a,b) => (a.nome || "").localeCompare(b.nome || "", "pt-BR"))

  const orientacao = etapa === "fund1" ? "l" : "p"
  const doc = new jsPDF(orientacao, "mm", "a4")

  if(etapa === "fund1"){
    desenharListaFund1(doc, turma, lista)
  }else{
    desenharListaFund2(doc, turma, lista)
  }

  doc.save(`lista-presenca-${turma}.pdf`)
}

function obterNomeEscola(){
  const escola = getData("escola") || {}

  return (
    escola.escolaNome ||
    escola.nome ||
    "NOME DA ESCOLA"
  ).toUpperCase()
}

function desenharListaFund1(doc, turma, lista){

  const periodo = obterPeriodoPresenca()
  const escola = getData("escola") || {}
  const logo = escola.logo || escola.logoEscola || ""
  const qtdDias = quantidadeDiasMesPresenca(periodo.mes, periodo.ano)
  const dias = Array.from({length:qtdDias}, (_,i) => String(i + 1))
  const finaisDeSemana = diasFimDeSemanaPresenca(periodo.mes, periodo.ano)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)

  doc.autoTable({
    startY: 8,
    margin: { left: 4, right: 4 },
    theme: "grid",
    body: [
        [
          {
            content: obterNomeEscola(),
            styles:{
              halign:"center",
              fontStyle:"bold",
              fontSize:11
            }
          },
          {
            content:"",
            rowSpan:3,
            styles:{
              halign:"center",
              valign:"middle"
            }
          }
        ],
        [
          {
            content:`TURMA - ${turma}`,
            styles:{
              halign:"center",
              fontStyle:"bold",
              fontSize:10
            }
          }
        ],
        [
          {
            content:`${periodo.mes} DE ${periodo.ano}`,
            styles:{
              halign:"center",
              fontStyle:"bold",
              fontSize:9
            }
          }
        ]
      ],
    styles:{
      fontSize:8,
      cellPadding:1,
      lineColor:[0,0,0],
      lineWidth:0.2,
      valign:"middle"
    },
    columnStyles:{
        0:{ cellWidth:261.5 },
        1:{ cellWidth:27.5 }
    },
    didDrawCell:function(data){
      if(data.section === "body" && data.row.index === 0 && data.column.index === 1 && logo){
        try{
          const formato = logo.includes("image/jpeg") || logo.includes("image/jpg")
            ? "JPEG"
            : "PNG"

          const c = data.cell

          // tamanho fixo (quadrado)
          const tamanho = 14

          // centralizar na célula
          const x = c.x + (c.width - tamanho) / 2
          const y = c.y + (c.height - tamanho) / 2

          doc.addImage(
              logo,
              formato,
              x,
              y,
              tamanho,
              tamanho
          )
          
        }catch(e){}
      }
    }
  })

  const head = [["NOME DO(A) ESTUDANTE", ...dias]]

  const body = lista.map(aluno => [
    (aluno.nome || "").toUpperCase(),
    ...dias.map(dia => finaisDeSemana.includes(Number(dia)) ? "I" : "")
  ])

  while(body.length < 34){
    body.push([
      "",
      ...dias.map(dia => finaisDeSemana.includes(Number(dia)) ? "I" : "")
    ])
  }

  doc.autoTable({
    startY: doc.lastAutoTable.finalY,
    head,
    body,
    margin: { left: 4, right: 4 },
    theme: "grid",
    styles:{
      fontSize:7.5,
      cellPadding:0.9,
      lineColor:[0,0,0],
      lineWidth:0.2,
      valign:"middle"
    },
    headStyles:{
      fillColor:[220,220,220],
      textColor:[0,0,0],
      fontStyle:"bold",
      halign:"center"
    },
    columnStyles:{
      0:{ cellWidth:118.5, fontStyle:"bold" }
    },
    didParseCell:function(data){

      if(data.section === "body"){
        data.cell.styles.fillColor = data.row.index % 2 === 0
          ? [255,255,255]
          : [245,245,245]
      }

      if(data.column.index > 0){
        data.cell.styles.cellWidth = 170.5 / qtdDias
        data.cell.styles.halign = "center"

        const dia = Number(dias[data.column.index - 1])

        if(finaisDeSemana.includes(dia)){
          data.cell.styles.fontStyle = "bold"
          data.cell.styles.textColor = [0,0,0]
        }
      }
    }
  })
}

function desenharListaFund2(doc, turma, lista){

  const periodo = obterPeriodoPresenca()
  const semana = ["2ª feira", "3ª feira", "4ª feira", "5ª feira", "6ª feira"]
  const aulas = ["1", "2", "3", "4", "5", "6"]

  const pageWidth = doc.internal.pageSize.getWidth()

  const margemEsq = 5
  const margemDir = 5
  const larguraNumero = 5
  const larguraNome = 63
  const larguraAula = 4.4
  const larguraDia = larguraAula * 6
  const larguraTextoProfessor = larguraNumero + larguraNome
  const inicioGrade = margemEsq + larguraTextoProfessor
  const fimGrade = inicioGrade + (larguraDia * 5)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.text(obterNomeEscola(), pageWidth / 2, 8, { align:"center" })

  doc.setFontSize(9)
  doc.text(`TURMA - ${turma}`, pageWidth / 2, 13, { align:"center" })

  doc.setFontSize(8)
  doc.text("PROFESSOR COORDENADOR:", 6, 21)

  // =========================
  // MÊS - LINHA ÚNICA
  // =========================
  const yMes = 24
  const alturaMes = 4.5

  doc.setFillColor(220,235,245)
  doc.rect(margemEsq, yMes, fimGrade - margemEsq, alturaMes, "F")

  doc.setDrawColor(0,0,0)
  doc.setLineWidth(0.45)

  // superior
  doc.line(margemEsq, yMes, fimGrade, yMes)

  // esquerda
  doc.line(margemEsq, yMes, margemEsq, yMes + alturaMes)

  // direita
  doc.line(fimGrade, yMes, fimGrade, yMes + alturaMes)

  // inferior
  doc.line(margemEsq, yMes + alturaMes, fimGrade, yMes + alturaMes)

  doc.setLineWidth(0.16)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(6.5)
  doc.text(
    `${periodo.mes} DE ${periodo.ano}`,
    margemEsq + ((fimGrade - margemEsq) / 2),
    yMes + 3.1,
    { align:"center" }
  )

  const head1 = [
    [
      { content:"Nº", rowSpan:2 },
      { content:"NOME", rowSpan:2 },
      ...semana.map(dia => ({
        content:`____/____  ${dia}`,
        colSpan:6,
        styles:{ halign:"center" }
      }))
    ],
    semana.flatMap(() => aulas)
  ]

  const body = lista.map((aluno, index) => [
    String(index + 1),
    (aluno.nome || "").toUpperCase(),
    ...Array(30).fill("")
  ])

  while(body.length < 34){
    body.push(["", "", ...Array(30).fill("")])
  }

  doc.autoTable({
    startY: yMes + alturaMes,
    head: head1,
    body,
    margin:{ left:margemEsq, right:margemDir },
    theme:"grid",
    styles:{
      fontSize:6.5,
      cellPadding:0.55,
      minCellHeight:5.2,
      lineColor:[0,0,0],
      lineWidth:0.16,
      valign:"middle"
    },
    headStyles:{
      fillColor:[220,235,245],
      textColor:[0,0,0],
      fontStyle:"bold",
      fontSize:6.3,
      halign:"center",
      minCellHeight:3.6
    },
    columnStyles:{
      0:{ cellWidth:larguraNumero, halign:"center" },
      1:{ cellWidth:larguraNome, fontStyle:"bold" }
    },
    didParseCell:function(data){
      if(data.column.index >= 2){
        data.cell.styles.cellWidth = larguraAula
        data.cell.styles.halign = "center"
      }
    }
  })

  desenharSeparadoresDiasFund2(
    doc,
    margemEsq,
    inicioGrade,
    yMes + alturaMes,
    doc.lastAutoTable.finalY,
    larguraDia
  )

  const y = doc.lastAutoTable.finalY + 1.5

  const professores = [
    "Professor responsável - 1º aula",
    "Professor responsável - 2º aula",
    "Professor responsável - 3º aula",
    "Professor responsável - 4º aula",
    "Professor responsável - 5º aula",
    "Professor responsável - 6º aula"
  ]

  doc.autoTable({
    startY:y,
    body: professores.map(p => [
      p,
      { content:"", colSpan:5 }
    ]),
    margin:{ left:margemEsq, right:margemDir },
    theme:"grid",
    styles:{
      fontSize:6.5,
      cellPadding:0.8,
      minCellHeight:5,
      lineColor:[0,0,0],
      lineWidth:0.16,
      valign:"middle"
    },
    columnStyles:{
      0:{ cellWidth:larguraTextoProfessor, halign:"right" },
      1:{ cellWidth:larguraDia },
      2:{ cellWidth:larguraDia },
      3:{ cellWidth:larguraDia },
      4:{ cellWidth:larguraDia },
      5:{ cellWidth:larguraDia }
    }
  })

  desenharSeparadoresDiasFund2(
    doc,
    margemEsq,
    inicioGrade,
    y,
    doc.lastAutoTable.finalY,
    larguraDia
  )
}

function desenharSeparadoresDiasFund2(doc, xInicial, inicioGrade, inicioY, finalY, larguraDia){

  const xFinal = inicioGrade + (larguraDia * 5)

  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.45)

  doc.line(xInicial, inicioY, xFinal, inicioY)
  doc.line(xInicial, finalY, xFinal, finalY)
  doc.line(xInicial, inicioY, xInicial, finalY)
  doc.line(xFinal, inicioY, xFinal, finalY)

  for(let i = 0; i <= 5; i++){
    const x = inicioGrade + (larguraDia * i)
    doc.line(x, inicioY, x, finalY)
  }

  doc.setLineWidth(0.16)
}
