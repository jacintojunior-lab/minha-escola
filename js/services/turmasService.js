import { getData } from "../core/storage.js"

export function getTurmas(){
  return getData("turmas") || []
}

export function getTurmasAtivas(){
  return getTurmas().filter(t => (t.status || "Ativa") === "Ativa")
}