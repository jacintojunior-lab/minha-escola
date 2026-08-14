const PDFJS_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs";

const PDFJS_WORKER_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";

let pdfjsPromise = null;

async function getPdfJs() {
  if (!pdfjsPromise) {
    pdfjsPromise =
      import(PDFJS_URL).then(
        (pdfjsLib) => {
          pdfjsLib
            .GlobalWorkerOptions
            .workerSrc =
            PDFJS_WORKER_URL;

          return pdfjsLib;
        }
      );
  }

  return pdfjsPromise;
}

function baixarBlob(
  blob,
  nome
) {
  const url =
    URL.createObjectURL(blob);

  const a =
    document.createElement("a");

  a.href = url;

  a.download = nome;

  document.body.appendChild(a);

  a.click();

  a.remove();

  setTimeout(
    () =>
      URL.revokeObjectURL(url),
    1500
  );
}

function normalizarRotacao(
  valor
) {
  return (
    (
      Number(valor) %
      360
    ) +
    360
  ) %
  360;
}

export async function carregarArquivoPdf(
  file,
  sourceId
) {
  const bytes =
    new Uint8Array(
      await file.arrayBuffer()
    );

  const pdfjsLib =
    await getPdfJs();

  const visualDoc =
    await pdfjsLib
      .getDocument({
        data: bytes.slice()
      })
      .promise;

  return {
    id: sourceId,
    name: file.name,
    size: file.size,
    bytes,
    visualDoc,
    pageCount:
      visualDoc.numPages
  };
}

export async function renderizarPagina(
  source,
  pageIndex,
  canvas,
  rotation = 0,
  maxWidth = 220,
  maxHeight = 280
) {
  const page =
    await source.visualDoc
      .getPage(
        pageIndex + 1
      );

  const baseViewport =
    page.getViewport({
      scale: 1,
      rotation:
        normalizarRotacao(
          rotation
        )
    });

  const scale =
    Math.min(
      maxWidth /
        baseViewport.width,

      maxHeight /
        baseViewport.height
    );

  const viewport =
    page.getViewport({
      scale:
        Math.max(
          scale,
          0.1
        ),

      rotation:
        normalizarRotacao(
          rotation
        )
    });

  const context =
    canvas.getContext(
      "2d",
      {
        alpha: false
      }
    );

  const dpr =
    window.devicePixelRatio ||
    1;

  canvas.width =
    Math.floor(
      viewport.width *
      dpr
    );

  canvas.height =
    Math.floor(
      viewport.height *
      dpr
    );

  canvas.style.width =
    `${Math.floor(
      viewport.width
    )}px`;

  canvas.style.height =
    `${Math.floor(
      viewport.height
    )}px`;

  context.setTransform(
    dpr,
    0,
    0,
    dpr,
    0,
    0
  );

  await page.render({
    canvasContext:
      context,

    viewport
  }).promise;
}

async function carregarPdfLibSource(
  source
) {
  return PDFLib.PDFDocument.load(
    source.bytes.slice(),
    {
      ignoreEncryption:
        false
    }
  );
}

export async function criarPdfDasPaginas(
  paginas,
  sources
) {
  if (!paginas.length) {
    throw new Error(
      "Nenhuma página disponível para gerar o PDF."
    );
  }

  const novoPdf =
    await PDFLib.PDFDocument.create();

  const cache =
    new Map();

  for (
    const pagina of paginas
  ) {
    let sourceDoc =
      cache.get(
        pagina.sourceId
      );

    if (!sourceDoc) {
      const source =
        sources.find(
          (item) =>
            item.id ===
            pagina.sourceId
        );

      if (!source) {
        throw new Error(
          "Arquivo de origem não encontrado."
        );
      }

      sourceDoc =
        await carregarPdfLibSource(
          source
        );

      cache.set(
        pagina.sourceId,
        sourceDoc
      );
    }

    const [
      paginaCopiada
    ] =
      await novoPdf.copyPages(
        sourceDoc,
        [
          pagina.pageIndex
        ]
      );

    const rotacaoOriginal =
      paginaCopiada
        .getRotation()
        ?.angle || 0;

    paginaCopiada.setRotation(
      PDFLib.degrees(
        normalizarRotacao(
          rotacaoOriginal +
          pagina.rotation
        )
      )
    );

    novoPdf.addPage(
      paginaCopiada
    );
  }

  return novoPdf.save();
}

export async function baixarPdf(
  paginas,
  sources,
  nomeArquivo
) {
  const bytes =
    await criarPdfDasPaginas(
      paginas,
      sources
    );

  const blob =
    new Blob(
      [bytes],
      {
        type:
          "application/pdf"
      }
    );

  baixarBlob(
    blob,
    nomeArquivo
  );
}

export async function baixarPaginasSeparadasZip(
  paginas,
  sources,
  nomeArquivo =
    "documento-dividido.zip"
) {
  if (!window.JSZip) {
    throw new Error(
      "JSZip não foi carregado."
    );
  }

  const zip =
    new JSZip();

  for (
    let i = 0;
    i < paginas.length;
    i++
  ) {
    const bytes =
      await criarPdfDasPaginas(
        [paginas[i]],
        sources
      );

    zip.file(
      `pagina-${String(
        i + 1
      ).padStart(
        2,
        "0"
      )}.pdf`,

      bytes
    );
  }

  const blob =
    await zip.generateAsync({
      type: "blob"
    });

  baixarBlob(
    blob,
    nomeArquivo
  );
}