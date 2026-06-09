import { getData } from "../core/storage.js"

export function getTurmas(){
  return getData("turmas")
}