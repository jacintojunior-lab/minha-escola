import { getData, setData } from "../core/storage.js"

export function getAlunos(){
  return getData("alunos")
}

export function salvarAlunos(alunos){
  setData("alunos", alunos)
}

export function buscarAluno(matricula){
  return getAlunos().find(a => a.matricula === matricula)
}