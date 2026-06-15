import { getAlunos } from "../services/alunosService.js"
import { getTurmas } from "../services/turmasService.js"
import { alunoAtivo } from "./utils/filtros.js"
import { aplicarFaviconDinamico } from "./utils/favicon.js"

let filtroKPI = ""

// =========================
// ELEMENTOS
// =========================

const STORAGE_KEY = "filtros_saude"
const turmaSelect = document.getElementById("turmaSelect")
const alunoSelect = document.getElementById("alunoSelect")
const tabela = document.getElementById("tabelaSaude")
const statusSelect = document.getElementById("statusVacina")

function salvarFiltros(){
  const filtros = {
    turma: turmaSelect.value,
    aluno: alunoSelect.value,
    status: statusSelect.value
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtros))
}

function carregarFiltros(){
  const dados = localStorage.getItem(STORAGE_KEY)

  if(!dados) return

  const filtros = JSON.parse(dados)

  if(filtros.turma){
    turmaSelect.value = filtros.turma
  }

  if(filtros.status){
    statusSelect.value = filtros.status
  }

  return filtros
}

// =========================
// CARREGAR TURMAS
// =========================

function carregarTurmas(){

  const turmas = getTurmas()

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
// CARREGAR ALUNOS
// =========================

turmaSelect.addEventListener("change", () => {

alunoSelect.innerHTML = `<option value="">Todos</option>`

const alunos = getAlunos()
const turma = turmaSelect.value

alunos
.filter(a =>
  a.turma === turma &&
  alunoAtivo(a)
)
.sort((a,b)=>a.nome.localeCompare(b.nome, 'pt-BR', { numeric:true }))
.forEach(a => {

const opt = document.createElement("option")
opt.value = a.matricula
opt.textContent = a.nome

alunoSelect.appendChild(opt)

})

const dados = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")

if(dados.aluno){
  alunoSelect.value = dados.aluno
}

listar()

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
// STATUS VACINA
// =========================

function getStatusVacina(data){

if(!data) return {texto:"-", classe:""}

const hoje = new Date()
const vacina = new Date(data)

// diferença em dias
const diff = (vacina - hoje) / (1000 * 60 * 60 * 24)

if(diff < 0){
return {texto:"Vencida", classe:"vacina-vencida"}
}

if(diff <= 30){
return {texto:"Próxima", classe:"vacina-proxima"}
}

return {texto:"Em dia", classe:"vacina-ok"}

}

// =========================
// LISTAR
// =========================

function listar(){

const alunos = getAlunos()
const turma = turmaSelect.value
const alunoSelecionado = alunoSelect.value

let filtrados = alunos.filter(a =>
a.turma && alunoAtivo(a)
)

let countSemDVA = 0
let countEmDia = 0
let countProxima = 0
let countVencida = 0

const statusSelecionado = statusSelect.value

filtrados = filtrados.filter(a =>
  (!turma || a.turma === turma) &&
  (!alunoSelecionado || a.matricula === alunoSelecionado) &&
  (!statusSelecionado || getStatusVacina(a.proximaVacina).texto === statusSelecionado)
)

filtrados.sort((a, b) =>
(a.nome || "").localeCompare(b.nome || "")
)

tabela.innerHTML = ""

// FILTRO POR KPI
if(filtroKPI){

if(filtroKPI === "semDVA"){
filtrados = filtrados.filter(a =>
!a.dvaEntregue || a.dvaEntregue === "Não"
)
}else{
filtrados = filtrados.filter(a => {
const status = getStatusVacina(a.proximaVacina)
return status.texto === filtroKPI
})
}

}

// vazio
if(filtrados.length === 0){
tabela.innerHTML = `
<tr>
<td colspan="5" style="text-align:center;">
Nenhum aluno encontrado
</td>
</tr>`
return
}

filtrados.forEach(a => {

const status = getStatusVacina(a.proximaVacina)

// NÃO ENTREGARAM (sem DVA)
if(!a.dvaEntregue || a.dvaEntregue === "Não"){
countSemDVA++
}

// STATUS VACINA
if(status.texto === "Em dia") countEmDia++
if(status.texto === "Próxima") countProxima++
if(status.texto === "Vencida") countVencida++

})

document.getElementById("countSemDVA").textContent = countSemDVA
document.getElementById("countEmDia").textContent = countEmDia
document.getElementById("countProxima").textContent = countProxima
document.getElementById("countVencida").textContent = countVencida
document.getElementById("limparFiltros").addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY)
  location.reload()
})

// renderizar
filtrados.forEach(a => {

const statusVacina = getStatusVacina(a.proximaVacina)

let botaoWhats = ""

const semDVA =
  !a.dvaEntregue ||
  a.dvaEntregue === "Não"

if(
  statusVacina.texto === "Vencida" ||
  statusVacina.texto === "Próxima" ||
  semDVA
){
  botaoWhats = `
  <button class="btn-acao btn-whats" data-id="${a.matricula}" title="WhatsApp">
    <i class="fa-brands fa-whatsapp"></i>
  </button>
  `
}

tabela.innerHTML += `
<tr>
<td>${a.nome || ""}</td>
<td>${formatarData(a.nascimento)}</td>
<td>${a.cartaoSus || "-"}</td>
<td>${a.dvaEntregue || "-"}</td>

<td>${formatarData(a.proximaVacina)}</td>

<td class="${statusVacina.classe}">
${statusVacina.texto}
</td>

<td>
  <div class="acoes-saude">

    <button class="btn-acao btn-editar" data-id="${a.matricula}" title="Editar">
      <i class="fa-solid fa-pen"></i>
    </button>

    ${botaoWhats}

  </div>
</td>

</tr>
`

// 🔥 ativar botões depois de renderizar
document.querySelectorAll(".btn-editar").forEach(btn => {
  btn.addEventListener("click", () => {
    editarAluno(btn.dataset.id)
  })
})

document.querySelectorAll(".btn-whats").forEach(btn => {
  btn.addEventListener("click", () => {
    enviarWhats(btn.dataset.id)
  })
})

})

}

