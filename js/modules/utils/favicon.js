export function aplicarFaviconDinamico(){

  const dados = JSON.parse(localStorage.getItem("escola")) || {}

  if(!dados.logo) return

  const img = new Image()

  img.onload = function(){

    const canvas = document.createElement("canvas")
    const size = 64

    canvas.width = size
    canvas.height = size

    const ctx = canvas.getContext("2d")

    // centralizar imagem
    const scale = Math.min(size / img.width, size / img.height)
    const x = (size - img.width * scale) / 2
    const y = (size - img.height * scale) / 2

    ctx.drawImage(img, x, y, img.width * scale, img.height * scale)

    const faviconBase64 = canvas.toDataURL("image/png")

    const link = document.getElementById("favicon")

    if(link){
      link.href = faviconBase64
    }

  }

  img.src = dados.logo

}