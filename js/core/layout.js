/* =========================
   MENU
========================= */

function configurarMenu(){

  const btnMenu = document.getElementById("btnMenu")
  const btnFecharMenu = document.getElementById("btnFecharMenu")
  const sidebar = document.getElementById("sidebar")

  if(!sidebar) return

  // Restaurar estado salvo no desktop
  const menuRecolhido = localStorage.getItem("menuRecolhido")

  if(menuRecolhido === "sim" && window.innerWidth > 768){
    document.body.classList.add("sidebar-recolhida")
  }

  if(btnMenu){

    btnMenu.addEventListener("click", () => {

      if(window.innerWidth <= 768){

        sidebar.classList.add("aberta")

      }else{

        document.body.classList.toggle("sidebar-recolhida")

        const recolhida = document.body.classList.contains("sidebar-recolhida")

        localStorage.setItem("menuRecolhido", recolhida ? "sim" : "nao")

      }

    })

  }

  if(btnFecharMenu){

    btnFecharMenu.addEventListener("click", () => {
      sidebar.classList.remove("aberta")
    })

  }

}

/* =========================
   BUSCA GLOBAL
========================= */

function configurarBuscaGlobal(){

  const input = document.getElementById("buscaGlobal")
  const box = document.getElementById("resultadoBuscaGlobal")

  if(!input || !box) return

  input.addEventListener("input", () => {

    const termo = input.value.trim().toLowerCase()

    if(termo.length < 2){
      box.classList.remove("ativo")
      box.innerHTML = ""
      return
    }

    const alunos = JSON.parse(localStorage.getItem("alunos")) || []

    const resultados = alunos.filter(a =>
      (a.nome || "").toLowerCase().includes(termo) ||
      (a.matricula || "").toLowerCase().includes(termo) ||
      (a.rga || "").toLowerCase().includes(termo)
    )

    if(resultados.length === 0){
      box.innerHTML = `<div class="item-busca-global">Nenhum aluno encontrado</div>`
      box.classList.add("ativo")
      return
    }

    box.innerHTML = resultados.map(a => `
      <div class="item-busca-global" data-rga="${a.matricula || a.rga}">
        <strong>${a.nome}</strong>
        <small>RGA: ${a.matricula || a.rga || "-"} • Turma: ${a.turma || "-"}</small>
      </div>
    `).join("")

    box.innerHTML =
    resultados.map(a => `
        <div class="item-busca-global"
             data-rga="${a.matricula || a.rga}">
            <strong>${a.nome}</strong>
            <small>RGA: ${a.matricula || a.rga || "-"} • Turma: ${a.turma || "-"}</small>
        </div>
    `).join("") +

    `<div class="busca-total">
        ${resultados.length} aluno(s) encontrado(s)
    </div>`;

    box.classList.add("ativo")
  })

  box.addEventListener("click", e => {
    const item = e.target.closest(".item-busca-global")
    if(!item || !item.dataset.rga) return

    window.location.href = `aluno.html?rga=${encodeURIComponent(item.dataset.rga)}`
  })

  document.addEventListener("click", e => {
    if(!e.target.closest(".busca-global")){
      box.classList.remove("ativo")
    }
  })

}

/* =========================
   FOOTER AUTOMÁTICO
========================= */

function configurarFooter(){

  const footerTexto = document.getElementById("footerTexto")

  if(!footerTexto) return

  footerTexto.textContent =
    `© ${new Date().getFullYear()} – Sistema Escolar`

}

/* =========================
   INICIALIZAÇÃO
========================= */

document.addEventListener("DOMContentLoaded", () => {

  configurarMenu()
  configurarBuscaGlobal()
  configurarFooter()

})