// =========================
// EVENTOS
// =========================

alunoSelect.addEventListener("change", listar)
statusSelect.addEventListener("change", listar)
turmaSelect.addEventListener("change", salvarFiltros)
alunoSelect.addEventListener("change", salvarFiltros)
statusSelect.addEventListener("change", salvarFiltros)

// =========================
// INIT
// =========================

document.addEventListener("DOMContentLoaded", () => {

  aplicarFaviconDinamico()
  
  carregarTurmas()

  const filtros = carregarFiltros()

  // se tiver turma salva, dispara o change
  if(filtros?.turma){
    turmaSelect.dispatchEvent(new Event("change"))
  }else{
    listar()
  }

})


function enviarWhats(matricula){

const alunos = getAlunos()
const aluno = alunos.find(a => a.matricula === matricula)

if(!aluno) return

const telefone =
aluno.telefoneResponsavel ||
aluno.telefoneMae ||
aluno.telefonePai

if(!telefone){
alert("Aluno sem telefone cadastrado")
return
}

const status = getStatusVacina(aluno.proximaVacina)
const primeiroNome = (aluno.nome || "").split(" ")[0]

const semDVA =
  !aluno.dvaEntregue ||
  aluno.dvaEntregue === "Não"

let mensagem = ""

if(semDVA){

  mensagem =
`Olá!

Informamos que ainda não recebemos a Declaração de Vacinação Atualizada (DVA) do(a) ${primeiroNome}.

Solicitamos o envio o mais breve possível.

Obrigado.`

}else if(status.texto === "Vencida"){

  mensagem =
`Olá!

Informamos que a vacinação do(a) ${primeiroNome} encontra-se em atraso.

Pedimos que seja entregue uma DVA atualizada na escola.

Obrigado.`

}else if(status.texto === "Próxima"){

  mensagem =
`Olá!

Informamos que a data da próxima vacina do(a) ${primeiroNome} está chegando.

Pedimos atenção para atualização da DVA.

Obrigado.`

}else{

  mensagem =
`Olá!

Contato referente à atualização de dados de saúde do(a) estudante ${primeiroNome}.

Obrigado.`

}

// formatar número
const numero = telefone.replace(/\D/g, "")

const url = `https://wa.me/55${numero}?text=${encodeURIComponent(mensagem)}`

window.open(url, "_blank")

}

function editarAluno(matricula){
window.location.href = `aluno.html?rga=${matricula}&aba=saude`
}