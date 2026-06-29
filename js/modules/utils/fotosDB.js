const DB_NAME = "sistemaEscolarDB"
const DB_VERSION = 1
const STORE_NAME = "fotosAlunos"

function abrirDB(){
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = function(event){
      const db = event.target.result

      if(!db.objectStoreNames.contains(STORE_NAME)){
        db.createObjectStore(STORE_NAME, { keyPath:"matricula" })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function salvarFotoAluno(matricula, fotoBase64){
  const db = await abrirDB()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)

    store.put({
      matricula:String(matricula),
      foto:fotoBase64,
      atualizadoEm:new Date().toISOString()
    })

    tx.oncomplete = () => resolve(true)
    tx.onerror = () => reject(tx.error)
  })
}

export async function buscarFotoAluno(matricula){
  const db = await abrirDB()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly")
    const store = tx.objectStore(STORE_NAME)

    const request = store.get(String(matricula))

    request.onsuccess = () => resolve(request.result?.foto || "")
    request.onerror = () => reject(request.error)
  })
}

export async function excluirFotoAluno(matricula){
  const db = await abrirDB()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)

    store.delete(String(matricula))

    tx.oncomplete = () => resolve(true)
    tx.onerror = () => reject(tx.error)
  })
}

export async function listarFotosAlunos(){
  const db = await abrirDB()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly")
    const store = tx.objectStore(STORE_NAME)

    const request = store.getAll()

    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
}

export async function restaurarFotosAlunos(fotos = []){
  const db = await abrirDB()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)

    fotos.forEach(foto => {
      if(foto?.matricula && foto?.foto){
        store.put(foto)
      }
    })

    tx.oncomplete = () => resolve(true)
    tx.onerror = () => reject(tx.error)
  })
}

export async function limparFotosAlunos(){
  const db = await abrirDB()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)

    store.clear()

    tx.oncomplete = () => resolve(true)
    tx.onerror = () => reject(tx.error)
  })
}