import { setData, getData } from "../../core/storage.js"
import { aplicarFaviconDinamico } from "../utils/favicon.js"

// =========================
// DADOS DA ESCOLA
// =========================

export function salvarDadosEscola(){

const dadosAntigos = getData("escola") || {}

const dados = {
prefeitura: document.getElementById("escolaPrefeitura").value,
secretaria: document.getElementById("escolaSecretaria").value,
diretoria: document.getElementById("escolaDiretoria").value,

nome: document.getElementById("escolaNome").value,

endereco: document.getElementById("escolaEndereco").value,
numero: document.getElementById("escolaNumero").value,
bairro: document.getElementById("escolaBairro").value,
cep: document.getElementById("escolaCep").value,
cidade: document.getElementById("escolaCidade").value,
estado: document.getElementById("escolaEstado").value,

telefone: document.getElementById("escolaTelefone").value,
telefone2: document.getElementById("escolaTelefone2").value,
email: document.getElementById("escolaEmail").value,

eol: document.getElementById("escolaEol").value,
inep: document.getElementById("escolaInep").value,

// 🔥 salvar logo
logo: logoBase64 || dadosAntigos.logo || "",
logoPrefeitura: logoPrefeituraBase64 || dadosAntigos.logoPrefeitura || "",

fotoMasculina: fotoMasculinaBase64 || dadosAntigos.fotoMasculina || "",
fotoFeminina: fotoFemininaBase64 || dadosAntigos.fotoFeminina || ""

}

setData("escola", dados)

aplicarFaviconDinamico()

atualizarPreview()

alert("Dados da escola salvos!")

}

function carregarDadosEscola(){

const dados = getData("escola") || {}

document.getElementById("escolaPrefeitura").value = dados.prefeitura || ""
document.getElementById("escolaSecretaria").value = dados.secretaria || ""
document.getElementById("escolaDiretoria").value = dados.diretoria || ""
document.getElementById("escolaNome").value = dados.nome || ""
document.getElementById("escolaEndereco").value = dados.endereco || ""
document.getElementById("escolaNumero").value = dados.numero || ""
document.getElementById("escolaBairro").value = dados.bairro || ""
document.getElementById("escolaCep").value = dados.cep || ""
document.getElementById("escolaCidade").value = dados.cidade || ""
document.getElementById("escolaEstado").value = dados.estado || ""
document.getElementById("escolaTelefone").value = dados.telefone || ""
document.getElementById("escolaTelefone2").value = dados.telefone2 || ""
document.getElementById("escolaEmail").value = dados.email || ""
document.getElementById("escolaEol").value = dados.eol || ""
document.getElementById("escolaInep").value = dados.inep || ""

if(dados.fotoMasculina){
    document.getElementById("previewFotoMasculina").src = dados.fotoMasculina
}

if(dados.fotoFeminina){
    document.getElementById("previewFotoFeminina").src = dados.fotoFeminina
}


}

function atualizarPreview(){

const dados = getData("escola") || {}

document.getElementById("previewPrefeitura").textContent = dados.prefeitura || ""
document.getElementById("previewSecretaria").textContent = dados.secretaria || ""
document.getElementById("previewDiretoria").textContent = dados.diretoria || ""

document.getElementById("previewNome").textContent = dados.nome || ""
let enderecoCompleto = dados.endereco || ""

if(dados.numero){
  enderecoCompleto += ", " + dados.numero
}

if(dados.bairro){
  enderecoCompleto += " - " + dados.bairro
}

if(dados.cep){
  enderecoCompleto += " - CEP: " + dados.cep
}

document.getElementById("previewEndereco").textContent = enderecoCompleto

let cidadeEstado = dados.cidade || ""

if(dados.estado){
  cidadeEstado += " - " + dados.estado
}

document.getElementById("previewCidade").textContent = cidadeEstado

let telefones = dados.telefone || ""

if(dados.telefone2){
telefones += " / " + dados.telefone2
}

document.getElementById("previewTelefone").textContent = "Fone: " + telefones
document.getElementById("previewEmail").textContent = "E-mail: " + (dados.email || "")

// 🔥 logo
if(dados.logo){
document.getElementById("previewLogo").src = dados.logo
}

if(dados.logoPrefeitura){
document.getElementById("previewLogoPrefeitura").src = dados.logoPrefeitura
}

}

document.addEventListener("DOMContentLoaded", () => {

  carregarDadosEscola()
  atualizarPreview()

  configurarUploads()

})

// =========================
// SALVAR LOGO DA ESCOLA EM BASE64
// =========================

let logoBase64 = ""

// =========================
// SALVAR LOGO DA PREFEITURA EM BASE64
// =========================

let logoPrefeituraBase64 = ""

// =========================
// UPLOAD DE FOTOS - MASCULINO OU FEMININO
// =========================
let fotoMasculinaBase64 = ""
let fotoFemininaBase64 = ""

function configurarUploads(){

  document.getElementById("escolaLogo")?.addEventListener("change", function(e){

    const file = e.target.files[0]
    if(!file) return

    document.getElementById("nomeArquivoEscola").textContent = file.name

    const reader = new FileReader()

    reader.onload = function(event){
      logoBase64 = event.target.result
      document.getElementById("previewLogo").src = logoBase64
    }

    reader.readAsDataURL(file)
  })

  document.getElementById("logoPrefeitura")?.addEventListener("change", function(e){

    const file = e.target.files[0]
    if(!file) return

    document.getElementById("nomeArquivoPrefeitura").textContent = file.name

    const reader = new FileReader()

    reader.onload = function(event){
      logoPrefeituraBase64 = event.target.result
    }

    reader.readAsDataURL(file)
  })

  document.getElementById("fotoMasculina")?.addEventListener("change", function(e){

    const file = e.target.files[0]
    if(!file) return

    document.getElementById("nomeFotoMasculina").textContent = file.name

    const reader = new FileReader()

    reader.onload = function(event){
      fotoMasculinaBase64 = event.target.result
      document.getElementById("previewFotoMasculina").src = fotoMasculinaBase64
    }

    reader.readAsDataURL(file)
  })

  document.getElementById("fotoFeminina")?.addEventListener("change", function(e){

    const file = e.target.files[0]
    if(!file) return

    document.getElementById("nomeFotoFeminina").textContent = file.name

    const reader = new FileReader()

    reader.onload = function(event){
      fotoFemininaBase64 = event.target.result
      document.getElementById("previewFotoFeminina").src = fotoFemininaBase64
    }

    reader.readAsDataURL(file)
  })

}

