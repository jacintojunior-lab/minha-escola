// =========================
// ABAS DA PÁGINA
// =========================

export function abrirAbaConfig(nome, el){

  document.querySelectorAll(".conteudo-aba").forEach(div => {
    div.classList.remove("ativo")
  })

  document.querySelectorAll(".abas-config .aba").forEach(btn => {
    btn.classList.remove("ativa")
  })

  const aba = document.getElementById("aba-" + nome)

  if(aba){
    aba.classList.add("ativo")
  }

  if(el){
    el.classList.add("ativa")
  }

  localStorage.setItem("abaConfig", nome)
}

document.addEventListener("DOMContentLoaded", () => {

  const abas = document.querySelectorAll(".abas-config .aba")

  abas.forEach(btn => {
    btn.addEventListener("click", () => {
      abrirAbaConfig(btn.dataset.aba, btn)
    })
  })

  const abaSalva = localStorage.getItem("abaConfig") || "geral"

  const btnAtivo = [...abas].find(btn => btn.dataset.aba === abaSalva)

  if(btnAtivo){
    abrirAbaConfig(abaSalva, btnAtivo)
  }

})