import { getData, setData } from "../core/storage.js"

// =========================
// GET
// =========================

export function getFuncionarios(){
  return getData("funcionarios")
}

// =========================
// SALVAR LISTA
// =========================

export function salvarFuncionarios(lista){
  setData("funcionarios", lista)
}

// =========================
// BUSCAR POR RF
// =========================

export function buscarFuncionario(rf){
  return getFuncionarios().find(f => f.rf === rf)
}

// =========================
// REMOVER
// =========================

export function removerFuncionario(rf){
  const lista = getFuncionarios().filter(f => f.rf !== rf)
  salvarFuncionarios(lista)
}

// =========================
// UPSERT (criar ou atualizar)
// =========================

export function salvarOuAtualizarFuncionario(funcionario){

  const lista = getFuncionarios()

  const index = lista.findIndex(f => f.rf === funcionario.rf)

  if(index !== -1){
    lista[index] = funcionario
  }else{
    lista.push(funcionario)
  }

  salvarFuncionarios(lista)
}