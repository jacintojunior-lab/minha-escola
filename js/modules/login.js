import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js"
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore-lite.js"
import { auth, db } from "../firebase/firebase.js"

const form = document.getElementById("formLogin")
const erroLogin = document.getElementById("erroLogin")

console.log("login.js carregado")

form.addEventListener("submit", async e => {
  e.preventDefault()

  console.log("clicou em entrar")

  erroLogin.textContent = "Entrando..."

  const email = document.getElementById("email").value.trim()
  const senha = document.getElementById("senha").value

  try{
    const credencial = await signInWithEmailAndPassword(auth, email, senha)

    console.log("login Firebase OK", credencial.user.uid)

    const uid = credencial.user.uid

    const refUsuario = doc(db, "usuarios", uid)
    console.log(db)
    console.log(refUsuario)
    const snapUsuario = await getDoc(refUsuario)
    console.log(snapUsuario)

    if(!snapUsuario.exists()){
      erroLogin.textContent = "Usuário sem perfil cadastrado."
      return
    }

    const usuario = snapUsuario.data()

    if(usuario.ativo === false){
      erroLogin.textContent = "Usuário inativo."
      return
    }

    localStorage.setItem("usuarioLogado", JSON.stringify({
      uid,
      email,
      nome: usuario.nome || "",
      perfil: usuario.perfil || "",
      escolaId: usuario.escolaId || ""
    }))

    window.location.href = "dashboard.html"

  }catch(erro){
    console.error("Erro no login:", erro)
    erroLogin.textContent = erro.message || "E-mail ou senha inválidos."
  }
})