import { aplicarFaviconDinamico } from "./utils/favicon.js"

// =========================
// PEGAR RGA DA URL
// =========================

const params = new URLSearchParams(window.location.search)
const rga = params.get("rga")

const state = {
  aluno: null
}

function getAlunoAtual(){
  return state.aluno
}

function buscarIrmaos(alunoAtual){

  const alunos = getAlunos()

  return alunos.filter(a => {

    if(a.matricula === alunoAtual.matricula) return false

    return (
      (a.mae && a.mae === alunoAtual.mae) ||
      (a.responsavelNome && a.responsavelNome === alunoAtual.responsavelNome)
    )

  })

}

function renderizarIrmaos(aluno){

  const container = document.getElementById("listaIrmaosAuto")

  if(!container) return

  const irmaos = buscarIrmaos(aluno)

  if(irmaos.length === 0){
    container.innerHTML = "<p>Nenhum irmão encontrado</p>"
    return
  }

  container.innerHTML = ""

  irmaos.forEach(irmao => {

    const div = document.createElement("div")
    div.className = "irmao-card"

    div.innerHTML = `
      ${irmao.matricula || irmao.rga || "-"} - <strong>${irmao.nome}</strong> - Turma: ${irmao.turma || "-"}
    `

    div.style.cursor = "pointer"

    div.onclick = () => {
      window.location.href = `aluno.html?rga=${irmao.matricula}&aba=irmaos`
    }

    container.appendChild(div)

  })

}

// =========================
// LOCAL STORAGE
// =========================

import { getAlunos, salvarAlunos } from "../services/alunosService.js"

// =========================
// UTIL
// =========================

function valor(id){
const el = document.getElementById(id)
return el ? el.value : ""
}

function setValor(id, valor){
const el = document.getElementById(id)
if(el) el.value = valor || ""
}

function setCheck(id, valor){
const el = document.getElementById(id)
if(el) el.checked = valor || false
}

function getCheck(id){
const el = document.getElementById(id)
return el ? el.checked : false
}

function preencherFormulario(aluno){

  aluno.rga = aluno.matricula

  Object.keys(aluno).forEach(chave => {

    const el = document.getElementById(chave)

    if(!el) return

    if(el.type === "checkbox"){
      el.checked = aluno[chave] || false
    }else{
      el.value = aluno[chave] || ""
    }

  })

}

// =========================
// CARREGAR ALUNO
// =========================

function carregarAluno(){

const alunos = getAlunos()

state.aluno = alunos.find(a => a.matricula === rga)
const aluno = state.aluno

if(!aluno){
alert("Aluno não encontrado")
return
}

// =========================
// CABEÇALHO DO PERFIL
// =========================

document.getElementById("perfilNome").textContent = aluno.nome || ""
document.getElementById("perfilRGA").textContent = aluno.matricula || ""
document.getElementById("perfilTurma").textContent = aluno.turma || ""

const situacao = aluno.situacao || "Ativo"

const elSituacao = document.getElementById("perfilSituacao")

elSituacao.textContent = situacao

// remove classes anteriores
elSituacao.className = "status"

// adiciona cor correta

switch(situacao){

case "Ativo":
elSituacao.classList.add("status-ativo")
break

case "Inativo":
elSituacao.classList.add("status-inativo")
break

case "Transferido":
elSituacao.classList.add("status-transferido")
break

case "Concluído":
elSituacao.classList.add("status-concluido")
break

case "Desistente":
elSituacao.classList.add("status-desistente")
break

case "Retido":
elSituacao.classList.add("status-retido")
break

case "Não comparecimento":
elSituacao.classList.add("status-nao")
break

}

// calcular idade

if(aluno.nascimento){

const hoje = new Date()
const nasc = new Date(aluno.nascimento)

let idade = hoje.getFullYear() - nasc.getFullYear()

const m = hoje.getMonth() - nasc.getMonth()

if(m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())){
idade--
}

document.getElementById("perfilIdade").textContent = idade + " anos"

}else{

document.getElementById("perfilIdade").textContent = ""

}


