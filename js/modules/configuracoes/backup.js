import { setData } from "../../core/storage.js"

// =========================
// GERAR BACKUP
// =========================
export function gerarBackup(){

  const backup = {
    alunos: JSON.parse(localStorage.getItem("alunos")) || [],
    turmas: JSON.parse(localStorage.getItem("turmas")) || [],
    funcionarios: JSON.parse(localStorage.getItem("funcionarios")) || [],
    escola: JSON.parse(localStorage.getItem("escola")) || {},
    cesta_basica: JSON.parse(localStorage.getItem("cesta_basica")) || []
  }

  const json = JSON.stringify(backup, null, 2)

  const blob = new Blob([json], { type: "application/json" })

  const url = URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = url

  const data = new Date().toISOString().slice(0,10)
  a.download = `backup-escolar-${data}.json`

  a.click()

  URL.revokeObjectURL(url)
}

// =========================
// RESTAURAR BACKUP
// =========================
export function restaurarBackup(event){

  const file = event.target.files[0]
  if(!file) return

    // 🔥 CONFIRMAÇÃO
  const confirmar = confirm(
    "⚠️ ATENÇÃO!\n\n" +
    "Restaurar um backup irá substituir TODOS os dados atuais.\n\n" +
    "Deseja continuar?"
  )

   if(!confirmar){
    event.target.value = "" // limpa input
    return
  }

  const reader = new FileReader()

  reader.onload = function(e){

    const dados = JSON.parse(e.target.result)

    if(dados.alunos) localStorage.setItem("alunos", JSON.stringify(dados.alunos))
    if(dados.turmas) localStorage.setItem("turmas", JSON.stringify(dados.turmas))
    if(dados.funcionarios) localStorage.setItem("funcionarios", JSON.stringify(dados.funcionarios))
    if(dados.escola) localStorage.setItem("escola", JSON.stringify(dados.escola))
    if(dados.cesta_basica) localStorage.setItem("cesta_basica", JSON.stringify(dados.cesta_basica))

    alert("Backup restaurado com sucesso!")
    location.reload()
  }

  reader.readAsText(file)
}

document.addEventListener("DOMContentLoaded", () => {

  document.getElementById("importarBackup")
  ?.addEventListener("change", restaurarBackup)

})

// =========================
// RESETAR SISTEMA
// =========================
export function resetarSistema(){

    const confirmar = confirm(
        "⚠️ ATENÇÃO MÁXIMA!\n\n" +
        "Esta ação irá APAGAR TODOS OS DADOS do sistema.\n\n" +
        "Deseja continuar?"
    )

    if(!confirmar) return

    // 🔥 CONFIRMAR BACKUP (AGORA NO LUGAR CERTO)
    const fazerBackup = confirm("Deseja fazer um backup antes de apagar?")

    if(fazerBackup){
        gerarBackup()
    }

    const confirmacaoTexto = prompt(
        "Digite APAGAR para confirmar:"
    )

    if(confirmacaoTexto !== "APAGAR"){
        alert("Operação cancelada.")
        return
    }

    // RESET
    setData("alunos", [])
    localStorage.removeItem("turmas")
    localStorage.removeItem("funcionarios")
    localStorage.removeItem("escola")
    localStorage.removeItem("cesta_basica")

    alert("Sistema resetado com sucesso!")

    location.reload()
}

// =========================
// APAGAR TODOS OS ALUNOS
// =========================
export function apagarTodosAlunos() {
    const confirmar = confirm(
        "ATENÇÃO!\n\n" +
        "Esta ação apagará TODOS os alunos cadastrados.\n" +
        "Essa operação NÃO pode ser desfeita.\n\n" +
        "Deseja continuar?"
    );

    if (!confirmar) return;

    setData("alunos", []);

    alert("Todos os alunos foram removidos com sucesso.");
}
