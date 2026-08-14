import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js"
import { getAuth } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js"
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore-lite.js"

const firebaseConfig = {
  apiKey: "AIzaSyBVMLCiVwWQ8uN7sdRUJt0-NbnbaxrpYTg",
  authDomain: "minha-escola-online.firebaseapp.com",
  projectId: "minha-escola-online",
  storageBucket: "minha-escola-online.firebasestorage.app",
  messagingSenderId: "757323618212",
  appId: "1:757323618212:web:f2472471094770d6e39331"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app, "default")