// =========================
// DADOS GERAIS
// =========================

preencherFormulario(aluno)

// =========================
// FOTO DO ALUNO
// =========================
const img = document.getElementById("fotoAluno")
const escola = JSON.parse(localStorage.getItem("escola")) || {}

if(img){

  if(aluno.foto){
    img.src = aluno.foto
  }else{
    img.src = aluno.sexo === "Feminino"
      ? escola.fotoFeminina || ""
      : escola.fotoMasculina || ""
  }

}

renderizarIrmaos(aluno)

}

// =========================
// VINCULAR IRMÃOS
// =========================

function vincularIrmaos(alunoPrincipal, alunos){

  for(let i=1; i<=5; i++){

    const rgaIrmao = valor(`irmao${i}Rga`)

    if(!rgaIrmao) continue

    const irmao = alunos.find(a => a.matricula === rgaIrmao)

    if(!irmao) continue

    // verificar se já existe vínculo
    let jaExiste = false

    for(let j=1; j<=5; j++){
      if(irmao[`irmao${j}Rga`] === alunoPrincipal.matricula){
        jaExiste = true
        break
      }
    }

    if(jaExiste) continue

    // adicionar no primeiro espaço vazio
    for(let j=1; j<=5; j++){
      if(!irmao[`irmao${j}Rga`]){
        irmao[`irmao${j}Rga`] = alunoPrincipal.matricula
        irmao[`irmao${j}Nome`] = alunoPrincipal.nome
        irmao[`irmao${j}Turma`] = alunoPrincipal.turma
        break
      }
    }

  }

}

// =========================
// SALVAR
// =========================

function salvar(e){

e.preventDefault()

const alunos = getAlunos()
const alunoAtual = getAlunoAtual()

const index = alunos.findIndex(a => a.matricula === alunoAtual.matricula)

if(index === -1){
alert("Aluno não encontrado")
return
}

alunos[index] = capturarFormulario()

// irmãos

for(let i=1;i<=5;i++){

alunos[index][`irmao${i}Rga`] = valor(`irmao${i}Rga`)
alunos[index][`irmao${i}Nome`] = valor(`irmao${i}Nome`)
alunos[index][`irmao${i}Turma`] = valor(`irmao${i}Turma`)


}

vincularIrmaos(alunos[index], alunos)

salvarAlunos(alunos)

alert("Dados atualizados com sucesso!")

}

// =========================
// ABAS
// =========================

function abrirAba(nome, el){

  document.querySelectorAll(".conteudo-aba")
    .forEach(aba => aba.classList.remove("ativo"))

  document.querySelectorAll(".aba")
    .forEach(btn => btn.classList.remove("ativa"))

  document.getElementById("aba-" + nome)
    .classList.add("ativo")

  el.classList.add("ativa")
}

// =========================
// INICIALIZAÇÃO
// =========================

document.addEventListener("DOMContentLoaded", () => {

  aplicarFaviconDinamico()
  carregarAluno()

  // 🔥 NOVO: detectar aba pela URL
  const params = new URLSearchParams(window.location.search)
  const aba = params.get("aba")

  if(aba){
    setTimeout(() => {
      const botao = document.querySelector(`.aba[onclick*="${aba}"]`)
      if(botao){
        abrirAba(aba, botao)
      }
    }, 50)
  }

  document
    .getElementById("formAluno")
    .addEventListener("submit", salvar)

})

import { buscarAluno } from "../services/alunosService.js"

function preencherIrmao(numero){

const rga = document.getElementById(`irmao${numero}Rga`).value.trim()

if(!rga) return

const aluno = buscarAluno(rga)

if(!aluno){

alert("Aluno não encontrado")

document.getElementById(`irmao${numero}Nome`).value = ""
document.getElementById(`irmao${numero}Turma`).value = ""

return

}

document.getElementById(`irmao${numero}Nome`).value = aluno.nome
document.getElementById(`irmao${numero}Turma`).value = aluno.turma

}


