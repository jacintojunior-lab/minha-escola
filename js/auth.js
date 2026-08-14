const usuario = JSON.parse(localStorage.getItem("usuarioLogado"))

if (!usuario) {
  window.location.href = "login.html"
}

const nome=document.getElementById("usuarioNome")

const perfil=document.getElementById("usuarioPerfil")

if(nome){

    nome.textContent=usuario.nome

}

const perfis = {
  proprietario: "Proprietário",
  administrador: "Administrador",
  secretaria: "Secretaria",
  coordenacao: "Coordenação",
  professor: "Professor"
}

if (perfil) {
  const perfilFormatado =
    perfis[(usuario.perfil || "").toLowerCase()] || usuario.perfil

  perfil.textContent = perfilFormatado
}

document.getElementById("btnSair")?.addEventListener("click",()=>{

    localStorage.removeItem("usuarioLogado")

    window.location.href="login.html"

})