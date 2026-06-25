import { getAlunos } from "../services/alunosService.js"
import { getTurmas } from "../services/turmasService.js"
import { aplicarFaviconDinamico } from "./utils/favicon.js"

const STORAGE_KEY = "cesta_basica"

const selectTurma = document.getElementById("selectTurmaCesta")
const selectAluno = document.getElementById("selectAlunoCesta")
const btnAdicionar = document.getElementById("btnAdicionarCesta")
const tabela = document.getElementById("listaCestaBasica")
const btnExportarCSV = document.getElementById("btnExportarCSV")
const importarCSVInput = document.getElementById("importarCSV")
const inputRga = document.getElementById("inputRgaCesta")
const btnAdicionarRga = document.getElementById("btnAdicionarRgaCesta")
const btnLimparCesta = document.getElementById("btnLimparCesta")

let alunos = []
let turmas = []
let listaCesta = []

function alunoAtivo(aluno){
  return (aluno.situacao || "Ativo") === "Ativo"
}

function carregarLista(){
  listaCesta = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
}

function salvarLista(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(listaCesta))
}

function montarItemCesta(aluno){
  return {
    rga: aluno.matricula || aluno.rga || "",
    nome: aluno.nome || "",
    turma: aluno.turma || "",
    entregue: false,
    telefoneResponsavel: aluno.telefoneResponsavel || "",
    telefoneMae: aluno.telefoneMae || "",
    telefonePai: aluno.telefonePai || ""
  }
}

function atualizarCards(){

  const total = listaCesta.length

  const entregues = listaCesta.filter(item =>
    item.entregue === true
  ).length

  const faltam = total - entregues

  document.getElementById("countCadastrados").textContent = total
  document.getElementById("countEntregues").textContent = entregues
  document.getElementById("countFaltam").textContent = faltam

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

  const turmaSelecionada = selectTurma.value

  selectAluno.innerHTML = `
    <option value="">Selecione o estudante</option>
  `

  if(!turmaSelecionada) return

  const alunosFiltrados = alunos
    .filter(a =>
      alunoAtivo(a) &&
      a.turma === turmaSelecionada
    )
    .sort((a, b) =>
      (a.nome || "").localeCompare(b.nome || "", "pt-BR")
    )

  alunosFiltrados.forEach(aluno => {
    const option = document.createElement("option")
    option.value = aluno.matricula
    option.textContent = aluno.nome
    selectAluno.appendChild(option)
  })

}

function adicionarEstudante(){

  const rga = selectAluno.value

  if(!selectTurma.value){
    alert("Selecione uma turma.")
    return
  }

  if(!rga){
    alert("Selecione um estudante.")
    return
  }

  const aluno = alunos.find(a => a.matricula === rga)

  if(!aluno){
    alert("Estudante não encontrado.")
    return
  }

  const jaExiste = listaCesta.some(item => item.rga === rga)

  if(jaExiste){
    alert("Este estudante já está na lista.")
    return
  }

  listaCesta.push(montarItemCesta(aluno))

  salvarLista()
  renderizarLista()

  selectAluno.value = ""
}

function adicionarPorRGA(){

  const rgaDigitado = inputRga.value.trim()

  if(!rgaDigitado){
    alert("Digite o RGA do estudante.")
    return
  }

  const aluno = alunos.find(a =>
    String(a.matricula || a.rga || "") === rgaDigitado
  )

  if(!aluno){
    alert("Estudante não encontrado.")
    return
  }

  const rgaAluno = aluno.matricula || aluno.rga

  const jaExiste = listaCesta.some(item =>
    String(item.rga) === String(rgaAluno)
  )

  if(jaExiste){
    alert("Este estudante já está na lista.")
    return
  }

  listaCesta.push(montarItemCesta(aluno))

  salvarLista()
  renderizarLista()

  inputRga.value = ""

  alert("Estudante adicionado com sucesso!")
}