// =========================
// MODAL FOTO
// =========================
function abrirModalFoto(){
  document.getElementById("modalFotoAluno").classList.add("ativo")
}

function fecharModalFoto(){
  document.getElementById("modalFotoAluno").classList.remove("ativo")
}

// =========================
// PREVIEW
// =========================
document.getElementById("inputFotoAluno").addEventListener("change", function(e){

  const file = e.target.files[0]
  if(!file) return

  const reader = new FileReader()

  reader.onload = function(e){
    document.getElementById("previewFoto").src = e.target.result
  }

  reader.readAsDataURL(file)
})

// =========================
// SALVAR FOTO
// =========================
function salvarFotoAluno(){

  const preview = document.getElementById("previewFoto").src

  if(!preview){
    alert("Selecione uma imagem")
    return
  }

  const alunos = getAlunos()
  const index = alunos.findIndex(a => a.matricula === rga)

  if(index === -1){
    alert("Aluno não encontrado")
    return
  }

  alunos[index].foto = preview

  salvarAlunos(alunos)

  document.getElementById("fotoAluno").src = preview

  fecharModalFoto()
}

// =========================
// ZOOM FOTO (WHATSAPP STYLE)
// =========================
function abrirZoomFoto(){

  const img = document.getElementById("fotoAluno")
  const modal = document.getElementById("modalZoomFoto")
  const imgZoom = document.getElementById("imgZoomFoto")

  if(!img || !img.src) return

  imgZoom.src = img.src

  modal.classList.add("ativo")

  // 🔥 ADICIONE ISSO
  document.body.classList.add("zoom-aberto")
}

function fecharZoomFoto(){
  document.getElementById("modalZoomFoto").classList.remove("ativo")

  // 🔥 ADICIONE ISSO
  document.body.classList.remove("zoom-aberto")
}

// fechar clicando fora
document.getElementById("modalZoomFoto").addEventListener("click", fecharZoomFoto)

// fechar com ESC
document.addEventListener("keydown", function(e){
  if(e.key === "Escape"){
    fecharZoomFoto()
  }
})

// =========================
// EXCLUIR FOTO
// =========================
function excluirFotoAluno(){

  if(!confirm("Deseja remover a foto do aluno?")) return

  const alunos = getAlunos()
  const escola = JSON.parse(localStorage.getItem("escola")) || {}

  const index = alunos.findIndex(a => a.matricula === rga)

  if(index === -1){
    alert("Aluno não encontrado")
    return
  }

  // 🔥 remove foto
  delete alunos[index].foto

  salvarAlunos(alunos)

  // 🔄 atualizar imagem na tela (AGORA USANDO BASE64)
  const img = document.getElementById("fotoAluno")

  if(img){

    if(alunos[index].sexo === "Feminino"){
      img.src = escola.fotoFeminina || ""
    }else{
      img.src = escola.fotoMasculina || ""
    }

  }

  // limpar preview (opcional)
  const preview = document.getElementById("previewFoto")
  if(preview) preview.src = ""

  fecharModalFoto()
}

function capturarFormulario(){

  const dados = {}

  document.querySelectorAll("#formAluno input, #formAluno select")
    .forEach(el => {

      if(!el.id) return

      if(el.type === "checkbox"){
        dados[el.id] = el.checked
      }else{
        dados[el.id] = el.value
      }

    })

  // ajustar nome correto
  dados.matricula = dados.rga

  return dados
}

window.abrirAba = abrirAba
window.abrirModalFoto = abrirModalFoto
window.fecharModalFoto = fecharModalFoto
window.salvarFotoAluno = salvarFotoAluno
window.excluirFotoAluno = excluirFotoAluno
window.abrirZoomFoto = abrirZoomFoto
window.fecharZoomFoto = fecharZoomFoto
window.preencherIrmao = preencherIrmao
