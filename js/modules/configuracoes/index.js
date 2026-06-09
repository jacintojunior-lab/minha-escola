import { abrirAbaConfig } from "./ui.js"
import { salvarDadosEscola } from "./escola.js"

import { 
  importarCSV,
  importarCSVCompleto,
  importarCSVAlunosCompletoSimples,
  lerPlanilha,
  confirmarImportacao
} from "./importacao.js"

import { 
  gerarBackup,
  resetarSistema,
  apagarTodosAlunos
} from "./backup.js"

import { aplicarFaviconDinamico } from "../utils/favicon.js"

document.addEventListener("DOMContentLoaded", () => {

  // =========================
  // SALVAR ESCOLA
  // =========================
  document.getElementById("formEscola")
  .addEventListener("submit", (e) => {
    e.preventDefault()
    salvarDadosEscola()
  })

  // =========================
  // IMPORTAÇÕES
  // =========================
  document.getElementById("btnImportarCSV")
  ?.addEventListener("click", importarCSV)

  document.getElementById("btnImportarCompleto")
  ?.addEventListener("click", importarCSVCompleto)

  document.getElementById("btnImportarNovo")
  ?.addEventListener("click", importarCSVAlunosCompletoSimples)

  document.getElementById("btnLerPlanilha")
  ?.addEventListener("click", lerPlanilha)

  document.getElementById("btnConfirmarImport")
  ?.addEventListener("click", confirmarImportacao)

  // =========================
  // BACKUP
  // =========================
  document.getElementById("btnBackup")
  ?.addEventListener("click", gerarBackup)

  document.getElementById("btnApagarAlunos")
  ?.addEventListener("click", apagarTodosAlunos)

  document.getElementById("btnResetarSistema")
  ?.addEventListener("click", resetarSistema)

  // =========================
  // FAVICO DINÂMICO
  // =========================

   aplicarFaviconDinamico()


})