function renderizarLista(){

  tabela.innerHTML = ""

  if(listaCesta.length === 0){
    tabela.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;">
          Nenhum estudante adicionado.
        </td>
      </tr>
    `

    atualizarCards()
    return
  }

  const listaOrdenada = [...listaCesta].sort((a, b) => {
    if((a.turma || "") === (b.turma || "")){
      return (a.nome || "").localeCompare(b.nome || "", "pt-BR")
    }

    return (a.turma || "").localeCompare(
      b.turma || "",
      "pt-BR",
      { numeric: true }
    )
  })

  listaOrdenada.forEach(item => {

    const tr = document.createElement("tr")
    
    if(item.entregue){
      tr.classList.add("linha-entregue")
    }

    tr.innerHTML = `
      <td>${item.rga || ""}</td>
      <td>${item.nome || ""}</td>
      <td>${item.turma || "-"}</td>
      <td>
        <input
          type="checkbox"
          class="check-entrega"
          data-rga="${item.rga}"
          ${item.entregue ? "checked" : ""}>
      </td>
      <td>
        <div class="acoes-saude">

          ${!item.entregue ? `
            <button class="btn-acao btn-whats" title="Enviar WhatsApp">
              <i class="fa-brands fa-whatsapp"></i>
            </button>
          ` : ""}

          <button class="btn-acao btn-excluir" title="Excluir da lista">
            <i class="fa-solid fa-trash"></i>
          </button>

        </div>
      </td>
    `

    tr.querySelector(".btn-whats")
      ?.addEventListener("click", () =>
        enviarWhatsApp(item.rga)
      )

    tr.querySelector(".btn-excluir")
      .addEventListener("click", () => removerEstudante(item.rga))

    tr.querySelector(".check-entrega")
      .addEventListener("change", e => {
        marcarEntrega(item.rga, e.target.checked)
      })

    tabela.appendChild(tr)

  })

   atualizarCards()

}

function marcarEntrega(rga, entregue){

  const item = listaCesta.find(a =>
    String(a.rga) === String(rga)
  )

  if(!item) return

  item.entregue = entregue

  salvarLista()
  renderizarLista()
}

function limparListaCesta(){

  if(listaCesta.length === 0){
    alert("A lista já está vazia.")
    return
  }

  const confirmar = confirm(
    "Deseja apagar TODOS os estudantes da lista da cesta básica?"
  )

  if(!confirmar) return

  listaCesta = []

  salvarLista()
  renderizarLista()

  alert("Lista apagada com sucesso.")
}



function removerEstudante(rga){

  if(!confirm("Deseja remover este estudante da lista?")) return

  listaCesta = listaCesta.filter(item => item.rga !== rga)

  salvarLista()
  renderizarLista()
}

function enviarWhatsApp(rga){

  const item = listaCesta.find(a =>
    String(a.rga) === String(rga)
  )

  if(!item) return

  const alunoCadastro = alunos.find(a =>
    String(a.matricula || a.rga || "") === String(rga)
  )

  const telefone =
    item.telefoneResponsavel ||
    item.telefoneMae ||
    item.telefonePai ||
    alunoCadastro?.telefoneResponsavel ||
    alunoCadastro?.telefoneMae ||
    alunoCadastro?.telefonePai

  if(!telefone){
    alert("Este estudante não possui telefone cadastrado.")
    return
  }

  const primeiroNome = (item.nome || alunoCadastro?.nome || "").split(" ")[0]

  const mensagem =
    `Olá!
    
    Informamos que chegou uma cesta básica para o(a) estudante.

    *RETIRADA:*
    A partir do dia 18/06/2026
    Horário: das 08:00 às 18:00.

    *QUEM PODE RETIRAR?*
    - Pai
    - Mãe
    - Responsável legal (Guarda)

    *TRAZER*
    - Documento de identidade com foto
    - sacola ou carrinho para a retirada da cesta`

  const numero = telefone.replace(/\D/g, "")

  const url =
    `https://wa.me/55${numero}?text=${encodeURIComponent(mensagem)}`

  window.open(url, "_blank")
}

document.addEventListener("DOMContentLoaded", () => {

  aplicarFaviconDinamico()

  alunos = getAlunos()
  turmas = getTurmas()

  carregarLista()
  carregarTurmas()
  renderizarLista()

  selectTurma.addEventListener("change", carregarAlunosDaTurma)
  btnAdicionar.addEventListener("click", adicionarEstudante)

  btnAdicionarRga?.addEventListener("click", adicionarPorRGA)

  inputRga?.addEventListener("keydown", e => {
    if(e.key === "Enter"){
      adicionarPorRGA()
    }
  })

  btnLimparCesta?.addEventListener("click", limparListaCesta)

  btnExportarCSV?.addEventListener(
    "click",
    exportarCSV
  )

  importarCSVInput?.addEventListener(
    "change",
    importarCSV
  )

})

function exportarCSV(){

  if(listaCesta.length === 0){
    alert("Nenhum estudante para exportar.")
    return
  }

  let csv =
    "RGA;Nome;Turma;Entregue;Telefone Responsável;Telefone Mãe;Telefone Pai\n"

  listaCesta.forEach(item => {

    csv +=
    `${item.rga};` +
    `${item.nome};` +
    `${item.turma};` +
    `${item.entregue ? "Sim" : "Não"};` +
    `${item.telefoneResponsavel || ""};` +
    `${item.telefoneMae || ""};` +
    `${item.telefonePai || ""}\n`

  })

  const blob = new Blob(
    [csv],
    {
      type:
      "text/csv;charset=utf-8;"
    }
  )

  const link =
    document.createElement("a")

  link.href =
    URL.createObjectURL(blob)

  link.download =
    "cesta-basica.csv"

  link.click()

}


function importarCSV(e){

  const file = e.target.files[0]

  if(!file) return

  const reader = new FileReader()

  reader.onload = function(event){

    const linhas =
      event.target.result.split("\n")

    linhas.shift()

    linhas.forEach(linha => {

      if(!linha.trim()) return

      const [
      rga,
      nome,
      turma,
      entregue,
      telefoneResponsavel,
      telefoneMae,
      telefonePai
    ] = linha.split(";")

      const rgaLimpo =
        rga?.trim()

      if(!rgaLimpo) return

      const existe =
        listaCesta.some(
          item => item.rga === rgaLimpo
        )

      if(existe) return

      listaCesta.push({
        rga: rgaLimpo,
        nome: nome?.trim() || "",
        turma: turma?.trim() || "",
        entregue: (entregue?.trim().toLowerCase() === "sim"),
        telefoneResponsavel: telefoneResponsavel?.trim() || "",
        telefoneMae: telefoneMae?.trim() || "",
        telefonePai: telefonePai?.trim() || ""
      })

    })

    salvarLista()
    renderizarLista()

    alert(
      "Importação concluída!"
    )

  }

  reader.readAsText(file)

}