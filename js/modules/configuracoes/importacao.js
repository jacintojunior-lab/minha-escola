import { getAlunos, salvarAlunos } from "../../services/alunosService.js"

// =========================
// IMPORTAR CSV - SIMPLES - NOME, RGA E TURMA
// =========================
export function importarCSV() {
    const input = document.getElementById("arquivoCSV");

    if (!input.files || input.files.length === 0) {
        alert("Selecione um arquivo CSV.");
        return;
    }

    const arquivo = input.files[0];

    if (!arquivo.name.endsWith(".csv")) {
        alert("O arquivo precisa estar no formato .csv");
        return;
    }

    const leitor = new FileReader();

    leitor.onload = function (e) {
        const conteudo = e.target.result;
        processarCSV(conteudo);
    };

    leitor.readAsText(arquivo, "UTF-8");
}

function converterDataUniversal(data){

if(!data) return ""

data = data.trim()

// troca separadores diferentes por "-"
data = data.replace(/\./g,"-").replace(/\//g,"-")

const partes = data.split("-")

if(partes.length !== 3) return data

let dia
let mes
let ano

// caso venha YYYY-MM-DD
if(partes[0].length === 4){

ano = partes[0]
mes = partes[1]
dia = partes[2]

}else{

// caso venha DD-MM-YYYY
dia = partes[0]
mes = partes[1]
ano = partes[2]

}

// garantir dois dígitos
dia = dia.padStart(2,"0")
mes = mes.padStart(2,"0")

return `${ano}-${mes}-${dia}`

}

// =========================
// PROCESSAR CSV
// =========================
function processarCSV(texto) {
    const linhas = texto.split(/\r?\n/);

    if (linhas.length < 2) {
        alert("Arquivo CSV vazio ou inválido.");
        return;
    }

    let alunos = getAlunos()
        salvarAlunos(alunos);
    let adicionados = 0;
    let ignorados = 0;

    linhas.forEach((linha, index) => {
        if (!linha.trim()) return;

        const partes = linha.split(";");

        if (partes.length < 3) {
            ignorados++;
            return;
        }

        const nome = partes[0].trim();
        const matricula = partes[1].trim();
        const turma = partes[2].trim();

        if (!nome || !matricula || !turma) {
            ignorados++;
            return;
        }

        // Evita matrícula duplicada
        const jaExiste = alunos.some(a => a.matricula === matricula);
        if (jaExiste) {
            ignorados++;
            return;
        }

        alunos.push({ nome, matricula, turma });
        adicionados++;
    });

    localStorage.setItem("alunos", JSON.stringify(alunos));

    alert(
        `Importação concluída!\n\n` +
        `Alunos adicionados: ${adicionados}\n` +
        `Registros ignorados: ${ignorados}`
    );

    document.getElementById("arquivoCSV").value = "";
}


// =========================
// LER PLANILHA
// =========================

let dadosImportacao = []

export function lerPlanilha(){

const input = document.getElementById("arquivoImportacao")

if(!input.files.length){
alert("Selecione um arquivo")
return
}

const arquivo = input.files[0]

const leitor = new FileReader()

leitor.onload = function(e){

const data = new Uint8Array(e.target.result)

const workbook = XLSX.read(data,{type:"array"})

const sheet = workbook.Sheets[workbook.SheetNames[0]]

const json = XLSX.utils.sheet_to_json(sheet)

dadosImportacao = json

mostrarPreview()

}

leitor.readAsArrayBuffer(arquivo)

}

// =========================
// MOSTRAR PREVIEW
// =========================

function mostrarPreview(){

const tbody = document.getElementById("previewImportacao")

tbody.innerHTML = ""

dadosImportacao.forEach(linha => {

const tr = document.createElement("tr")

tr.innerHTML = `
<td>${linha.nome || linha.Nome || ""}</td>
<td>${linha.matricula || linha.Matricula || ""}</td>
<td>${linha.turma || linha.Turma || ""}</td>
`

tbody.appendChild(tr)

})

}

// =========================
// CONFIRMAR IMPORTAÇÃO
// =========================

export function confirmarImportacao(){

let alunos = getAlunos()
salvarAlunos(alunos)

let adicionados = 0
let atualizados = 0

dadosImportacao.forEach(linha => {

const matricula =
(linha.matricula ||
linha.Matricula ||
linha.RGA ||
linha.rga || "").toString().trim()

if(!matricula) return

const index = alunos.findIndex(a => a.matricula === matricula)

const aluno = {
nome: (linha.nome || linha.Nome || "").trim(),
turma: (linha.turma || linha.Turma || "").trim(),
matricula: matricula
}

if(index === -1){

alunos.push(aluno)
adicionados++

}else{

alunos[index] = {...alunos[index], ...aluno}
atualizados++

}

})

localStorage.setItem("alunos", JSON.stringify(alunos))

alert(
`Importação concluída!

Adicionados: ${adicionados}
Atualizados: ${atualizados}`
)

}

// =========================
// IMPORTADOR - COMPLETO
// =========================
export function importarCSVCompleto(){

const input = document.getElementById("csvTeste")

if(!input.files.length){
alert("Selecione um arquivo CSV")
return
}

const arquivo = input.files[0]

const leitor = new FileReader()

leitor.onload = function(e){

const texto = e.target.result

processarCSVCompleto(texto)

}

leitor.readAsText(arquivo,"UTF-8")

}

// =========================
// IMPORTADOR PROFISSIONAL - COMPLETO
// =========================

function processarCSVCompleto(texto){

const linhas = texto.split(/\r?\n/)

if(linhas.length < 2){
alert("Arquivo CSV inválido")
return
}

// =========================
// DETECTAR SEPARADOR
// =========================

let separador = ";"
if(linhas[0].includes(",") && !linhas[0].includes(";")){
separador = ","
}

// =========================
// CABEÇALHO
// =========================

let cabecalho = linhas[0].split(separador)
.map(c => c.trim().toLowerCase())

// =========================
// MAPA INTELIGENTE
// =========================

const mapa = {
nome: ["nome","nome completo","aluno"],
matricula: ["matricula","rga","registro"],
turma: ["turma","classe"],

// ESCOLAR
ra: ["ra"],
eol: ["eol"],
inep: ["inep"],
vagaOrigem: ["vaga origem","origem vaga","vagaorigem","origemvaga"],

// PESSOAIS
nascimento: ["nascimento","data nascimento"],
sexo: ["sexo"],
cidade: ["cidade"],
estado: ["estado"],
uf: ["uf"],
pais: ["pais","país"],
nacionalidade: ["nacionalidade"],

// SITUAÇÃO
situacao: ["situacao","status"],

// RG
rgNumero: ["rg","numero rg","rgnumero"],
rgData: ["data rg","rg data","data expedicao rg","rgdata"],
rgOrgao: ["orgao rg","rg orgao","órgão rg","rgorgao"],
rgEstado: ["estado rg","uf rg","rgestado"],

// CPF
cpf: ["cpf"],

// CERTIDÃO
certidaoCompleta: ["certidao completa","certidão completa","certidaocompleta"],
certidaoNumero: ["certidao","certidão","numero certidao","certidaonumero"],
certidaoFolha: ["folha certidao","certidaofolha"],
certidaoLivro: ["livro certidao","certidaolivro"],
certidaoData: ["data certidao","data expedicao certidao","certidaodata","datacertidao"],
certidaoDistrito: ["distrito certidao","certidaodistrito"],
certidaoEstado: ["estado certidao","certidaoestado"],

// NIS
nis: ["nis","numero nis"],

// FAMÍLIA
mae: ["mae","nome mae","mãe","nome da mae","nome da mãe"],
maeCpf: ["cpf mae","cpf da mae","cpf mãe", "maecpf"],
maeRg: ["rg mae","rg da mae","rg mãe", "marrg"],

pai: ["pai","nome pai","nome do pai"],
paiCpf: ["cpf pai","cpf do pai","paicpf"],
paiRg: ["rg pai","rg do pai","pairg"],

responsavelNome: ["responsavel","responsável","nome responsavel","responsavelnome"],
responsavelCpf: ["cpf responsavel","cpf responsável","responsavelcpf"],
responsavelRg: ["rg responsavel","rg responsável","responsavelrg"],

// ENDEREÇO
rua: ["rua","logradouro","endereco","endereço"],
numero: ["numero","número","num"],
complemento: ["complemento"],
bairro: ["bairro"],
cidadeEndereco: ["cidade endereco","cidade","cidade residência","cidadeendereco","enderecocidade"],
estadoEndereco: ["estado endereco","estado","estadoendereco","endereco,estado"],
cep: ["cep","codigo postal"],

distanciaEscola: ["distancia escola","distância escola"],

enderecoAtualizado: [
"endereco atualizado",
"endereço atualizado",
"endereco ok",
"endereço ok"
],

// CONTATO
telefoneMae: ["telefone mae","telefone mãe","fone mae","telefonemae","maetelefone"],
telefonePai: ["telefone pai","fone pai","telefonepai","paitelefone"],
telefoneResponsavel: ["telefone responsavel","telefone responsável","telefoneresponsavel","responsaveltelefone"],

telefoneRecado1: ["telefone recado 1","recado1 telefone","telefonerecado1","recadotelefone1"],
nomeRecado1: ["nome recado 1","recado1 nome","nomerecado1","recadonome1"],
parentescoRecado1: ["parentesco recado 1","parentescorecado1"],

telefoneRecado2: ["telefone recado 2","recado2 telefone","telefonerecado2","recadotelefone2"],
nomeRecado2: ["nome recado 2","recado2 nome","nomerecado2","recadonome2"],
parentescoRecado2: ["parentesco recado 2","parentescorecado2","recadoparentesco2"],

emailAluno: ["email aluno","email estudante","emailaluno","alunoemail"],
emailResponsavel: ["email responsavel","email responsável","emailresponsavel","responsavelemail"],

// SAÚDE
cartaoSus: ["cartao sus","cartão sus","sus","cartaosus","suscartao"],
dvaEntregue: ["dva","dva entregue","dvaentregue","entreguedva"],
proximaVacina: ["proxima vacina","próxima vacina","proximavacina","vacinaproxima"],

problemasSaude: ["problemas saude","problemas de saude","problemassaude","saudeproblemas"],
deficiencia: ["deficiencia","deficiência"],

ene: ["ene","necessidades especiais","ENE","necessidade especial"],

// IRMÃOS
irmao1Rga: ["irmao1 rga","rga irmao 1","irmao1rga","rgairmao1"],
irmao1Nome: ["irmao1 nome","nome irmao 1","irmao1nome"],
irmao1Turma: ["irmao1 turma","turma irmao 1","irmao1turma"],

irmao2Rga: ["irmao2 rga","rga irmao 2","irmao2rga"],
irmao2Nome: ["irmao2 nome","nome irmao 2","irmao2nome"],
irmao2Turma: ["irmao2 turma","turma irmao 2","irmao2turma"],

irmao3Rga: ["irmao3 rga","rga irmao 3","irmao3rga"],
irmao3Nome: ["irmao3 nome","nome irmao 3","irmao3nome"],
irmao3Turma: ["irmao3 turma","turma irmao 3","irmao3turma"],

irmao4Rga: ["irmao4 rga","rga irmao 4","irmao4rga"],
irmao4Nome: ["irmao4 nome","nome irmao 4","irmao4nome"],
irmao4Turma: ["irmao4 turma","turma irmao 4","irmao4turma"],

irmao5Rga: ["irmao5 rga","rga irmao 5","irmao5rga"],
irmao5Nome: ["irmao5 nome","nome irmao 5","irmao5nome"],
irmao5Turma: ["irmao5 turma","turma irmao 5","irmao5turma"],

// SAÍDA
pessoaAutorizada1: ["pessoa autorizada 1","pessoaautorizada1","autorizado1","saida1"],
pessoaAutorizada2: ["pessoa autorizada 2","pessoaautorizada2","autorizado2","saida2"],
pessoaAutorizada3: ["pessoa autorizada 3","pessoaautorizada3","autorizado3","saida3"],
pessoaAutorizada4: ["pessoa autorizada 4","pessoaautorizada4","autorizado4","saida4"],
pessoaAutorizada5: ["pessoa autorizada 5","pessoaautorizada5","autorizado5","saida5"],
pessoaAutorizada6: ["pessoa autorizada 6","pessoaautorizada6","autorizado6","saida6"],
pessoaAutorizada7: ["pessoa autorizada 7","pessoaautorizada7","autorizado7","saida7"],
pessoaAutorizada8: ["pessoa autorizada 8","pessoaautorizada8","autorizado8","saida8"],
pessoaAutorizada9: ["pessoa autorizada 9","pessoaautorizada9","autorizado9","saida9"],
pessoaAutorizada10: ["pessoa autorizada 10","pessoaautorizada10","autorizado10","saida10"],

// TEG
tegClassificado: ["teg classificado","classificado teg","tegClassificado","classificadoteg","classificado"],
tegMotivo: ["teg motivo","motivo teg","tegmotivo","motivoteg","motivo"],
tegSituacao: ["teg situacao","situação teg","tegsituacao","situacaoteg"],
tegCondutor: ["teg condutor","condutor teg","tegcondutor","condutorteg"],
}



// =========================
// FUNÇÃO MATCH
// =========================

function mapearCampo(coluna){

for(let campo in mapa){

if(mapa[campo].includes(coluna)){
return campo
}

}

return null
}

// =========================
// PROCESSAMENTO
// =========================

let alunos = getAlunos()
salvarAlunos(alunos)

let adicionados = 0
let atualizados = 0
let erros = []

for(let i=1;i<linhas.length;i++){

let linha = linhas[i]
if(!linha.trim()) continue

let valores = linha.split(separador)

if(valores.length === 1){
valores = linha.split(separador === ";" ? "," : ";")
}

let aluno = {}

// mapear colunas
cabecalho.forEach((coluna,index)=>{

let campo = mapearCampo(coluna)
if(!campo) return

let valor = (valores[index] || "").trim()

// normalizar texto
valor = valor.replace(/\s+/g," ").trim()

// converter datas
if(
campo === "nascimento" ||
campo === "rgData" ||
campo === "certidaoData" ||
campo === "proximaVacina"
){
valor = converterDataUniversal(valor)
}

// normalizar situação
if(campo === "situacao"){
valor = normalizarOpcao("situacao", valor)
}

// padronizar vaga origem
if(campo === "vagaOrigem"){
valor = normalizarOpcao("vagaorigem", valor)
}

// padronizar sexo
if(campo === "sexo"){
valor = normalizarOpcao("sexo", valor)
}

// padronizar DVA Entregue
if(campo === "dvaEntregue"){
valor = normalizarOpcao("dvaentregue", valor)
}

// padronizar Classificado TEG
if(campo === "tegClassificado"){
  valor = normalizarOpcao("tegclassificado", valor)
}

// padronizar Situação TEG
if(campo === "tegSituacao"){
valor = normalizarOpcao("tegsituacao", valor)
}

// padronizar Motivo TEG
if(campo === "tegMotivo"){
  valor = normalizarOpcao("tegmotivo", valor)
}

// padronizar nome (primeira letra maiúscula)
if(campo === "nome"){
valor = valor.toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
}

// CHECKBOXES
if(campo === "ene" || campo === "enderecoAtualizado"){
  valor = normalizarBoolean(valor)
}

aluno[campo] = valor

})

// =========================
// GARANTIR MATRÍCULA
// =========================

if(!aluno.matricula){

const idx = cabecalho.findIndex(c =>
c.includes("matricula") || c.includes("rga")
)

if(idx !== -1){
aluno.matricula = (valores[idx] || "").trim()
}

}

// =========================
// VALIDAR
// =========================

if(!aluno.matricula || !aluno.nome){
erros.push(`Linha ${i+1} ignorada`)
continue
}

// =========================
// SALVAR
// =========================

const index = alunos.findIndex(a => a.matricula == aluno.matricula)

if(index === -1){
alunos.push(aluno)
adicionados++
}else{
alunos[index] = {...alunos[index], ...aluno}
atualizados++
}

}

// =========================
// FINAL
// =========================

localStorage.setItem("alunos", JSON.stringify(alunos))

alert(
`Importação concluída 🚀

Adicionados: ${adicionados}
Atualizados: ${atualizados}
Erros: ${erros.length}`
)

console.log("Erros:", erros)

}

const camposOpcao = [
"situacao",
"sexo",
"dvaentregue",
"tegclassificado",
"tegsituacao"
]

// =========================
// NORMALIZAR CAMPOS DE OPÇÃO
// =========================

function normalizarOpcao(campo, valor){

if(!valor) return ""

const original = valor
valor = valor.toString().trim().toLowerCase()

const opcoes = {

situacao: {
"ativo":"Ativo",
"ATIVO":"Ativo",
"inativo":"Inativo",
"INATIVO":"Inativo",
"transferido":"Transferido",
"concluido":"Concluído",
"concluído":"Concluído",
"Concluinte":"Concluído",
"CONCLUINTE":"Concluído",
"concluinte":"Concluído",
"desistente":"Desistente",
"DESISTENTE":"Desistente",
"retido":"Retido",
"RETIDO":"Retido",
"não comparecimento":"Não comparecimento",
"NÃO COMPARECIMENTO":"Não comparecimento",
"nao comparecimento":"Não comparecimento"
},

vagaorigem:{
"1 ano":"1º Ano",
"1º ano":"1º Ano",
"1º ANO":"1º Ano",
"1º ANO":"1º Ano",
"1ºANO":"1º Ano",
"1ºano":"1º Ano",
"primeiro ano":"1º Ano",

"transferencia":"Transferência",
"transferência":"Transferência",
"transferência":"Transferência",
"TRANSFERÊNCIA":"Transferência",

"fora da rede":"Fora da Rede",
"fora rede":"Fora da Rede",
"FORA DA REDE":"Fora da Rede",

"preferencial":"Preferencial",
"pref":"Preferencial",
"PREFERENCIAL":"Preferencial",
"PREFERENCIAL+":"Preferencial",

"deslocamento":"Deslocamento",
"DESLOCAMENTO":"Deslocamento",
"DESLOCAMENTO-???":"Deslocamento",

"desconhecido":"Desconhecido",
"DESCONHECIDO":"Desconhecido"
},

sexo:{
"masculino":"Masculino",
"m":"Masculino",
"M":"Masculino",
"feminino":"Feminino",
"f":"Feminino",
"F":"Feminino"
},

dvaentregue:{
"sim":"Sim",
"SIM":"Sim",
"s":"Sim",
"true":"Sim",
"1":"Sim",
"não":"Não",
"NÃO":"Não",
"nao":"Não",
"n":"Não",
"false":"Não",
"0":"Não",
"ATUALIZAR":"Atualizar",
"atualizar":"Atualizar",
},

tegclassificado:{
"classificado":"Classificado",
"CLASSIFICADO":"Classificado",
"nao classificado":"Não classificado",
"NAO CLASSIFICADO":"Não classificado",
"não classificado":"Não classificado",
"não classif":"Não classificado",
"NÃO CLASSIFICADO":"Não classificado",
"nc":"Não classificado",
},

tegmotivo:{
"distancia":"Distância",
"distância":"Distância",
"DISTÂNCIA":"Distância",
"irmaos":"Junção de Irmãos",
"junção de irmãos":"Junção de Irmãos",
"JUNÇÃO DE IRMÃOS":"Junção de Irmãos",
"JUNCAO DE IRMAOS":"Junção de Irmãos",
"deficiencia":"DEFIC./A.H./T.G.D.",
"deficiência":"DEFIC./A.H./T.G.D.",
"DEFICIÊNCIA":"DEFIC./A.H./T.G.D.",
"DEFICIENCIA":"DEFIC./A.H./T.G.D.",
"doenca cronica":"Doença Crônica",
"DOENÇA CRÔNICA":"Doença Crônica",
"DOENCA CRONICA":"Doença Crônica",
"doença crônica":"Doença Crônica",
},

tegsituacao:{
"inscrito":"Inscrito",
"INSCRITO":"Inscrito",
"em analise":"Em análise",
"em análise":"Em análise",
"AVALIAR":"Verificar",
"avaliar":"Verificar",
"cancelado":"Cancelado",
"CANCELADO":"Cancelado",
"PRÉ-INSCRITO":"Pré-inscrito",
"pre-inscrito":"Pré-inscrito",
"preinscrito":"Pré-inscrito",
"préinscrito":"Pré-inscrito",
"pré-inscrito":"Pré-inscrito",
"SEM INTERESSE":"Sem interesse",
"sem interesse":"Sem interesse",
"seminteresse":"Sem interesse",
"Irregular":"Irregular",
"irregular":"Irregular",
"IRREGULAR":"Irregular",
}

}

if(opcoes[campo] && opcoes[campo][valor]){
return opcoes[campo][valor]
}

// ⚠️ IMPORTANTE: retorna original se não for opção
return original

}

function normalizarBoolean(valor){

if(!valor) return false

valor = valor.toString().trim().toLowerCase()

const verdadeiros = [
"sim","s","1","true","verdadeiro","x","ok"
]

return verdadeiros.includes(valor)

}

// =========================
// IMPORTADOR SIMPLES (NOME ATÉ SITUAÇÃO)
// =========================
export function importarCSVAlunosCompletoSimples(){

const input = document.getElementById("arquivoCSV")

if(!input.files.length){
alert("Selecione um arquivo CSV")
return
}

const arquivo = input.files[0]

const reader = new FileReader()

reader.onload = function(e){

const texto = e.target.result
const linhas = texto.split(/\r?\n/)

if(linhas.length < 2){
alert("CSV inválido")
return
}

// detectar separador
let separador = ";"
if(linhas[0].includes(",") && !linhas[0].includes(";")){
separador = ","
}

// cabeçalho
const cabecalho = linhas[0]
.split(separador)
.map(c => c.trim().toLowerCase())

// índices
const idx = {
nome: cabecalho.indexOf("nome"),
matricula: cabecalho.indexOf("matricula"),
turma: cabecalho.indexOf("turma"),
ra: cabecalho.indexOf("ra"),
eol: cabecalho.indexOf("eol"),
inep: cabecalho.indexOf("inep"),
dataMatricula: cabecalho.indexOf("datamatricula"),
situacao: cabecalho.indexOf("situacao")
}

let alunos = getAlunos()
salvarAlunos(alunos)

let adicionados = 0
let atualizados = 0
let ignorados = 0

for(let i=1; i<linhas.length; i++){

let linha = linhas[i]
if(!linha.trim()) continue

let partes = linha.split(separador)

const aluno = {
nome: formatarNome(partes[idx.nome] || ""),
matricula: (partes[idx.matricula] || "").trim(),
turma: (partes[idx.turma] || "").trim(),
ra: (partes[idx.ra] || "").trim(),
eol: (partes[idx.eol] || "").trim(),
inep: (partes[idx.inep] || "").trim(),
dataMatricula: converterDataUniversal(partes[idx.dataMatricula] || ""),
situacao: normalizarOpcao("situacao", partes[idx.situacao] || "")
}

// validação
if(!aluno.nome || !aluno.matricula){
ignorados++
continue
}

// verificar se já existe
const index = alunos.findIndex(a => a.matricula === aluno.matricula)

if(index === -1){
alunos.push(aluno)
adicionados++
}else{
alunos[index] = { ...alunos[index], ...aluno }
atualizados++
}

}

localStorage.setItem("alunos", JSON.stringify(alunos))

alert(
`Importação concluída 🚀

Adicionados: ${adicionados}
Atualizados: ${atualizados}
Ignorados: ${ignorados}`
)

}

reader.readAsText(arquivo, "UTF-8")

}

// =========================
// FORMATAR NOME
// =========================
function formatarNome(nome){

if(!nome) return ""

nome = nome.toLowerCase().trim()

nome = nome.replace(/\s+/g, " ")

const minusculas = [
"da","de","do","das","dos","e"
]

return nome.split(" ").map((palavra, index) => {

if(minusculas.includes(palavra) && index !== 0){
return palavra
}

return palavra.charAt(0).toUpperCase() + palavra.slice(1)

}).join(" ")

}