// =========================
// ABAS DA PÁGINA
// =========================

export function abrirAbaConfig(nome, el){

  // esconder conteúdos
  document.querySelectorAll(".conteudo-aba").forEach(div => {
    div.classList.remove("ativo")
  })

  // remover ativo dos botões
  document.querySelectorAll(".abas-aluno .aba").forEach(btn => {
    btn.classList.remove("ativa")
  })

  // ativar conteúdo
  document.getElementById("aba-" + nome).classList.add("ativo")

  // 🔥 usar o elemento recebido
  if(el){
    el.classList.add("ativa")
  }

  // salvar aba
  localStorage.setItem("abaConfig", nome)
}

document.addEventListener("DOMContentLoaded", () => {

  const abas = document.querySelectorAll(".abas-aluno .aba")

  abas.forEach(btn => {
    btn.addEventListener("click", () => {
      const nome = btn.dataset.aba
      abrirAbaConfig(nome, btn)
    })
  })

  // restaurar aba salva
  const abaSalva = localStorage.getItem("abaConfig") || "geral"

  const btnAtivo = [...abas].find(btn => btn.dataset.aba === abaSalva)

  if(btnAtivo){
    abrirAbaConfig(abaSalva, btnAtivo)
  }

})